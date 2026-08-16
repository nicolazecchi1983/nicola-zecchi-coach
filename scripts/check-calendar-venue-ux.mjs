import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const runtime=fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const checks=[
 ['match venue is direct free-text field', runtime.includes("usesFreeVenue = !isTraining && !isRest") && runtime.includes("Campo / impianto (facoltativo)")],
 ['match venue is not required', runtime.includes("customLocationInput.required = Boolean(isCustomTraining)")],
 ['training venue remains required', runtime.includes("locationSelect.required = Boolean(isTraining)")],
 ['create and edit validate venue only for training', (runtime.match(/isTrainingEventType\(eventType\) && !location/g)||[]).length>=2],
 ['edit keeps existing free venue editable', runtime.includes("customLocationInput && !customLocationInput.value.trim()")],
 ['resolved venue still persists canonically', (runtime.match(/location: location \|\| null/g)||[]).length>=2],
 ['Da definire clears on focus only when untouched', runtime.includes("toLocaleLowerCase('it-IT') === 'da definire'") && runtime.includes("opponentInput.value = ''")],
 ['create and edit share the same location binder', (runtime.match(/bindEventTypeFields\(form\)/g)||[]).length>=2],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`); if(ok)passed++}
console.log(`\nCalendar venue UX: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
