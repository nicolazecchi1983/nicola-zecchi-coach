import fs from 'node:fs'
import { classifySeasonImportRows, validateSeasonImportRows } from '../src/modules/calendar/seasonCalendarImportModel.js'
import { parseSeasonCalendarCsv } from '../src/modules/calendar/ui/seasonCalendarImportView.js'

const controller=fs.readFileSync('src/app/appController.js','utf8')
const calendarRuntime=fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const calendar=fs.readFileSync('src/modules/calendar/ui/calendarView.js','utf8')
const service=fs.readFileSync('src/modules/calendar/seasonCalendarImportService.js','utf8')

const rows=parseSeasonCalendarCsv('giornata,data,ora,avversario,casa_trasferta,competizione\n1,2026-09-06,15:30,Imolese,casa,Campionato\n2,2026-09-13,15:30,Ravenna,trasferta,Campionato')
const valid=validateSeasonImportRows(rows)
const classified=classifySeasonImportRows(valid.rows,[{id:'x',type:'match',startAt:'2026-09-06T13:30:00.000Z',opponent:'Imolese'}])
const checks=[
 ['Calendario espone import stagione',calendar.includes('data-import-season-calendar')],
 ['CSV produce due gare',rows.length===2],
 ['Casa/trasferta normalizzata',rows[1].homeAway==='away'],
 ['Preview valida dati prima del commit',valid.valid],
 ['Duplicato data+avversario riconosciuto',classified[0].importStatus==='duplicate'],
 ['Seconda gara resta nuova',classified[1].importStatus==='new'],
 ['Service crea solo righe new',service.includes("filter((item) => item.importStatus === 'new')")],
 ['Service salta duplicati',service.includes("importStatus === 'duplicate'")],
 ['Controller delega il runtime Calendario canonico',controller.includes('createCalendarRuntimeActions')],
 ['Runtime Calendario usa createSeasonCalendarImportService canonico',calendarRuntime.includes('createSeasonCalendarImportService')&&calendarRuntime.includes('matchCalendarService.createMatch(row)')],
 ['Preview modificabile prima import',calendarRuntime.includes('editedRows')],
 ['Import ricarica Calendario',calendarRuntime.includes('await importService.commit')],
 ['Nessuna seconda Match Library creata',!service.includes('match_library')],
 ['Import UI usa componenti modal nativi',fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8').includes('new-event-modal__head')],
 ['File picker dichiara PDF e immagini',fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8').includes('application/pdf')],
]
let passed=0
for(const [label,ok] of checks){if(ok){console.log(`✓ ${label}`);passed++}else{console.error(`✗ ${label}`);process.exitCode=1}}
console.log(`\nSeason Calendar Import Foundation: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
