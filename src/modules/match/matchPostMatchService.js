import { AppError } from '../../core/appError.js'
import {
  mergeMatchPostMatchIntoEventNotes,
  normalizeMatchPostMatch,
  parsePostMatchMaterials,
  readMatchPostMatchFromEventNotes,
} from './matchPostMatchModel.js'

export function createMatchPostMatchService({ getEvent, updateEvent, reloadEvents } = {}) {
  if (typeof getEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Post gara non configurato: accesso evento mancante.')
  }

  return {
    load(eventOrNotes) {
      const rawNotes = typeof eventOrNotes === 'object' && eventOrNotes !== null
        ? (eventOrNotes.rawNotes ?? eventOrNotes.notes ?? '')
        : eventOrNotes
      return readMatchPostMatchFromEventNotes(rawNotes)
    },

    async save(matchId, input = {}) {
      const event = await getEvent(matchId)
      if (!event?.id) {
        throw new AppError('Partita non trovata nel Calendario.', {
          code: 'MATCH_POST_MATCH_EVENT_NOT_FOUND',
          stage: 'read',
          userMessage: 'La partita non è più disponibile. Torna alla Match Library e riaprila.',
        })
      }

      const parsedMaterials = parsePostMatchMaterials(input.materialsText || '')
      if (!parsedMaterials.valid) {
        throw new AppError(parsedMaterials.errors.join(' '), {
          code: 'MATCH_POST_MATCH_MATERIAL_INVALID',
          stage: 'validation',
          userMessage: parsedMaterials.errors[0],
        })
      }

      const current = readMatchPostMatchFromEventNotes(event.notes)
      const next = normalizeMatchPostMatch({
        ...current,
        debrief: input.debrief,
        positives: input.positives,
        issues: input.issues,
        microcyclePriorities: input.microcyclePriorities,
        individualFollowUps: input.individualFollowUps,
        materials: parsedMaterials.materials,
        updatedAt: new Date().toISOString(),
      })

      await updateEvent(event.id, {
        notes: mergeMatchPostMatchIntoEventNotes(event.notes, next),
      })
      if (typeof reloadEvents === 'function') await reloadEvents()
      return next
    },
  }
}
