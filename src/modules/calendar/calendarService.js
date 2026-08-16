import { supabase } from '../../supabase.js'
import { withDataAccessRetry } from '../../infrastructure/dataAccess/withDataAccessRetry.js'
import { DATA_OPERATION_KIND } from '../../infrastructure/dataAccess/dataOperationPolicy.js'

const cleanPayload = (payload = {}) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined),
)

const isTrainingPayload = (payload = {}) => (
  String(payload.event_type ?? payload.type ?? '').trim().toLowerCase() === 'training'
)

const trainingMinuteRange = (startAt) => {
  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) return null

  start.setSeconds(0, 0)
  const end = new Date(start.getTime() + 60_000)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

const normalizedEventId = (value) => String(value || '').trim()

async function assertTrainingEventSlotAvailable(
  payload = {},
  {
    excludeEventId = null,
    pendingDeletionEventIds = [],
  } = {},
) {
  if (!isTrainingPayload(payload) || !payload.start_at) return

  const range = trainingMinuteRange(payload.start_at)
  if (!range) return

  const ignoredIds = new Set(
    [excludeEventId, ...pendingDeletionEventIds]
      .map(normalizedEventId)
      .filter(Boolean),
  )

  const { data, error } = await supabase
    .from('events')
    .select('id,start_at')
    .eq('event_type', 'training')
    .gte('start_at', range.start)
    .lt('start_at', range.end)

  if (error) throw error

  const conflicts = (Array.isArray(data) ? data : [])
    .filter((event) => !ignoredIds.has(normalizedEventId(event?.id)))

  if (conflicts.length) {
    const eventDate = new Date(range.start)
    const dateLabel = eventDate.toLocaleDateString('it-IT')
    const timeLabel = eventDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
    throw new Error(`Esiste già un allenamento il ${dateLabel} alle ${timeLabel}. Apri l’evento esistente per modificarlo.`)
  }
}

export async function listCalendarEvents() {
  const { data, error } = await withDataAccessRetry(
    () => supabase
      .from('events')
      .select('*')
      .order('start_at'),
    { kind: DATA_OPERATION_KIND.READ, stage: 'calendar-events-list' },
  )

  if (error) throw error
  return data ?? []
}

export async function createCalendarEvent(payload) {
  const cleanedPayload = cleanPayload(payload)
  await assertTrainingEventSlotAvailable(cleanedPayload)

  const { data, error } = await supabase
    .from('events')
    .insert(cleanedPayload)
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function updateCalendarEvent(
  eventId,
  payload,
  { pendingDeletionEventIds = [] } = {},
) {
  if (!eventId) throw new Error('Evento non valido.')

  const cleanedPayload = cleanPayload(payload)
  await assertTrainingEventSlotAvailable(cleanedPayload, {
    excludeEventId: eventId,
    pendingDeletionEventIds,
  })

  const { data, error } = await supabase
    .from('events')
    .update(cleanedPayload)
    .eq('id', eventId)
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function deleteCalendarEvent(eventId) {
  if (!eventId) throw new Error('Evento non valido.')

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}


export async function deleteCalendarEvents(eventIds = []) {
  const ids = [...new Set((Array.isArray(eventIds) ? eventIds : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean))]

  if (!ids.length) return { deleted: 0 }

  const { data, error } = await supabase
    .from('events')
    .delete()
    .in('id', ids)
    .select('id')

  if (error) throw error
  return { deleted: Array.isArray(data) ? data.length : ids.length }
}

export async function getCalendarEvent(eventId) {
  if (!eventId) return null

  const { data, error } = await withDataAccessRetry(
    () => supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle(),
    { kind: DATA_OPERATION_KIND.READ, stage: 'calendar-event-get' },
  )

  if (error) throw error
  return data ?? null
}
