const MATCH_TYPE_BY_COMPETITION = {
  campionato: 'league',
  coppa: 'cup',
  amichevole: 'friendly',
}

function matchTypeFromCompetition(value = '') {
  return MATCH_TYPE_BY_COMPETITION[String(value).trim().toLocaleLowerCase('it-IT')] || 'friendly'
}

function parseHomeAway(value = '') {
  const normalized = String(value).trim().toLocaleLowerCase('it-IT')
  if (normalized === 'away' || normalized === 'trasferta') return 'away'
  if (normalized === 'neutral' || normalized === 'campo neutro' || normalized === 'neutro') return 'neutral'
  return 'home'
}

function buildMatchTitle(opponent, matchType) {
  const prefix = matchType === 'league' ? 'Campionato' : matchType === 'cup' ? 'Coppa' : 'Amichevole'
  return `Partita · ${prefix} · vs ${String(opponent || 'Da definire').trim()}`
}

function createStartAt(date, time) {
  const safeDate = String(date || '').slice(0, 10)
  const safeTime = String(time || '15:30').slice(0, 5) || '15:30'
  if (!safeDate) throw new Error('Inserisci la data della partita.')
  const value = new Date(`${safeDate}T${safeTime}:00`)
  if (Number.isNaN(value.getTime())) throw new Error('Data o ora della partita non valida.')
  return value.toISOString()
}

function parseMatchEventNotes(rawNotes) {
  try {
    const parsed = typeof rawNotes === 'string' ? JSON.parse(rawNotes || '{}') : (rawNotes || {})
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function buildMatchCalendarEventPayload(matchData = {}, { includeReport = false, existingNotes = null } = {}) {
  const opponent = String(matchData.opponent || 'Da definire').trim()
  const date = String(matchData.date || '').slice(0, 10)
  const time = String(matchData.time || '15:30').slice(0, 5)
  const matchType = matchTypeFromCompetition(matchData.competition)
  const homeAway = parseHomeAway(matchData.homeAway ?? matchData.home_away ?? matchData.venue)

  const notesPayload = {
    ...parseMatchEventNotes(existingNotes),
    type: 'match_event',
    schema_version: 1,
    match_type: matchType,
    opponent,
    home_away: homeAway,
  }

  if (includeReport) {
    notesPayload.report_status = 'completed'
    notesPayload.report_saved_at = new Date().toISOString()
    notesPayload.match_report = matchData
  }

  return {
    title: buildMatchTitle(opponent, matchType),
    event_type: 'match',
    start_at: createStartAt(date, time),
    location: String(matchData.location ?? matchData.venue ?? '').trim() || null,
    match_day: matchData.matchDay === '' || matchData.matchDay == null ? null : Number(matchData.matchDay),
    present_count: null,
    squad_total: null,
    training_sheet_path: null,
    notes: JSON.stringify(notesPayload),
  }
}

export function createMatchCalendarService({ createEvent, updateEvent, reloadEvents }) {
  if (typeof createEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Servizio Calendario non configurato.')
  }

  return {
    async createMatch(matchData = {}) {
      const payload = buildMatchCalendarEventPayload(matchData)
      const result = await createEvent(payload)
      const eventId = result?.id || null
      if (!eventId) throw new Error('Il Calendario non ha restituito l’identificativo della nuova partita.')
      if (typeof reloadEvents === 'function') await reloadEvents()
      return {
        eventId,
        created: true,
        match: {
          id: eventId,
          opponent: String(matchData.opponent || 'Da definire').trim(),
          date: String(matchData.date || '').slice(0, 10),
          time: String(matchData.time || '15:30').slice(0, 5),
        },
      }
    },

    async publish({ matchData = {}, activeMatch = null, calendarEvents = [] } = {}) {
      const opponent = String(matchData.opponent || activeMatch?.opponent || 'Da definire').trim()
      const date = String(matchData.date || activeMatch?.date || '').slice(0, 10)
      const activeId = activeMatch?.id ? String(activeMatch.id) : ''
      const existingEvent = calendarEvents.find((event) => String(event.id) === activeId)
        || calendarEvents.find((event) => {
          if (event.type !== 'match') return false
          const eventDate = String(event.startAt || '').slice(0, 10)
          return eventDate === date
            && String(event.opponent || '').trim().toLocaleLowerCase('it-IT') === opponent.toLocaleLowerCase('it-IT')
        })

      const payload = buildMatchCalendarEventPayload({
        ...matchData,
        opponent,
        date,
      }, {
        includeReport: true,
        existingNotes: existingEvent?.rawNotes || null,
      })

      const result = existingEvent
        ? await updateEvent(existingEvent.id, payload)
        : await createEvent(payload)

      if (typeof reloadEvents === 'function') await reloadEvents()

      return {
        eventId: existingEvent?.id || result?.id || null,
        created: !existingEvent,
      }
    },
  }
}
