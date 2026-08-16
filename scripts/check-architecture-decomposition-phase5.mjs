import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const calendar=fs.readFileSync('src/modules/calendar/events/calendarEvents.js','utf8')
const checks=[
 ['Calendar extracted',app.includes("import { wireCalendarEvents }")&&!app.includes('function wireCalendarEvents()')],
 ['Calendar appState injected',calendar.includes('appState,')],
 ['Calendar actions injected',calendar.includes('openDrawer,')&&calendar.includes('openNewEventModal,')],
 ['Season import preserved',calendar.includes("data-import-season-calendar")&&calendar.includes('openSeasonCalendarImport()')],
 ['Bulk management preserved',calendar.includes("data-manage-calendar-events")&&calendar.includes('openCalendarBulkManagement()')],
 ['Event open preserved',calendar.includes("data-open-event")&&calendar.includes('openDrawer(button.dataset.openEvent)')],
 ['New event preserved',calendar.includes("data-new-event")&&calendar.includes("data-create-event-date")],
 ['Prev/next month preserved',calendar.includes('getMonth() - 1')&&calendar.includes('getMonth() + 1')],
 ['Today behavior preserved',calendar.includes('goToCurrentMonth()')&&calendar.includes("calendar-cell.is-today")],
 ['Controller remains composition root',app.includes('wireCalendarEvents({')&&app.includes('openSeasonCalendarImport,')&&app.includes('calendarView,')],
 ['No Supabase/repository import',!calendar.includes('supabase')&&!calendar.includes('repository')&&!calendar.includes('import ')],
]
let n=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 5: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
