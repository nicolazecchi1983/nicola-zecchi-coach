import { TRAINING_SHEET_STATUS, normalizeTrainingSheetData } from './trainingSheetModel.js'

export function isTrainingCalendarEvent(event) {
  return event?.type === 'training' || event?.event_type === 'training'
}

export function trainingCalendarStatus(event) {
  if (!isTrainingCalendarEvent(event)) return 'not-training'
  if (event?.trainingSheetPath) return 'published'
  return 'draft'
}

export function buildTrainingDraftFromCalendarEvent(event, defaults = {}) {
  if (!event?.id || !isTrainingCalendarEvent(event)) {
    throw new Error('Evento allenamento non valido.')
  }

  const startAt = event.startAt || event.start_at
  const eventDate = startAt ? new Date(startAt) : null
  const validDate = eventDate && !Number.isNaN(eventDate.getTime())

  return normalizeTrainingSheetData({
    ...defaults,
    status: TRAINING_SHEET_STATUS.DRAFT,
    date: validDate ? eventDate.toLocaleDateString('sv-SE') : String(defaults.date || ''),
    time: event.time || (validDate
      ? eventDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      : String(defaults.time || '17:30')),
    location: event.place || event.location || defaults.location || '',
    match_day: event.matchDay || event.match_day || defaults.match_day || '',
    present: event.presentCount ?? event.present_count ?? defaults.present ?? 0,
    phases: Array.isArray(defaults.phases) && defaults.phases.length ? defaults.phases : [{}],
  })
}

function trainingEventSlot(event) {
  if (!isTrainingCalendarEvent(event)) return null
  const startAt = new Date(event.startAt || event.start_at)
  if (Number.isNaN(startAt.getTime())) return null
  return {
    date: startAt.toLocaleDateString('sv-SE'),
    time: startAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function resolveTrainingCalendarPublishTarget({ events = [], eventId = '', data = {} } = {}) {
  const targetDate = String(data.date || '')
  const targetTime = String(data.time || '').slice(0, 5)
  const byId = eventId
    ? events.find((event) => String(event.id) === String(eventId) && isTrainingCalendarEvent(event))
    : null

  const sameSlot = targetDate
    ? events.filter((event) => {
        const slot = trainingEventSlot(event)
        return slot?.date === targetDate && (!targetTime || slot.time === targetTime)
      })
    : []

  // R1.4K — event_id is the immutable identity of an already linked Training Sheet.
  // Never switch identity or silently delete another event just because date/time
  // collide. CalendarService must surface the collision and preserve both records.
  if (byId) {
    return {
      event: byId,
      duplicateEvents: [],
    }
  }

  // A brand-new Training Sheet may attach to one event already present in the
  // requested slot. If legacy data contains multiple events in that slot, choose a
  // deterministic candidate but DO NOT mark the others for deletion: the strict
  // CalendarService uniqueness guard will block the publish until the conflict is
  // explicitly resolved by the user/maintenance flow.
  const canonical = sameSlot.find((event) => event?.trainingSheetPath)
    || sameSlot[0]
    || null

  return {
    event: canonical,
    duplicateEvents: [],
  }
}

export function findTrainingCalendarEvent(options = {}) {
  return resolveTrainingCalendarPublishTarget(options).event
}
