import fs from 'node:fs'

const service = fs.readFileSync('src/modules/calendar/calendarService.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const trainingService = fs.readFileSync('src/modules/training/trainingSheetService.js', 'utf8')

const checks = [
  ['training uniqueness guard exists', service.includes('assertTrainingEventSlotAvailable')],
  ['create path uses strict guard', /createCalendarEvent[\s\S]*assertTrainingEventSlotAvailable\(cleanedPayload\)/.test(service)],
  ['update path excludes current event', service.includes('excludeEventId: eventId')],
  ['update can ignore only duplicates pending deletion', service.includes('pendingDeletionEventIds') && service.includes('ignoredIds')],
  ['slot query checks all conflicts', service.includes(".gte('start_at', range.start)") && service.includes(".lt('start_at', range.end)") && !service.includes(".limit(1)")],
  ['training publish passes pending duplicate ids', trainingService.includes('pendingDeletionEventIds') && /updateEvent\(existingEvent\.id, payload, \{ pendingDeletionEventIds \}\)/.test(trainingService)],
  ['guard only applies to training', service.includes("=== 'training'")],
  ['duplicate message is actionable', service.includes('Apri l’evento esistente per modificarlo.')],
  ['new-event form surfaces service error', controller.includes('`Errore salvataggio: ${insertError.message}`')],
  ['edit-event form surfaces service error', controller.includes('`Errore modifica: ${updateError.message}`')],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
}

if (failures.length) {
  console.error(`Training event uniqueness check failed: ${failures.length}/${checks.length}`)
  process.exit(1)
}

console.log(`Training event uniqueness check passed: ${checks.length}/${checks.length}`)
