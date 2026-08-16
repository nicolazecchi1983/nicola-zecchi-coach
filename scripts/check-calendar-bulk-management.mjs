import fs from 'node:fs'
import {
  calendarEventProtection,
  selectCalendarEventsForBulkAction,
} from '../src/modules/calendar/calendarBulkManagementModel.js'

const calendarView = fs.readFileSync('src/modules/calendar/ui/calendarView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const service = fs.readFileSync('src/modules/calendar/calendarService.js','utf8')

const events = [
  { id:'t1', type:'training', startAt:'2026-08-17T15:30:00.000Z', title:'Allenamento', trainingSheetPath:null, editorData:null },
  { id:'t2', type:'training', startAt:'2026-08-18T15:30:00.000Z', title:'Allenamento TS', trainingSheetPath:'team/all_001.pdf', editorData:{ focus:'Costruzione' } },
  { id:'m1', type:'match', startAt:'2026-08-19T13:30:00.000Z', title:'Partita', opponent:'Imolese', matchType:'league', rawNotes:JSON.stringify({type:'match_event',opponent:'Imolese'}) },
  { id:'m2', type:'match', startAt:'2026-08-20T13:30:00.000Z', title:'Partita lavorata', opponent:'Ravenna', matchType:'league', rawNotes:JSON.stringify({type:'match_event',match_report:{result:'2-1'}}) },
  { id:'r1', type:'meeting', startAt:'2026-08-21T16:00:00.000Z', title:'Riunione' },
]

const range = selectCalendarEventsForBulkAction(events,{mode:'range',from:'2026-08-17',to:'2026-08-21'})
const league = selectCalendarEventsForBulkAction(events,{mode:'competition',competition:'league'})
const blankRange = selectCalendarEventsForBulkAction(events,{mode:'range',from:'',to:''})

const checks = [
  ['Calendario espone menu Azioni', calendarView.includes('data-calendar-actions-menu')],
  ['Nuovo evento vive nel menu Azioni', calendarView.includes('data-new-event')],
  ['Import calendario vive nel menu Azioni', calendarView.includes('data-import-season-calendar')],
  ['Gestione eventi vive nel menu Azioni', calendarView.includes('data-manage-calendar-events')],
  ['Range seleziona tutti gli eventi compresi', range.selected.length === 5],
  ['Training Sheet rende evento protetto', calendarEventProtection(events[1]).protected === true],
  ['Match Report rende partita protetta', calendarEventProtection(events[3]).protected === true],
  ['Evento vuoto resta eliminabile', calendarEventProtection(events[0]).protected === false],
  ['Range elimina solo eventi non protetti', range.deletableEvents.length === 3 && range.protectedEvents.length === 2],
  ['Campionato seleziona solo partite league', league.selected.length === 2],
  ['Range senza date non seleziona tutto accidentalmente', blankRange.selected.length === 0],
  ['Delete massivo usa una query Supabase .in', service.includes(".delete()") && service.includes(".in('id', ids)")],
  ['Calendar runtime richiede CALENDAR_DELETE via capability injection', runtime.includes('capabilities.CALENDAR_DELETE') && controller.includes('capabilities: ACCESS_CAPABILITIES')],
  ['Controller richiede conferma checkbox', runtime.includes('form.elements.confirm?.checked')],
  ['Controller richiede conferma finale', runtime.includes('confirmUser(question)')],
  ['Eventi protetti non vengono passati al delete', runtime.includes('previewNow.deletableEvents')],
]

let passed=0
for(const [label,ok] of checks){
  if(ok){ console.log(`✓ ${label}`); passed+=1 }
  else { console.error(`✗ ${label}`); process.exitCode=1 }
}
console.log(`\nCalendar Bulk Management: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
