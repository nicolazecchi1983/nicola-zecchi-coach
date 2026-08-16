import fs from 'node:fs'

const source = fs.readFileSync('src/app/appController.js', 'utf8')
const eventViews = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js', 'utf8')
const globalShellEvents = fs.readFileSync('src/app/events/globalShellEvents.js', 'utf8')
const calendarViewSource = fs.readFileSync('src/modules/calendar/ui/calendarView.js', 'utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js', 'utf8')
const checks = [
  ['Calendario normalizza la data', adapters.includes('candidateDate instanceof Date') && adapters.includes('Number.isNaN(candidateDate.getTime())')],
  ['Formatter data Calendario importato', source.includes("import { formatDateInputValue } from '../shared/date/dateInput.js'")],
  ['Icona evento Drawer disponibile nel view owner', eventViews.includes('eventTypeIcon,')],
  ['Icona evento Calendario esportata', calendarViewSource.includes('export function eventTypeIcon')],
  ['Helper evento allenamento esportato', calendarViewSource.includes('export function isTrainingEventType')],
  ['Helper evento allenamento importato', source.includes('isTrainingEventType,')],
  ['Icon renderer non usa simboli globali', !calendarViewSource.includes('iconRenderer = icon')],
  ['Drawer passa icon renderer esplicitamente', eventViews.includes('eventTypeIcon(event.type, icon)')],
  ['Calendario normalizza gli eventi', adapters.includes('Array.isArray(appState.calendarEvents)')],
  ['Fallback render Calendario presente', adapters.includes("console.error('Errore render Calendario:'") && adapters.includes('events: []')],
  ['Navigazione aggiorna la sidebar solo dopo apertura', globalShellEvents.includes('const openedSection = await setView(sectionKey, sectionLabel)')],
  ['Navigazione ripristina la sezione precedente in errore', globalShellEvents.includes('if (previousSection) setActiveNavigation(previousSection)')],
]
const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
if (failed.length) process.exit(1)
console.log(`\nCalendar navigation runtime contract: ${checks.length}/${checks.length} controlli superati.`)
