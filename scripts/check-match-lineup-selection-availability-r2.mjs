import fs from 'node:fs'
const read=(path)=>fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const view=read('src/modules/match/ui/matchSquadView.js')
const runtime=read('src/modules/match/events/legacyMatchEditorEvents.js')
const model=read('src/modules/match/matchLineupSelectionModel.js')
const test=read('tests/domain/matchLineupSelectionModel.test.js')
const pkg=JSON.parse(read('package.json'))
const gate='check:match-lineup-selection-availability-r2'
const checks=[
 ['compact numeric starter input preserved',view.includes('class="starter-number-input"')&&!view.includes('class="starter-number-select"')],
 ['bench owns the same editable number-plus-player control grammar',view.includes('class="bench-number-input"')&&view.includes('data-bench-select')&&view.includes('bench_number_${index}')],
 ['player options use only the saved-callups roster and canonical alphabetical owner',view.includes('sortMatchLineupPlayers(rosterPlayers)')&&!view.includes('rosterOptions')],
 ['selection model owns boundary sanitization and full-Distinta duplicate detection',model.includes('sanitizeMatchLineupStarters')&&model.includes('findMatchLineupDuplicatePlayers')&&test.includes('detects duplicate identity across the full 20-slot match sheet')&&!model.includes('deriveMatchLineupBench')],
 ['number-to-player coupling remains retired',!runtime.includes('syncStarterPlayerFromNumber')&&!runtime.includes('uniquePlayerForShirtNumber')],
 ['seasonal number is proposal-only and never overwrites a non-empty match number',runtime.includes('syncStarterNumberFromPlayer')&&runtime.includes('syncBenchNumberFromPlayer')&&runtime.includes('playerAssignedShirtNumber')&&(runtime.match(/if \(!String\(numberField\.value \|\| ''\)\.trim\(\) && assignedNumber != null\)/g)||[]).length===2],
 ['all called-player options remain enabled in XI and bench',runtime.includes('option.disabled = false')&&!runtime.includes('option.disabled = usedElsewhere.has(option.value)')],
 ['used-player marker is explicit',runtime.includes("' — già utilizzato'")||runtime.includes(' — già utilizzato')],
 ['duplicate warning exists',view.includes('data-lineup-duplicate-warning')&&runtime.includes('Giocatore già utilizzato:')],
 ['duplicates invalidate final save',runtime.includes('finalSave.disabled = duplicateNames.length > 0')],
 ['duplicate drafts do not reach canonical persistence',runtime.includes('if (!hasLineupDuplicates) scheduleCanonicalSquadSave()')&&runtime.includes('duplicateLineupPlayers().length)return')],
 ['PDF rejects duplicate lineup',runtime.includes('Correggi i giocatori duplicati prima di creare il PDF formazione.')],
 ['bench is manually assigned, not derived from remaining names',!runtime.includes('deriveMatchLineupBench')&&!runtime.includes('updateDerivedBench')&&view.includes('name="bench_${index}"')],
 ['npm gate registered',pkg.scripts?.[gate]==='node scripts/check-match-lineup-selection-availability-r2.mjs'],
 ['suite registration unique',pkg.staffCheckSuite?.filter((item)=>item===gate).length===1],
 ['suite size is 260',pkg.staffCheckSuite?.length===260],
]
let passed=0;for(const[label,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(ok)passed++}
console.log(`R2.0 Lineup Selection Availability: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
