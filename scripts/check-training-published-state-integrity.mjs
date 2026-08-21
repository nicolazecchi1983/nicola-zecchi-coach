import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildTrainingDraftMeta,
  hasTrainingDraftContentChanges,
  resolveTrainingDraftSource,
} from '../src/modules/training/trainingDraftPersistence.js'
import { resolveTrainingCalendarPublishTarget } from '../src/modules/training/trainingCalendarIntegration.js'

const published = (overrides = {}) => ({
  status: 'published',
  updated_at: '2026-08-20T18:00:00.000Z',
  date: '2026-08-22',
  time: '17:30',
  objective: 'Server objective',
  phases: [{}],
  ...overrides,
})

const localDirty = published({ objective: 'Local objective' })
const meta = buildTrainingDraftMeta({
  eventId: 'event-a',
  dirty: true,
  baseUpdatedAt: '2026-08-20T18:00:00.000Z',
  savedAt: '2026-08-20T18:05:00.000Z',
})

assert.equal(hasTrainingDraftContentChanges(localDirty, published()), true)
assert.equal(hasTrainingDraftContentChanges(published(), published()), false)

const restoredDirty = resolveTrainingDraftSource({
  eventId: 'event-a',
  localData: localDirty,
  localMeta: meta,
  serverData: published(),
  hasPublishedPath: true,
})
assert.equal(restoredDirty.source, 'local-dirty')
assert.equal(restoredDirty.dirty, true)
assert.equal(restoredDirty.data.objective, 'Local objective')

const newerServer = resolveTrainingDraftSource({
  eventId: 'event-a',
  localData: localDirty,
  localMeta: meta,
  serverData: published({ updated_at: '2026-08-20T19:00:00.000Z', objective: 'Newer server' }),
  hasPublishedPath: true,
})
assert.equal(newerServer.source, 'server-newer')
assert.equal(newerServer.staleLocal, true)
assert.equal(newerServer.data.objective, 'Newer server')

const otherEvent = resolveTrainingDraftSource({
  eventId: 'event-b',
  localData: localDirty,
  localMeta: meta,
  serverData: published({ objective: 'Event B' }),
  hasPublishedPath: true,
})
assert.equal(otherEvent.source, 'server')
assert.equal(otherEvent.data.objective, 'Event B')

const linkedDraft = resolveTrainingDraftSource({
  eventId: 'event-a',
  localData: { status: 'draft', objective: 'Local linked draft' },
  localMeta: buildTrainingDraftMeta({ eventId: 'event-a', dirty: true }),
  serverData: null,
  hasPublishedPath: false,
})
assert.equal(linkedDraft.source, 'local-draft')
assert.equal(linkedDraft.dirty, true)

const eventA = {
  id: 'event-a',
  type: 'training',
  startAt: new Date(2026, 7, 22, 17, 30, 0).toISOString(),
  trainingSheetPath: 'team/season/old.pdf',
}
const occupied = {
  id: 'event-b',
  type: 'training',
  startAt: new Date(2026, 7, 23, 18, 30, 0).toISOString(),
  trainingSheetPath: null,
}
const moved = resolveTrainingCalendarPublishTarget({
  events: [eventA, occupied],
  eventId: 'event-a',
  data: { date: '2026-08-23', time: '18:30' },
})
assert.equal(moved.event.id, 'event-a', 'A published TS must preserve event identity when date/time changes')
assert.deepEqual(moved.duplicateEvents, [], 'A move must never silently mark the occupied target event for deletion')

const sameIdentity = resolveTrainingCalendarPublishTarget({
  events: [eventA],
  eventId: 'event-a',
  data: { date: '2026-08-24', time: '17:30' },
})
assert.equal(sameIdentity.event.id, 'event-a')

const attachExisting = resolveTrainingCalendarPublishTarget({
  events: [occupied],
  eventId: '',
  data: { date: '2026-08-23', time: '18:30' },
})
assert.equal(attachExisting.event.id, 'event-b')
assert.deepEqual(attachExisting.duplicateEvents, [])

const eventsRuntime = await readFile(new URL('../src/modules/training/events/trainingEditorEvents.js', import.meta.url), 'utf8')
const calendarIntegration = await readFile(new URL('../src/modules/training/trainingCalendarIntegration.js', import.meta.url), 'utf8')
const calendarService = await readFile(new URL('../src/modules/calendar/calendarService.js', import.meta.url), 'utf8')
const trainingService = await readFile(new URL('../src/modules/training/trainingSheetService.js', import.meta.url), 'utf8')

assert.match(eventsRuntime, /nz-training-sheet-editor-meta-v1/)
assert.match(eventsRuntime, /resolveTrainingDraftSource\(/)
assert.match(eventsRuntime, /hasTrainingDraftContentChanges\(/)
assert.match(eventsRuntime, /if \(supabase\) \{[\s\S]*getCalendarEvent\(eventId\)/)
assert.match(eventsRuntime, /if \(pendingOpenEventId[\s\S]*loadTrainingSheetByEventId\(pendingOpenEventId\)[\s\S]*else \{[\s\S]*restore\(\)/)
assert.match(eventsRuntime, /persistDraftSnapshot\(localSnapshot,[\s\S]*dirty: changedDuringPublish/)
assert.match(calendarIntegration, /event_id is the immutable identity/)
assert.doesNotMatch(calendarIntegration, /duplicateMap\.set/)
assert.match(calendarService, /assertTrainingEventSlotAvailable/)
assert.match(calendarService, /Apri l.evento esistente per modificarlo\./)
assert.doesNotMatch(calendarService, /pendingDeletionEventIds/)
assert.doesNotMatch(trainingService, /deleteEvent|pendingDeletionEventIds/)

console.log('TRAINING PUBLISHED STATE INTEGRITY: OK (22/22)')
