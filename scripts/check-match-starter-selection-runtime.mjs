import fs from 'node:fs'

const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const checks = [
  ['player selector has direct change binding', runtime.includes("select.addEventListener('change', () => {") && runtime.includes('syncStarterNumberFromPlayer(Number(playerMatch[1]))')],
  ['number selector has direct change binding', runtime.includes('syncStarterPlayerFromNumber(Number(numberMatch[1]))')],
  ['player selection adopts assigned seasonal number', runtime.includes('const syncStarterNumberFromPlayer') && runtime.includes('playerAssignedShirtNumber(playerName)')],
  ['number selection resolves a uniquely assigned player', runtime.includes('const uniquePlayerForShirtNumber') && runtime.includes('matches.length === 1 ? matches[0] : null')],
  ['ambiguous or unassigned number does not force a player', runtime.includes('if (!player || starterUsesPlayerElsewhere(player.canonicalName, index)) return')],
  ['starter sync updates duplicate-option constraints', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateStarterOptions\(\)/.test(runtime)],
  ['starter sync updates fixed bench', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateAutomaticBench\(\)/.test(runtime)],
  ['starter sync refreshes leadership', /const syncStarterSelectionState = \(\) => \{[\s\S]*?refreshLeadershipSelects\(\)/.test(runtime)],
  ['starter sync refreshes pitch tokens', /const syncStarterSelectionState = \(\) => \{[\s\S]*?updateTokens\(\)/.test(runtime)],
  ['starter sync refreshes report and persists draft', /const syncStarterSelectionState = \(\) => \{[\s\S]*?renderReport\(\)[\s\S]*?scheduleSave\(\)/.test(runtime)],
  ['bench displays seasonal number when available', runtime.includes('data-bench-slot-number') && runtime.includes('assignedNumber ?? (index + 12)')],
  ['core lineup controls bind before optional analysis widgets', runtime.indexOf('bindCoreSquadControls()') < runtime.indexOf('bindMatchAnalysisSchemaEditors(matchEditor')],
]
let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Starter Selection Runtime: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
