import fs from 'node:fs'
import assert from 'node:assert/strict'
import {
  MATCH_CENTER_EVENT_TYPES,
  MATCH_CENTER_SCHEMA_VERSION,
  appendMatchCenterEvent,
  createMatchCenterEvent,
  matchCenterFingerprint,
  mergeMatchCenterIntoEventNotes,
  normalizeMatchCenterState,
  readMatchCenterFromEventNotes,
  removeMatchCenterEvent,
} from '../src/modules/match/matchCenterModel.js'
import { createMatchCenterService } from '../src/modules/match/matchCenterService.js'

const modelSource = fs.readFileSync('src/modules/match/matchCenterModel.js', 'utf8')
const serviceSource = fs.readFileSync('src/modules/match/matchCenterService.js', 'utf8')

const checks = []
function check(label, fn) {
  try {
    fn()
    checks.push([label, true])
  } catch (error) {
    checks.push([`${label}: ${error.message}`, false])
  }
}

check('schema Match Center v1', () => {
  assert.equal(MATCH_CENTER_SCHEMA_VERSION, 1)
})

check('eventi canonici coprono gol, cambi, sanzioni e cambio sistema', () => {
  assert.deepEqual(MATCH_CENTER_EVENT_TYPES, ['goal', 'substitution', 'sanction', 'formation_change'])
})

check('Match Center non duplica XI o panchina del PRE', () => {
  assert.ok(!/\bstarters\b/.test(modelSource))
  assert.ok(!/\bbench\b/.test(modelSource))
  assert.ok(!/match_squad_snapshot/.test(modelSource))
})

const baseNotes = JSON.stringify({
  type: 'match_event',
  schema_version: 1,
  opponent: 'Ravenna',
  match_squad_snapshot: { formation: '4-3-3', schema_version: 1 },
  opponent_study: { notes: { strengths: 'Pressione alta' } },
  post_match: { schema_version: 2, sections: [] },
  match_report: { result: '2-1' },
})

const goal = createMatchCenterEvent({
  type: 'goal',
  side: 'our',
  minute: 12,
  scorer: { playerId: 'p9', name: 'Attaccante' },
  assist: { playerId: 'p7', name: 'Esterno' },
}, { id: 'evt-goal-1', now: '2026-09-03T15:00:00.000Z', sequence: 0 })

const substitution = createMatchCenterEvent({
  type: 'substitution',
  minute: 61,
  out: { playerId: 'p8', name: 'Centrocampista A' },
  in: { playerId: 'p14', name: 'Centrocampista B' },
  reason: 'Tattico',
}, { id: 'evt-sub-1', now: '2026-09-03T16:00:00.000Z', sequence: 1 })

let state = normalizeMatchCenterState({
  status: 'in_progress',
  period: 'second_half',
  score: { our: 0, opponent: 0 },
})
state = appendMatchCenterEvent(state, goal)
state = appendMatchCenterEvent(state, substitution)

check('gol timeline aggiorna automaticamente il punteggio', () => {
  assert.deepEqual(state.score, { our: 1, opponent: 0 })
})

check('round trip canonico Match Center', () => {
  const notes = mergeMatchCenterIntoEventNotes(baseNotes, state)
  const parsed = JSON.parse(notes)
  const restored = readMatchCenterFromEventNotes(notes)
  assert.equal(parsed.match_center.schema_version, 1)
  assert.equal(restored.status, 'in_progress')
  assert.equal(restored.period, 'second_half')
  assert.deepEqual(restored.score, { our: 1, opponent: 0 })
  assert.equal(restored.events.length, 2)
  assert.equal(restored.events[0].scorer.playerId, 'p9')
  assert.equal(restored.events[1].in.playerId, 'p14')
})

check('merge preserva gli owner PRE e POST esistenti', () => {
  const parsed = JSON.parse(mergeMatchCenterIntoEventNotes(baseNotes, state))
  assert.equal(parsed.match_squad_snapshot.formation, '4-3-3')
  assert.equal(parsed.opponent_study.notes.strengths, 'Pressione alta')
  assert.equal(parsed.post_match.schema_version, 2)
  assert.equal(parsed.match_report.result, '2-1')
})

check('rimozione gol decrementa il punteggio senza toccare altri eventi', () => {
  const reduced = removeMatchCenterEvent(state, 'evt-goal-1')
  assert.equal(reduced.events.length, 1)
  assert.equal(reduced.events[0].id, 'evt-sub-1')
  assert.deepEqual(reduced.score, { our: 0, opponent: 0 })
  assert.equal(state.events.length, 2)
})

check('fingerprint ignora metadati di persistenza', () => {
  const a = matchCenterFingerprint({ ...state, updatedAt: 'A' })
  const b = matchCenterFingerprint({ ...state, updatedAt: 'B', persisted: true })
  assert.equal(a, b)
})

check('nessun result_home/result_away nel nuovo owner canonico', () => {
  assert.ok(!modelSource.includes('result_home'))
  assert.ok(!modelSource.includes('result_away'))
  assert.ok(!serviceSource.includes('result_home'))
  assert.ok(!serviceSource.includes('result_away'))
})

let storedNotes = baseNotes
let getCount = 0
let updateCount = 0
let reloadCount = 0
let lastUpdatedId = ''

const service = createMatchCenterService({
  getEvent: async (id) => {
    getCount += 1
    return { id, notes: storedNotes }
  },
  updateEvent: async (id, patch) => {
    updateCount += 1
    lastUpdatedId = id
    storedNotes = patch.notes
    return { id }
  },
  reloadEvents: async () => { reloadCount += 1 },
  now: () => '2026-09-03T17:00:00.000Z',
  createId: () => 'evt-service-1',
})

await service.setMatchState('match-123', {
  status: 'in_progress',
  period: 'first_half',
  score: { our: 0, opponent: 0 },
})
await service.appendEvent('match-123', {
  type: 'goal',
  side: 'opponent',
  minute: 22,
})

check('service rilegge evento fresco prima di ogni mutazione', () => {
  assert.equal(getCount, 2)
  assert.equal(updateCount, 2)
})

check('service aggiorna lo stesso Calendar event ID', () => {
  assert.equal(lastUpdatedId, 'match-123')
})

check('service preserva metadata estranei durante mutazioni successive', () => {
  const parsed = JSON.parse(storedNotes)
  assert.equal(parsed.opponent, 'Ravenna')
  assert.equal(parsed.match_squad_snapshot.formation, '4-3-3')
  assert.equal(parsed.match_center.events[0].id, 'evt-service-1')
})

check('service sincronizza score con goal event', () => {
  const parsed = JSON.parse(storedNotes)
  assert.deepEqual(parsed.match_center.score, { our: 0, opponent: 1 })
})

check('service marca updated_at e ricarica Calendario', () => {
  const parsed = JSON.parse(storedNotes)
  assert.equal(parsed.match_center.updated_at, '2026-09-03T17:00:00.000Z')
  assert.equal(reloadCount, 2)
})

check('service non introduce seconda persistenza o accesso Supabase diretto', () => {
  assert.ok(!/supabase/i.test(modelSource))
  assert.ok(!/supabase/i.test(serviceSource))
  assert.ok(serviceSource.includes('updateEvent(event.id, { notes })'))
})

for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`)
}

const failed = checks.filter(([, passed]) => !passed)
console.log(`\nMatch Center Domain Foundation: ${checks.length - failed.length}/${checks.length}`)
if (failed.length) process.exit(1)
