const COMPETITIONS = new Set(['Campionato', 'Coppa', 'Amichevole'])
const HOME_AWAY = new Set(['home', 'away', 'neutral'])

const clean = (value, max = 180) => String(value ?? '').trim().slice(0, max)

export function normalizeSeasonImportRow(row = {}, index = 0) {
  const competition = clean(row.competition || 'Campionato', 40)
  const homeAway = clean(row.homeAway || row.home_away || 'home', 20).toLowerCase()
  return {
    sourceRow: index + 1,
    matchDay: clean(row.matchDay ?? row.match_day, 20),
    date: clean(row.date, 10),
    time: clean(row.time || '15:30', 5),
    opponent: clean(row.opponent, 180),
    homeAway: HOME_AWAY.has(homeAway) ? homeAway : 'home',
    competition: COMPETITIONS.has(competition) ? competition : 'Campionato',
    location: clean(row.location, 180),
  }
}

export function validateSeasonImportRows(rows = []) {
  const normalized = rows.map(normalizeSeasonImportRow)
  const errors = []
  normalized.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push(`Riga ${index + 1}: data non valida.`)
    if (!/^\d{2}:\d{2}$/.test(row.time)) errors.push(`Riga ${index + 1}: ora non valida.`)
    if (!row.opponent) errors.push(`Riga ${index + 1}: avversario mancante.`)
  })
  return { valid: errors.length === 0, errors, rows: normalized }
}

function eventKey({ date, opponent }) {
  return `${String(date || '').slice(0,10)}|${clean(opponent).toLocaleLowerCase('it-IT')}`
}

export function classifySeasonImportRows(rows = [], calendarEvents = []) {
  const existing = new Map(
    calendarEvents
      .filter((event) => event?.type === 'match')
      .map((event) => [eventKey({
        date: event.startAt || event.date,
        opponent: event.opponent,
      }), event]),
  )
  return rows.map((row) => ({
    ...row,
    importStatus: existing.has(eventKey(row)) ? 'duplicate' : 'new',
    existingEventId: existing.get(eventKey(row))?.id || null,
  }))
}
