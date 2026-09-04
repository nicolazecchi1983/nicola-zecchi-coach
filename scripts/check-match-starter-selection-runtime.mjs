import fs from 'node:fs'

const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const checks = [
  ['player selector has direct change binding', runtime.includes("select.addEventListener('change', () => {") && runtime.includes('syncStarterNumberFromPlayer(Number(playerMatch[1]))')],
  ['number input has direct change binding without resolving player identity', runtime.includes('starterNumberRuntimeBound') && runtime.includes('normalizedRosterShirtNumber(control.value)') && !runtime.includes('syncStarterPlayerFromNumber')],
  ['player selection adopts assigned seasonal number', runtime.includes('const syncStarterNumberFromPlayer') && runtime.includes('playerAssignedShirtNumber(playerName)')],
  ['number selection never resolves player identity', !runtime.includes('const uniquePlayerForShirtNumber') && !runtime.includes('syncStarterPlayerFromNumber')],
  ['match number remains independent from player identity', runtime.includes('normalizedRosterShirtNumber(control.value)') && !runtime.includes('starterUsesPlayerElsewhere')],
  ['starter sync updates duplicate-warning state through bench refresh', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateAutomaticBench\(\)/.test(runtime) && runtime.includes('Giocatore già utilizzato:')],
  ['starter sync updates fixed bench', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateAutomaticBench\(\)/.test(runtime)],
  ['starter sync refreshes leadership', /const syncStarterSelectionState = \(\) => \{[\s\S]*?refreshLeadershipSelects\(\)/.test(runtime)],
  ['starter sync refreshes pitch tokens', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateTokens\(\)/.test(runtime)],
  ['starter sync refreshes report and persists draft', /const syncStarterSelectionState = \(\) => \{[\s\S]*?renderReport\(\)[\s\S]*?scheduleSave\(\)/.test(runtime)],
  ['bench displays seasonal number when available, otherwise slot 12-20', runtime.includes('const assignedNumber = normalizedRosterShirtNumber(selectedPlayer?.number)') && runtime.includes('assignedNumber ?? (index + 12)')],
  ['core lineup controls bind before optional analysis widgets', runtime.indexOf('bindCoreSquadControls()') < runtime.indexOf('bindMatchAnalysisSchemaEditors(matchEditor')],
]
let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Starter Selection Runtime: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
