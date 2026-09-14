import fs from 'node:fs'
const runtime=fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const checks=[
 ['starter player selector has direct change binding',runtime.includes('starterPlayerMatch')&&runtime.includes('syncStarterNumberFromPlayer(Number(starterPlayerMatch[1]))')],
 ['starter number input has direct change binding without resolving player identity',runtime.includes('starterNumberRuntimeBound')&&runtime.includes('normalizedRosterShirtNumber(control.value)')&&!runtime.includes('syncStarterPlayerFromNumber')],
 ['starter player selection adopts assigned seasonal number',runtime.includes('const syncStarterNumberFromPlayer')&&runtime.includes('playerAssignedShirtNumber(playerName)')],
 ['number selection never resolves player identity',!runtime.includes('const uniquePlayerForShirtNumber')&&!runtime.includes('syncStarterPlayerFromNumber')],
 ['match number remains independent from player identity',runtime.includes('normalizedRosterShirtNumber(control.value)')&&!runtime.includes('starterUsesPlayerElsewhere')],
 ['starter sync refreshes full Distinta usage state',/const syncStarterSelectionState = \(\) => \{[\s\S]*?updateLineupSelectionState\(\)/.test(runtime)],
 ['starter sync refreshes leadership',/const syncStarterSelectionState = \(\) => \{[\s\S]*?refreshLeadershipSelects\(\)/.test(runtime)],
 ['starter sync refreshes pitch tokens',/const syncStarterSelectionState = \(\) => \{[\s\S]*?updateTokens\(\)/.test(runtime)],
 ['starter sync refreshes report and persists draft',/const syncStarterSelectionState = \(\) => \{[\s\S]*?renderReport\(\)[\s\S]*?scheduleSave\(\)/.test(runtime)],
 ['bench player selector has direct binding and can adopt seasonal number',runtime.includes('benchRuntimeBound')&&runtime.includes('syncBenchNumberFromPlayer(Number(benchPlayerMatch[1]))')],
 ['bench number input is directly editable without changing player identity',runtime.includes('benchNumberRuntimeBound')&&runtime.includes('bench_number_')&&!runtime.includes('syncBenchPlayerFromNumber')],
 ['core lineup controls bind before optional analysis widgets',runtime.indexOf('bindCoreSquadControls()')<runtime.indexOf('bindMatchAnalysisSchemaEditors(matchEditor')],
]
let passed=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nMatch Starter Selection Runtime: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
