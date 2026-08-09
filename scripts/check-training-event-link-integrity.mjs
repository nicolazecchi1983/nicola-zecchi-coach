import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  findTrainingCalendarEvent,
  resolveTrainingCalendarPublishTarget,
} from '../src/modules/training/trainingCalendarIntegration.js'

const controller = await readFile(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/modules/training/trainingSheetService.js', import.meta.url), 'utf8')

const events = [
  { id: 'morning', type: 'training', startAt: '2026-08-07T10:00:00' },
  { id: 'evening-published', type: 'training', startAt: '2026-08-07T17:30:00', trainingSheetPath: 'published.pdf' },
  { id: 'evening-empty', type: 'training', startAt: '2026-08-07T17:30:00' },
  { id: 'match', type: 'match', startAt: '2026-08-07T17:30:00' },
]

assert.equal(findTrainingCalendarEvent({ events, data: { date: '2026-08-07', time: '10:00' } })?.id, 'morning')
assert.equal(findTrainingCalendarEvent({ events, data: { date: '2026-08-07', time: '17:30' } })?.id, 'evening-published')
assert.equal(findTrainingCalendarEvent({
  events,
  eventId: 'evening-empty',
  data: { date: '2026-08-07', time: '17:30' },
})?.id, 'evening-published')
assert.equal(findTrainingCalendarEvent({ events, data: { date: '2026-08-07', time: '15:00' } }), null)

const collision = resolveTrainingCalendarPublishTarget({
  events,
  eventId: 'evening-empty',
  data: { date: '2026-08-07', time: '17:30' },
})
assert.equal(collision.event?.id, 'evening-published')
assert.deepEqual(collision.duplicateEvents.map((event) => event.id), ['evening-empty'])

const doubleSession = resolveTrainingCalendarPublishTarget({
  events,
  eventId: 'morning',
  data: { date: '2026-08-07', time: '10:00' },
})
assert.equal(doubleSession.event?.id, 'morning')
assert.equal(doubleSession.duplicateEvents.length, 0)

// Se l'evento corrente ha già una TS, event_id resta il legame primario anche
// in presenza di un vecchio duplicato pubblicato nello stesso slot.
const publishedDuplicates = [
  { id: 'other-published', type: 'training', startAt: '2026-08-07T17:30:00', trainingSheetPath: 'other.pdf' },
  { id: 'current-published', type: 'training', startAt: '2026-08-07T17:30:00', trainingSheetPath: 'current.pdf' },
]
const currentPublished = resolveTrainingCalendarPublishTarget({
  events: publishedDuplicates,
  eventId: 'current-published',
  data: { date: '2026-08-07', time: '17:30' },
})
assert.equal(currentPublished.event?.id, 'current-published')
assert.deepEqual(currentPublished.duplicateEvents.map((event) => event.id), ['other-published'])

// Spostare una TS già collegata verso un altro orario non deve silenziosamente
// adottare un evento differente: il CalendarService deciderà se lo slot è libero.
const movedPublished = resolveTrainingCalendarPublishTarget({
  events: [
    ...publishedDuplicates,
    { id: 'target-slot', type: 'training', startAt: '2026-08-07T18:00:00', trainingSheetPath: 'target.pdf' },
  ],
  eventId: 'current-published',
  data: { date: '2026-08-07', time: '18:00' },
})
assert.equal(movedPublished.event?.id, 'current-published')
assert.ok(movedPublished.duplicateEvents.some((event) => event.id === 'target-slot'))

assert.doesNotMatch(controller, /name="trainingSheet"/)
assert.doesNotMatch(controller, /uploadTrainingSheet\(/)
assert.match(controller, /resolveTrainingCalendarPublishTarget\(/)
assert.match(controller, /duplicateEvents: publishTarget\.duplicateEvents/)
assert.match(controller, /deleteEvent: deleteCalendarEvent/)
assert.match(service, /duplicateEvents = \[\]/)
assert.match(service, /pendingDeletionEventIds/)
assert.match(service, /await deleteEvent\(duplicateEvent\.id\)/)
assert.match(service, /TRAINING_LOCAL_DOWNLOAD_FAILED/)
assert.match(controller, /Si crea dopo aver salvato l’allenamento/)
assert.match(controller, /La Training Sheet si modifica dal suo Editor/)
assert.match(controller, /currentEvent\.trainingSheetPath/)

console.log('TRAINING EVENT LINK INTEGRITY: OK')
