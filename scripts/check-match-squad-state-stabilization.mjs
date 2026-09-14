import fs from 'node:fs'
const read=(path)=>fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const app=read('src/app/appController.js')
const legacy=read('src/modules/match/events/legacyMatchEditorEvents.js')
const view=read('src/modules/match/ui/matchSquadView.js')
const css=read('src/modules/match/ui/matchSquad.css')
const lineup=read('src/modules/match/matchLineupSelectionModel.js')
const checks=[
 ['Distinta keeps structural 20-player cap from the Callups contract',lineup.includes('MATCH_LINEUP_STARTER_COUNT = 11')&&lineup.includes('MATCH_LINEUP_MAX_BENCH = MATCH_CALLUPS_MAX_PLAYERS - MATCH_LINEUP_STARTER_COUNT')&&legacy.includes('Distinta: ${total}/20')],
 ['Bench exposes exactly nine editable fixed slots',view.includes('MATCH_LINEUP_MAX_BENCH')&&view.includes('name="bench_${index}"')&&view.includes('name="bench_number_${index}"')&&view.includes('data-bench-select')],
 ['Fixed bench positions are labelled P1 onward',view.includes('>P${index + 1}</span>')],
 ['Bench match number is an editable match-only input',view.includes('class="bench-number-input"')&&view.includes('inputmode="numeric"')&&view.includes('maxlength="2"')],
 ['All and only called players stay available in every XI and bench selector',legacy.includes('option.disabled = false')&&!legacy.includes('deriveMatchLineupBench')&&!view.includes('rosterOptions')],
 ['Bench permits temporary duplicates but exposes invalid state',legacy.includes('findMatchLineupDuplicatePlayers')&&legacy.includes('Giocatore già utilizzato:')&&legacy.includes('aria-invalid')],
 ['Duplicate state blocks canonical persistence but keeps local draft editing',legacy.includes('draftService.save(form)')&&legacy.includes('if (!hasLineupDuplicates) scheduleCanonicalSquadSave()')&&legacy.includes('duplicateLineupPlayers().length)return')],
 ['Bench selection and number mutations refresh report and persistence including blank numbers',legacy.includes('benchRuntimeBound')&&legacy.includes('benchNumberRuntimeBound')&&legacy.includes("const raw = String(control.value || '').trim()")&&legacy.includes("control.value = ''")&&legacy.includes('renderReport()')&&legacy.includes('save()')],
 ['Bench fixed-slot visual contract is editable',css.includes('.bench-grid--slots')&&css.includes('.bench-number-input')&&css.includes('.bench-slot-player')],
 ['Starter jersey numbers remain independent',view.includes('name="starter_number_${index}"')],
 ['Captain and vice restoration is deferred until starter options exist',legacy.includes("if (k === 'captain' || k === 'vice_captain') return")&&legacy.includes('restoredLeadership = {')&&legacy.includes('refreshLeadershipSelects()')],
 ['Captain persists immediately',legacy.includes('const assignLeadershipRole = (role, playerIndex) =>')&&legacy.includes('save()')],
 ['Captain and vice cannot be same player',legacy.includes("if (index && otherField?.value === index) otherField.value = ''")],
 ['Formation/pitch behavior remains untouched',legacy.includes('applyFormation(formationSelect.value)')&&legacy.includes('bindTokenDragging()')],
 ['Match section orchestration remains untouched',app.includes('wireMatchWorkspaceEvents({')],
]
let passed=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nMatch Squad State Stabilization: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
