import fs from 'node:fs'
const read=(path)=>fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const rosterView=read('src/modules/roster/ui/rosterModalViews.js')
const rosterService=read('src/modules/roster/rosterService.js')
const rosterDomain=read('src/modules/roster/rosterService.js')
const schema=read('supabase/20260808_team_roster_foundation.sql')
const squadView=read('src/modules/match/ui/matchSquadView.js')
const runtime=read('src/modules/match/events/legacyMatchEditorEvents.js')
const lineup=read('src/modules/match/matchLineupSelectionModel.js')
const report=read('src/modules/match/matchReportModel.js')
const stats=read('src/modules/match/matchStatisticsModel.js')
const checks=[
 ['persistent roster already owns optional shirt_number',schema.includes('shirt_number integer')],
 ['roster UI labels seasonal number as optional',rosterView.includes('Numero maglia stagionale')&&rosterView.includes('roster-field-label-row')&&rosterView.includes('Opzionale')],
 ['roster save accepts null number and validates 1-99 when present',rosterService.includes("shirtNumber = normalized.number === '' || normalized.number == null ? null")&&rosterService.includes('Number.isInteger(shirtNumber)')],
 ['active roster prevents duplicate assigned seasonal number',rosterService.includes('Number(row.shirt_number) === shirtNumber')&&rosterService.includes('ROSTER_SHIRT_NUMBER_CONFLICT')],
 ['player identity remains independent from shirt number',rosterDomain.includes('export function rosterPlayerIdentity(player)')&&rosterDomain.includes('player?.id || rosterPlayerKey(player)')],
 ['starter default match numbers derive from canonical eleven-player contract',squadView.includes('Array.from({ length: MATCH_LINEUP_STARTER_COUNT }, (_, index) => index + 1)')&&lineup.includes('MATCH_LINEUP_STARTER_COUNT = 11')],
 ['starter number is a compact 1-99 match input, not a native dropdown',squadView.includes('class="starter-number-input"')&&squadView.includes('inputmode="numeric"')&&squadView.includes('maxlength="2"')&&!squadView.includes('class="starter-number-select"')],
 ['bench number is the same editable 1-99 match-only concept',squadView.includes('class="bench-number-input"')&&squadView.includes('name="bench_number_${index}"')&&squadView.includes('placeholder="—"')],
 ['player options carry optional seasonal shirt number metadata',squadView.includes('data-shirt-number')],
 ['player selection proposes seasonal match number only when the match-number slot is empty',runtime.includes('syncStarterNumberFromPlayer')&&runtime.includes('syncBenchNumberFromPlayer')&&runtime.includes('playerAssignedShirtNumber')&&(runtime.match(/if \(!String\(numberField\.value \|\| ''\)\.trim\(\) && assignedNumber != null\)/g)||[]).length===2],
 ['number selection never changes player identity',!runtime.includes('syncStarterPlayerFromNumber')&&!runtime.includes('uniquePlayerForShirtNumber')&&!runtime.includes('syncBenchPlayerFromNumber')],
 ['any normalized 1-99 value remains valid match-only data',runtime.includes('normalizedRosterShirtNumber(control.value)')],
 ['bench number is persisted in PRE snapshot from its editable input',runtime.includes('shirtNumber:form.elements[`bench_number_${index}`]?.value||null')],
 ['blank bench match number remains a valid persisted edit state',runtime.includes("const raw = String(control.value || '').trim()")&&runtime.includes("if (!raw) {")&&runtime.includes("control.value = ''")&&runtime.includes('save()')],
 ['report and statistics already consume bench_number as the same match number',report.includes('bench_number_${index}')&&stats.includes('bench_number_${index}')],
]
let passed=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nMatch Squad Player Number Foundation: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
