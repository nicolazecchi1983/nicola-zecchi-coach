const TRAFFIC_LIGHT_VALUES = new Set(['green', 'yellow', 'red'])

function parseEventNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return { ...rawNotes }
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function normalizeTrainingLibraryFeedback(input = {}) {
  const trafficLight = String(input.trafficLight ?? input.traffic_light ?? '').trim().toLowerCase()
  return {
    trafficLight: TRAFFIC_LIGHT_VALUES.has(trafficLight) ? trafficLight : null,
    notes: String(input.notes ?? '').trim(),
    updatedAt: input.updatedAt ?? input.updated_at ?? null,
  }
}

export function readTrainingLibraryFeedback(rawNotes) {
  const parsed = parseEventNotes(rawNotes)
  return normalizeTrainingLibraryFeedback(parsed.library_feedback || {})
}

export function buildTrainingNotesWithLibraryFeedback(rawNotes, input, now = new Date()) {
  const parsed = parseEventNotes(rawNotes)
  const normalized = normalizeTrainingLibraryFeedback(input)
  const timestamp = now instanceof Date && !Number.isNaN(now.getTime())
    ? now.toISOString()
    : new Date().toISOString()

  return JSON.stringify({
    ...parsed,
    library_feedback: {
      traffic_light: normalized.trafficLight,
      notes: normalized.notes,
      updated_at: timestamp,
    },
  })
}

export async function saveTrainingLibraryFeedback({
  eventId,
  rawNotes,
  feedback,
  updateEvent,
}) {
  if (!eventId) throw new Error('Training Sheet non valida.')
  if (typeof updateEvent !== 'function') throw new Error('Servizio Calendario non disponibile.')

  const notes = buildTrainingNotesWithLibraryFeedback(rawNotes, feedback)
  await updateEvent(eventId, { notes })

  return {
    eventId,
    rawNotes: notes,
    feedback: readTrainingLibraryFeedback(notes),
  }
}
