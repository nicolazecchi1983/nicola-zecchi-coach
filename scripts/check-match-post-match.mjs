import fs from 'node:fs'
import {
  mergeMatchPostMatchIntoEventNotes,
  normalizeMatchPostMatch,
  parsePostMatchMaterials,
  readMatchPostMatchFromEventNotes,
} from '../src/modules/match/matchPostMatchModel.js'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const service = fs.readFileSync('src/modules/match/matchPostMatchService.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchPostMatchView.js', 'utf8')
const workflow = fs.readFileSync('src/modules/match/matchWorkflowModel.js', 'utf8')
const matchWorkspaceEvents = fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js','utf8')

const sourceNotes = JSON.stringify({
  type: 'match_event',
  opponent: 'Comacchiese',
  match_report: { result: '2-1' },
  opponent_study: { notes: { strengths: 'Pressione' } },
})
const merged = mergeMatchPostMatchIntoEventNotes(sourceNotes, {
  debrief: 'Partita utile',
  positives: 'Costruzione',
  materials: [{ label: 'Video', url: 'https://example.com/video' }],
})
const parsed = JSON.parse(merged)
const loaded = readMatchPostMatchFromEventNotes(merged)
const validLinks = parsePostMatchMaterials('Video | https://example.com/video')
const invalidLinks = parsePostMatchMaterials('javascript:alert(1)')
const defaults = normalizeMatchPostMatch({}).sections

const checks = [
  ['Workflow mantiene Post gara tra le sette sezioni', workflow.includes("key: 'post-match'")],
  ['Post gara non usa più placeholder generico', !/function postMatchView\(\)[\s\S]{0,180}renderMatchWorkflowSectionView/.test(controller)],
  ['Controller usa vista Post gara dedicata', controller.includes('renderMatchPostMatchView')],
  ['Controller salva tramite servizio dedicato', controller.includes('createMatchPostMatchService')],
  ['Service rilegge evento fresco prima di salvare', service.includes('await getEvent(matchId)')],
  ['Service aggiorna le note dello stesso evento', service.includes('mergeMatchPostMatchIntoEventNotes(event.notes, next)')],
  ['Merge preserva Match Report esistente', parsed.match_report?.result === '2-1'],
  ['Merge preserva Studio avversario esistente', parsed.opponent_study?.notes?.strengths === 'Pressione'],
  ['Debrief Post gara viene riletto', loaded.debrief === 'Partita utile'],
  ['Link http/https accettato', validLinks.valid && validLinks.materials.length === 1],
  ['Protocollo non sicuro rifiutato', !invalidLinks.valid],
  ['Schema v2 espone priorità microciclo', defaults.some((section) => section.id === 'microcyclePriorities' && section.title === 'Priorità prossimo microciclo')],
  ['Schema v2 espone follow-up individuali', defaults.some((section) => section.id === 'individualFollowUps' && section.title === 'Follow-up individuali')],
  ['Schema v2 espone materiali collegati', defaults.some((section) => section.id === 'materials' && section.kind === 'materials')],
  ['Vista usa sezioni accordion chiuse', view.includes('data-post-match-section-toggle') && view.includes('aria-expanded=\"false\"')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nMatch Post Gara: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
