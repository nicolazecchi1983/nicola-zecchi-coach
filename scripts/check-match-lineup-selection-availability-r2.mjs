import fs from 'node:fs'

const view=fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const runtime=fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')
const model=fs.readFileSync('src/modules/match/matchLineupSelectionModel.js','utf8')
const test=fs.readFileSync('tests/domain/matchLineupSelectionModel.test.js','utf8')
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const gate='check:match-lineup-selection-availability-r2'
const checks=[
  ['compact numeric input preserved',view.includes('class="starter-number-input"') && !view.includes('class="starter-number-select"')],
  ['player options use canonical alphabetical owner',view.includes('sortMatchLineupPlayers(rosterPlayers)') && runtime.includes('sortMatchLineupPlayers(getTrainingSheetRosterPlayers())')],
  ['selection model has behavior coverage',model.includes('findMatchLineupDuplicatePlayers') && test.includes('detects duplicate identity across starters and bench')],
  ['number-to-player coupling retired',!runtime.includes('syncStarterPlayerFromNumber') && !runtime.includes('uniquePlayerForShirtNumber')],
  ['player-to-number seasonal compatibility preserved',runtime.includes('syncStarterNumberFromPlayer') && runtime.includes('playerAssignedShirtNumber')],
  ['all player options remain enabled',runtime.includes('option.disabled = false')],
  ['bench no longer filters starters or duplicates',!runtime.includes('!starters.has(player.canonicalName)') && !runtime.includes('!usedElsewhere.has(player.canonicalName)')],
  ['used-player marker is explicit',runtime.includes('— già utilizzato')],
  ['duplicate warning exists',view.includes('data-lineup-duplicate-warning') && runtime.includes('Giocatore già utilizzato:')],
  ['duplicates invalidate final save',runtime.includes('finalSave.disabled = duplicateNames.length > 0')],
  ['duplicate drafts do not reach canonical persistence',runtime.includes('if (!hasLineupDuplicates) scheduleCanonicalSquadSave()') && runtime.includes('||duplicateLineupPlayers().length)return')],
  ['PDF rejects duplicate lineup',runtime.includes('Correggi i giocatori duplicati prima di creare il PDF formazione.')],
  ['npm gate registered',pkg.scripts?.[gate]==='node scripts/check-match-lineup-selection-availability-r2.mjs'],
  ['suite registration unique',pkg.staffCheckSuite?.filter((item)=>item===gate).length===1],
  ['suite size is 256',pkg.staffCheckSuite?.length===256],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(ok)passed++}
console.log(`R2.0 Lineup Selection Availability: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
