import fs from 'node:fs'
const read = (path) => fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const app = read('src/app/appController.js')
const heavy = read('src/app/appHeavyFeatureEvents.js')
const legacy = read('src/modules/match/events/legacyMatchEditorEvents.js')
const view = read('src/modules/match/ui/matchSquadView.js')
const docs = read('docs/ARCHITECTURE_DECOMPOSITION_PHASE_15.md')
const checks = [
  ['Legacy Match Editor physically extracted', heavy.includes("import('../modules/match/events/legacyMatchEditorEvents.js')")],
  ['Controller composes Legacy Match Editor wiring', app.includes('heavyBinders.wireLegacyMatchEditorEvents({')],
  ['Inline Legacy Match Editor function removed', !app.includes('function wireLegacyMatchEditorEvents()')],
  ['Match module owns legacy editor root', legacy.includes("querySelector('[data-match-editor]')")],
  ['Match module owns formation and pitch behavior', legacy.includes('applyFormation(formationSelect.value)') && legacy.includes('bindTokenDragging()')],
  ['Match module owns the editable 20-slot Distinta from one callups option source without a derived bench source', view.includes('data-bench-select') && view.includes('bench_number_${index}') && !view.includes('rosterOptions') && legacy.includes('updateLineupSelectionState') && legacy.includes('findMatchLineupDuplicatePlayers') && legacy.includes("const name = player ? selectedName : ''") && !legacy.includes('deriveMatchLineupBench') && !legacy.includes('updateDerivedBench')],
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
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nArchitecture Decomposition Phase 15: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
