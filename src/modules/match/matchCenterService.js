import {
  appendMatchCenterEvent,
  createMatchCenterEvent,
  mergeMatchCenterIntoEventNotes,
  normalizeMatchCenterState,
  readMatchCenterFromEventNotes,
  removeMatchCenterEvent,
} from './matchCenterModel.js'

function createEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `match-center-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createMatchCenterService({
  getEvent,
  updateEvent,
  reloadEvents,
  now = () => new Date().toISOString(),
  createId = createEventId,
} = {}) {
  if (typeof getEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Match Center non configurato: accesso evento Calendario mancante.')
  }

  async function readFresh(matchId) {
    const event = await getEvent(matchId)
    if (!event?.id) throw new Error('Partita non disponibile nel Calendario.')
    return {
      event,
      center: readMatchCenterFromEventNotes(event.notes || ''),
    }
  }

  async function persist(event, center) {
    const next = normalizeMatchCenterState({
      ...center,
      updatedAt: now(),
    }, { persisted: true })
    const notes = mergeMatchCenterIntoEventNotes(event.notes || '', next)
    await updateEvent(event.id, { notes })
    if (typeof reloadEvents === 'function') await reloadEvents()
    return readMatchCenterFromEventNotes(notes)
  }

  return {
    async load(matchId) {
      const { center } = await readFresh(matchId)
      return center
    },

    async save(matchId, center = {}) {
      const { event } = await readFresh(matchId)
      return persist(event, center)
    },

    async setMatchState(matchId, patch = {}) {
      const { event, center } = await readFresh(matchId)
      return persist(event, {
        ...center,
        status: patch.status ?? center.status,
        period: patch.period ?? center.period,
        score: patch.score
          ? {
              our: patch.score.our ?? center.score.our,
              opponent: patch.score.opponent ?? center.score.opponent,
            }
          : center.score,
      })
    },

    async appendEvent(matchId, input = {}) {
      const { event, center } = await readFresh(matchId)
      const nextEvent = createMatchCenterEvent(input, {
        id: input.id || createId(),
        now: now(),
        sequence: center.events.length,
      })
      return persist(event, appendMatchCenterEvent(center, nextEvent))
    },

    async removeEvent(matchId, eventId) {
      const { event, center } = await readFresh(matchId)
      return persist(event, removeMatchCenterEvent(center, eventId))
    },
  }
}
