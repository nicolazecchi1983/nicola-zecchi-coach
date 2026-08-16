import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const checks = [
  ['Calendar runtime actions physically extracted', runtime.includes('export function createCalendarRuntimeActions')],
  ['Controller composes Calendar runtime owner', app.includes('createCalendarRuntimeActions({')],
  ['Event type field runtime moved out of controller', runtime.includes('function bindEventTypeFields(form)') && !app.includes('function bindEventTypeFields(form)')],
  ['Season import runtime moved out of controller', runtime.includes('function openSeasonCalendarImport') && !app.includes('function openSeasonCalendarImport')],
  ['Bulk management runtime moved out of controller', runtime.includes('function openCalendarBulkManagement') && !app.includes('function openCalendarBulkManagement')],
  ['Create-event runtime moved out of controller', runtime.includes('function openNewEventModal') && !app.includes('function openNewEventModal')],
  ['Edit-event runtime moved out of controller', runtime.includes('function openEditEventModal') && !app.includes('function openEditEventModal')],
  ['Delete-event runtime moved out of controller', runtime.includes('async function deleteEvent') && !app.includes('async function deleteEvent')],
  ['Drawer event runtime moved out of controller', runtime.includes('function openDrawer') && !app.includes('function openDrawer')],
  ['Calendar views remain injected instead of imported by runtime', runtime.includes('newEventModalHtml, editEventModalHtml') && runtime.includes('drawerHtml')],
  ['Persistence services remain injected', runtime.includes('createCalendarEvent, updateCalendarEvent') && runtime.includes('deleteCalendarEvent')],
  ['Controller remains composition root for Calendar wiring', app.includes('wireCalendarEvents({') && app.includes('openDrawer,') && app.includes('openNewEventModal,')],
  ['No direct Supabase import added to runtime', !runtime.includes("from '../supabase") && !runtime.includes("from '../../supabase")],
  ['Runtime exports only operational Calendar action surface', runtime.includes('return {') && runtime.includes('openDrawer,') && runtime.includes('openSeasonCalendarImport,') && runtime.includes('openCalendarBulkManagement,') && runtime.includes('openNewEventModal,')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nArchitecture Decomposition Phase 16: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
