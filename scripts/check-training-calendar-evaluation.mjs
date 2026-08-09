import fs from 'node:fs'
import path from 'node:path'
import { trainingEvaluationValue, renderCalendarView } from '../src/modules/calendar/ui/calendarView.js'

let passed = 0
const expect = (condition, message) => {
  if (!condition) throw new Error(message)
  passed += 1
}

expect(trainingEvaluationValue({ trainingSheetPath: 'x.pdf', libraryFeedback: { trafficLight: 'green' } }) === 'green',
  'La valutazione green deve essere riconosciuta.')
expect(trainingEvaluationValue({ trainingSheetPath: 'x.pdf', libraryFeedback: { trafficLight: 'yellow' } }) === 'yellow',
  'La valutazione yellow deve essere riconosciuta.')
expect(trainingEvaluationValue({ trainingSheetPath: 'x.pdf', libraryFeedback: { trafficLight: 'red' } }) === 'red',
  'La valutazione red deve essere riconosciuta.')
expect(trainingEvaluationValue({ trainingSheetPath: null, libraryFeedback: { trafficLight: 'green' } }) === null,
  'Una valutazione non deve comparire senza Training Sheet pubblicata.')
expect(trainingEvaluationValue({ trainingSheetPath: 'x.pdf', libraryFeedback: { trafficLight: 'blue' } }) === null,
  'Valori non validi non devono produrre indicatori.')

const html = renderCalendarView({
  currentDate: new Date(2026, 7, 1),
  events: [{
    id: 'e1',
    type: 'training',
    title: 'Allenamento',
    startAt: '2026-08-07T17:30:00+02:00',
    time: '17:30',
    place: 'Mezzolara',
    matchDay: 'MD-3',
    editorData: {},
    trainingSheetPath: 'training/e1.pdf',
    libraryFeedback: { trafficLight: 'green' },
  }],
  canCreate: false,
  icon: () => '',
  escapeHtml: (value) => String(value ?? ''),
  formatDateInputValue: (date) => date.toISOString().slice(0, 10),
})

expect(html.includes('calendar-evaluation-dot is-green'),
  'Il Calendario deve mostrare il pallino della valutazione.')
expect(!html.includes('Valutazione seduta</small>'),
  'Il Calendario non deve aggiungere testo visibile per la valutazione.')

const tokens = fs.readFileSync(path.resolve('src/design-system/tokens.css'), 'utf8')
expect(tokens.includes('--staff-color-positive') && tokens.includes('--staff-color-warning') && tokens.includes('--staff-color-critical'),
  'I colori semantici della valutazione devono vivere nei token condivisi.')

console.log(`TRAINING CALENDAR EVALUATION CHECK: OK (${passed}/8)`)
