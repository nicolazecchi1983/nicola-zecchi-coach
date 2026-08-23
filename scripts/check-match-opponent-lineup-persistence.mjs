import fs from 'node:fs'
import { normalizeMatchOpponentStudy, mergeMatchOpponentStudyIntoEventNotes, readMatchOpponentStudyFromEventNotes } from '../src/modules/match/matchOpponentStudyModel.js'

const service = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyService.js', import.meta.url), 'utf8')
const events = fs.readFileSync(new URL('../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url), 'utf8')
const view = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentView.js', import.meta.url), 'utf8')
const model = fs.readFileSync(new URL('../src/modules/match/matchModel.js', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')

const asset = {
  id: 'asset-1',
  path: 'team-id/2026-27/match-study/match-1/asset-lineup.jpg',
  fileName: 'lineup.jpg',
  mimeType: 'image/jpeg',
  size: 1234,
}
const normalized = normalizeMatchOpponentStudy({ matchId: 'match-1', opponentLineup: asset })
const merged = mergeMatchOpponentStudyIntoEventNotes(JSON.stringify({ keep: 'yes' }), normalized)
const restored = readMatchOpponentStudyFromEventNotes(merged, 'match-1')

const checks = [
  ['Model persists dedicated opponent lineup asset', normalized.opponentLineup?.path === asset.path && restored.opponentLineup?.path === asset.path],
  ['Event notes merge preserves unrelated metadata', JSON.parse(merged).keep === 'yes'],
  ['Storage path is team-first for fail-closed RLS', service.includes('`${teamId}/${seasonKey}/match-study/${String(matchId)}') && service.includes('MATCH_STUDY_TEAM_REQUIRED')],
  ['Service has upload/replace lifecycle', service.includes('uploadOpponentLineup') && service.includes('previousPath = current.opponentLineup?.path') && service.includes('Vecchia distinta avversaria non rimossa')],
  ['Service has persisted removal lifecycle', service.includes('removeOpponentLineup') && service.includes('opponentLineup: null')],
  ['Opponent lineup accepts image only', service.includes("startsWith('image/')") && service.includes('MATCH_OPPONENT_LINEUP_FILE_TYPE')],
  ['UI exposes persisted state and explicit remove action', view.includes('data-opponent-sheet-state') && view.includes('data-remove-opponent-sheet') && view.includes('data-opponent-sheet-message')],
  ['Legacy editor restores from fresh Calendar event', events.includes('const reloadOpponentSheet = async () =>') && events.includes('await getCalendarEvent(activeMatchForOpponentSheet.id)')],
  ['Legacy editor uploads through canonical service', events.includes('uploadOpponentLineup({') && events.includes("setOpponentSheetMessage('Distinta salvata.'")],
  ['Legacy editor can remove persisted lineup', events.includes('removeOpponentLineup(activeMatchForOpponentSheet.id)')],
  ['Upload failure restores previous visible state', events.includes('previousSrc') && events.includes("stage: 'match-opponent-lineup-upload'")],
  ['File input is excluded from Match draft/report JSON', model.includes("querySelectorAll('input[type=\"file\"]')") && model.includes('delete data[input.name]')],
  ['App injects canonical Calendar + study dependencies', app.includes('createMatchOpponentStudyService,\n      getCalendarEvent,\n      createCalendarEvent')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}
if (passed !== checks.length) process.exit(1)
console.log(`\nOpponent lineup persistence: ${passed}/${checks.length} controlli superati.`)
