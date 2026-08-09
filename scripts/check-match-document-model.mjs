import assert from 'node:assert/strict'
import {
  MATCH_DOCUMENT_SCHEMA_VERSION,
  inspectMatchDocument,
  normalizeMatchDocument,
  normalizeMatchHomeAway,
  parseScore,
  resolveMatchLocation,
} from '../src/modules/match/matchModel.js'
import { validateMatchCore } from '../src/modules/match/matchValidation.js'

assert.equal(MATCH_DOCUMENT_SCHEMA_VERSION, 1)

const normalizedEditor = normalizeMatchDocument({
  id: 'event-1',
  date: '2026-08-08T12:00:00Z',
  time: '15:30:59',
  opponent: ' Copparese ',
  venue: 'Trasferta',
  location: 'Stadio Comunale',
  result_home: '2',
  result_away: '1',
})
assert.equal(normalizedEditor.eventId, 'event-1')
assert.equal(normalizedEditor.date, '2026-08-08')
assert.equal(normalizedEditor.time, '15:30')
assert.equal(normalizedEditor.opponent, 'Copparese')
assert.equal(normalizedEditor.homeAway, 'away')
assert.equal(normalizedEditor.location, 'Stadio Comunale')
assert.equal(normalizedEditor.result, '2-1')

const normalizedLibrary = normalizeMatchDocument({
  homeAway: 'away',
  venue: 'Stadio Kennedy',
})
assert.equal(normalizedLibrary.homeAway, 'away')
assert.equal(normalizedLibrary.location, 'Stadio Kennedy')

assert.equal(normalizeMatchHomeAway('Casa'), 'home')
assert.equal(normalizeMatchHomeAway('Trasferta'), 'away')
assert.equal(normalizeMatchHomeAway('Campo neutro'), 'neutral')
assert.equal(resolveMatchLocation({ venue: 'Casa' }), '')
assert.equal(resolveMatchLocation({ venue: 'Stadio Dall’Ara' }), 'Stadio Dall’Ara')
assert.deepEqual(parseScore('10:2'), { home: '10', away: '2', display: '10-2' })

const incomplete = inspectMatchDocument({})
assert.equal(incomplete.valid, false)
assert.deepEqual(incomplete.errors.map((issue) => issue.field), ['date', 'opponent'])
assert.ok(incomplete.warnings.some((issue) => issue.field === 'time'))
assert.ok(incomplete.warnings.some((issue) => issue.field === 'location'))

const valid = validateMatchCore({
  date: '2026-08-08',
  opponent: 'Copparese',
})
assert.equal(valid.valid, true)
assert.deepEqual(valid.errors, [])

console.log('MATCH DOCUMENT MODEL CHECK: OK (15/15)')
