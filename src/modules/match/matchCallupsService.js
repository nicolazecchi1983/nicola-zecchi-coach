import { assertMatchCallupsLimit, mergeMatchCallupsIntoEventNotes, readMatchCallupsFromEvent, readMatchCallupsFromEventNotes } from './matchCallupsModel.js'

export function createMatchCallupsService({ getEvent, updateEvent, reloadEvents } = {}) {
  if (typeof getEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Convocazioni non configurate: accesso evento mancante.')
  }
  return {
    load(eventOrNotes) {
      return typeof eventOrNotes === 'object' && eventOrNotes !== null
        ? readMatchCallupsFromEvent(eventOrNotes)
        : readMatchCallupsFromEventNotes(eventOrNotes)
    },
    async save(matchId, players = []) {
      const event = await getEvent(matchId)
      if (!event?.id) throw new Error('Partita non disponibile nel Calendario.')
      const next = {
        players: assertMatchCallupsLimit(players),
        updatedAt: new Date().toISOString(),
      }
      await updateEvent(event.id, { notes: mergeMatchCallupsIntoEventNotes(event.notes, next) })
      if (typeof reloadEvents === 'function') await reloadEvents()
      return readMatchCallupsFromEventNotes(mergeMatchCallupsIntoEventNotes(event.notes, next))
    },
  }
}
