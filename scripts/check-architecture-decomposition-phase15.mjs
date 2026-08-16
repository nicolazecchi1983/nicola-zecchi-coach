import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const docs = fs.readFileSync('docs/ARCHITECTURE_DECOMPOSITION_PHASE_15.md', 'utf8')

const checks = [
  ['Legacy Match Editor physically extracted', app.includes("import { wireLegacyMatchEditorEvents } from '../modules/match/events/legacyMatchEditorEvents.js'")],
  ['Controller composes Legacy Match Editor wiring', app.includes('wireLegacyMatchEditorEvents({')],
  ['Inline Legacy Match Editor function removed', !app.includes('function wireLegacyMatchEditorEvents()')],
  ['Match module owns legacy editor root', legacy.includes("querySelector('[data-match-editor]')")],
  ['Match module owns formation and pitch behavior', legacy.includes('applyFormation(formationSelect.value)') && legacy.includes('bindTokenDragging()')],
  ['Match module owns fixed bench behavior', legacy.includes('const updateAutomaticBench = () =>') && legacy.includes('Array.from({ length: 9 }')],
  ['Match module owns leadership behavior', legacy.includes('assignLeadershipRole') && legacy.includes('refreshLeadershipSelects')],
  ['Match module owns opponent formation behavior', legacy.includes('bindOpponentTokenDragging') && legacy.includes('addOpponentFormation')],
  ['Match module owns report rendering/publish flow', legacy.includes('createMatchReportService') && legacy.includes('calendarService.publish({')],
  ['Storage remains injected', legacy.includes('storage = globalThis.localStorage') && !legacy.includes("from '../../../shared/storage")],
  ['App state remains injected', legacy.includes('appState') && !legacy.includes("from '../../../app/appStateStore")],
  ['Calendar persistence remains injected', legacy.includes('createCalendarEvent') && legacy.includes('updateCalendarEvent') && !legacy.match(/from .*calendarService/i)],
  ['No repository shortcut introduced', !legacy.match(/from .*Repository/i)],
  ['Controller remains composition root', docs.includes('appController.js` remains the composition root')],
  ['High-risk nested editor boundaries are now extracted', docs.includes('Training Editor and Legacy Match Editor are now both physically extracted')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nArchitecture Decomposition Phase 15: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
