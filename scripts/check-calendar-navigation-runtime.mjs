import fs from 'node:fs'

const source = fs.readFileSync('src/app/appController.js', 'utf8')
const calendarViewSource = fs.readFileSync('src/modules/calendar/ui/calendarView.js', 'utf8')
const checks = [
  ['Calendario normalizza la data', source.includes('candidateDate instanceof Date')],
  ['Formatter data Calendario importato', source.includes("import { formatDateInputValue } from '../shared/date/dateInput.js'")],
  ['Icona evento Drawer importata', source.includes('eventTypeIcon,')],
  ['Icona evento Calendario esportata', calendarViewSource.includes('export function eventTypeIcon')],
  ['Helper evento allenamento esportato', calendarViewSource.includes('export function isTrainingEventType')],
  ['Helper evento allenamento importato', source.includes('isTrainingEventType,')],
  ['Icon renderer non usa simboli globali', !calendarViewSource.includes('iconRenderer = icon')],
  ['Drawer passa icon renderer esplicitamente', source.includes('eventTypeIcon(event.type, icon)')],
  ['Calendario normalizza gli eventi', source.includes('Array.isArray(appState.calendarEvents)')],
  ['Fallback render Calendario presente', source.includes("console.error('Errore render Calendario:'")],
  ['Navigazione aggiorna la sidebar solo dopo apertura', source.includes('const openedSection = await setView(sectionKey, sectionLabel)')],
  ['Navigazione ripristina la sezione precedente in errore', source.includes('if (previousSection) setActiveNavigation(previousSection)')],
]
const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
if (failed.length) process.exit(1)
console.log(`\nCalendar navigation runtime contract: ${checks.length}/${checks.length} controlli superati.`)
