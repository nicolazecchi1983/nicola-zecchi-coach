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

  // event_id resta il legame principale. Se l'evento corrente ha già una TS
  // pubblicata, mantiene la propria identità anche quando data/ora vengono modificate:
  // un'eventuale collisione con un altro evento deve essere bloccata dal CalendarService.
  // I duplicati legacy senza TS vengono invece consolidati verso la TS pubblicata
  // già presente nello stesso slot.
  const byIdInSameSlot = byId
    && sameSlot.some((event) => String(event.id) === String(byId.id))
    ? byId
    : null

  const canonical = (byId?.trainingSheetPath ? byId : null)
    || sameSlot.find((event) => event?.trainingSheetPath)
    || byIdInSameSlot
    || sameSlot[0]
    || byId
    || null

  const duplicateMap = new Map()
  sameSlot.forEach((event) => {
    if (canonical && String(event.id) !== String(canonical.id)) {
      duplicateMap.set(String(event.id), event)
    }
  })

  // Se l'editor proveniva da un altro evento che viene spostato su uno slot già
  // esistente, quell'evento diventa duplicato e va consolidato nel canonico.
  if (byId && canonical && String(byId.id) !== String(canonical.id)) {
    duplicateMap.set(String(byId.id), byId)
  }

  return {
    event: canonical,
    duplicateEvents: [...duplicateMap.values()],
  }
}

export function findTrainingCalendarEvent(options = {}) {
  return resolveTrainingCalendarPublishTarget(options).event
}
