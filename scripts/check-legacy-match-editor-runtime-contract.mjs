import fs from 'node:fs'
const read=(path)=>fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const app=read('src/app/appController.js')
const heavy=read('src/app/appHeavyFeatureEvents.js')
const legacy=read('src/modules/match/events/legacyMatchEditorEvents.js')
const checks=[
 ['Legacy Match Editor moved to Match-owned event module',heavy.includes("import('../modules/match/events/legacyMatchEditorEvents.js')")&&legacy.includes('export function wireLegacyMatchEditorEvents({')],
 ['Legacy Match Editor is orchestrated by bindDynamic',app.includes('heavyBinders.wireLegacyMatchEditorEvents({')],
 ['formation change updates positions',legacy.includes("formationSelect.addEventListener('change'")&&legacy.includes('applyFormation(formationSelect.value)')],
 ['custom formation remains wired',legacy.includes("form.elements.custom_formation.addEventListener('change'")&&legacy.includes("applyFormation('Personalizzato')")],
 ['own-team token dragging remains wired',legacy.includes('const bindTokenDragging = () =>')&&legacy.includes('data-player-token')&&legacy.includes("token.addEventListener('pointerdown'")],
 ['token labels/numbers remain synchronized',legacy.includes('const updateTokens = () =>')&&legacy.includes("form.elements[`starter_${i}`]?.value")&&legacy.includes('label.textContent = showSurname ? surname')],
 ['captain and vice remain linked to starting XI',legacy.includes('const refreshLeadershipSelects = () =>')&&legacy.includes('const assignLeadershipRole = (role, playerIndex) =>')&&legacy.includes('requestFrame(refreshLeadershipSelects)')],
 ['editable bench and structural 20-player contract remain wired',legacy.includes('MATCH_LINEUP_MAX_BENCH')&&legacy.includes('bench_number_${index}')&&legacy.includes('data-bench-select')&&legacy.includes('Distinta: ${total}/20')&&!legacy.includes('deriveMatchLineupBench')],
 ['temporary duplicates are warned and cannot reach canonical snapshot',legacy.includes('Giocatore già utilizzato:')&&legacy.includes('duplicateLineupPlayers().length')&&legacy.includes('if (!hasLineupDuplicates) scheduleCanonicalSquadSave()')],
 ['opponent system and token dragging remain wired',legacy.includes('const bindOpponentTokenDragging = () =>')&&legacy.includes('const addOpponentFormation = (data = {}, requestedIndex = null) =>')&&legacy.includes('opponentInitialSystemSelect')],
 ['form mutation keeps direct Distinta controls on their dedicated owner',legacy.includes('const handleMatchFormMutation = (event) =>')&&legacy.includes('/^(?:starter|bench)_(?:number_)?\\d+$/')&&legacy.includes('updateTokens()')&&legacy.includes('renderReport()')&&legacy.includes('scheduleSave()')],
 ['Match Report Calendar publish remains wired',legacy.includes('calendarService.publish({')&&legacy.includes('printMatchReport(printable)')],
]
let passed=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nLegacy Match Editor Runtime Contract: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
