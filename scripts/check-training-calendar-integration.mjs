import fs from 'node:fs'

const integration = fs.readFileSync('src/modules/training/trainingCalendarIntegration.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const calendarView = fs.readFileSync('src/modules/calendar/ui/calendarView.js', 'utf8')

const checks = [
  ['helper calendario Training presente', integration.includes('buildTrainingDraftFromCalendarEvent')],
  ['ricerca evento centralizzata', integration.includes('findTrainingCalendarEvent')],
  ['evento senza TS genera una bozza', controller.includes('Bozza collegata al Calendario')],
  ['drawer apre o crea la TS', controller.includes('data-open-training-sheet-editor')],
  ['pubblicazione risolve lo stesso evento', controller.includes('resolveTrainingCalendarPublishTarget({')],
  ['Calendario distingue TS pubblicata', calendarView.includes('TS pubblicata')],
  ['Calendario mostra Crea TS quando assente', calendarView.includes('Crea TS')],
  ['nessuna archiviazione manuale in UI', !controller.includes('data-archive-training-sheet')],
  ['nessun upload manuale TS nel Calendario', !controller.includes('name="trainingSheet"') && !controller.includes('uploadTrainingSheet(')],
  ['Calendario indirizza al TS Editor', controller.includes('Crea Training Sheet') && controller.includes('Apri nel TS Editor')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error('TRAINING CALENDAR INTEGRATION: FAILED')
  for (const [label] of failed) console.error(`- ${label}`)
  process.exit(1)
}
console.log(`TRAINING CALENDAR INTEGRATION: OK (${checks.length}/${checks.length})`)
