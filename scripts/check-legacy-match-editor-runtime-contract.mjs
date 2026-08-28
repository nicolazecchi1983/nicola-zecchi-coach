import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js','utf8')
const heavy = fs.readFileSync('src/app/appHeavyFeatureEvents.js','utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')

const checks = [
  ['Legacy Match Editor moved to Match-owned event module', heavy.includes("import('../modules/match/events/legacyMatchEditorEvents.js')") && legacy.includes('export function wireLegacyMatchEditorEvents({')],
  ['Legacy Match Editor is orchestrated by bindDynamic', app.includes('heavyBinders.wireLegacyMatchEditorEvents({')],
  ['formation change updates positions',
    legacy.includes("formationSelect.addEventListener('change'") && legacy.includes('applyFormation(formationSelect.value)')],
  ['custom formation remains wired',
    legacy.includes("form.elements.custom_formation.addEventListener('change'") && legacy.includes("applyFormation('Personalizzato')")],
  ['own-team token dragging remains wired',
    legacy.includes('const bindTokenDragging = () =>') && legacy.includes('data-player-token') && legacy.includes("token.addEventListener('pointerdown'")],
  ['token labels/numbers remain synchronized',
    legacy.includes('const updateTokens = () =>') && legacy.includes("form.elements[`starter_${i}`]?.value") && legacy.includes('label.textContent = showSurname ? surname')],
  ['captain and vice remain linked to starting XI',
    legacy.includes('const refreshLeadershipSelects = () =>') && legacy.includes('const assignLeadershipRole = (role, playerIndex) =>') && legacy.includes('requestFrame(refreshLeadershipSelects)')],
  ['automatic bench and structural 20-player cap remain wired',
    legacy.includes('const updateAutomaticBench = () =>') &&
    legacy.includes('const benchSelects = Array.from({ length: 9 }') &&
    legacy.includes('const total = currentLineupSelections().starters.filter(Boolean).length + selectedBench') &&
    legacy.includes('Distinta: ${total}/20')],
  ['opponent system and token dragging remain wired',
    legacy.includes('const bindOpponentTokenDragging = () =>') && legacy.includes('const addOpponentFormation = (data = {}, requestedIndex = null) =>') && legacy.includes('opponentInitialSystemSelect')],
  ['form mutation refreshes dependent UI',
    legacy.includes('const handleMatchFormMutation = (event) =>') && legacy.includes('updateTokens()') && legacy.includes('updateAutomaticBench()') && legacy.includes('renderReport()') && legacy.includes('scheduleSave()')],
  ['Match Report Calendar publish remains wired',
    legacy.includes('calendarService.publish({') && legacy.includes('printMatchReport(printable)')],
]

let passed=0
for (const [label,ok] of checks){ console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nLegacy Match Editor Runtime Contract: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
