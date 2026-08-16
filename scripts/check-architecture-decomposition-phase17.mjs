import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js','utf8')
const views = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js','utf8')

const checks = [
  ['Calendar event view builders physically extracted', views.includes('export function createCalendarEventViewBuilders')],
  ['Controller composes Calendar event view owner', app.includes('createCalendarEventViewBuilders({')],
  ['Drawer markup moved out of controller', views.includes('function drawerHtml(event)') && !app.includes('function drawerHtml(event)')],
  ['New-event modal markup moved out of controller', views.includes('function newEventModalHtml(') && !app.includes('function newEventModalHtml(')],
  ['Edit-event modal markup moved out of controller', views.includes('function editEventModalHtml(event)') && !app.includes('function editEventModalHtml(event)')],
  ['Facility option rendering moved with Calendar views', views.includes('function teamLocationSelectOptions(') && !app.includes('function teamLocationSelectOptions(')],
  ['Configured-facility predicate moved with Calendar views', views.includes('function isConfiguredTeamFacility(') && !app.includes('function isConfiguredTeamFacility(')],
  ['Calendar runtime still receives views by injection', runtime.includes('newEventModalHtml, editEventModalHtml') && runtime.includes('drawerHtml')],
  ['Training editor still receives facility options by injection', adapters.includes('teamLocationSelectOptions') && app.includes('teamLocationSelectOptions,')],
  ['View owner contains no persistence calls', !views.includes('createCalendarEvent(') && !views.includes('updateCalendarEvent(') && !views.includes('deleteCalendarEvent(')],
  ['View owner contains no Supabase import', !views.includes('supabase') && !views.includes("from '../supabase")],
  ['Controller reduced below Phase 16 size', app.split('\n').length < 1300],
  ['Calendar event markup remains capability-aware by injection', views.includes('can, capabilities') && views.includes('capabilities.CALENDAR_UPDATE')],
  ['Calendar drawer keeps Training Sheet presentation hooks', views.includes('trainingSheetStructuredHtml(event)') && views.includes('trainingSheetPreviewHtml(event)')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nArchitecture Decomposition Phase 17: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
