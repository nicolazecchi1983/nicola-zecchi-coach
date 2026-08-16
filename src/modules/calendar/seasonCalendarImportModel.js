const COMPETITIONS = new Set(['Campionato', 'Coppa', 'Amichevole'])
const HOME_AWAY = new Set(['home', 'away', 'neutral'])

/** @param {unknown} value @param {number} [max] @returns {string} */
const clean = (value, max = 180) => String(value ?? '').trim().slice(0, max)

/**
 * @typedef {Object} SeasonImportRowInput
 * @property {unknown} [competition]
 * @property {unknown} [homeAway]
 * @property {unknown} [home_away]
 * @property {unknown} [matchDay]
 * @property {unknown} [match_day]
 * @property {unknown} [date]
 * @property {unknown} [time]
 * @property {unknown} [opponent]
 * @property {unknown} [location]
 */
/**
 * @typedef {Object} SeasonImportRow
 * @property {number} sourceRow
 * @property {string} matchDay
 * @property {string} date
 * @property {string} time
 * @property {string} opponent
 * @property {'home'|'away'|'neutral'} homeAway
 * @property {'Campionato'|'Coppa'|'Amichevole'} competition
 * @property {string} location
 */
/**
 * @param {SeasonImportRowInput} [row]
 * @param {number} [index]
 * @returns {SeasonImportRow}
 */
export function normalizeSeasonImportRow(row = {}, index = 0) {
  const competition = clean(row.competition || 'Campionato', 40)
  const homeAway = clean(row.homeAway || row.home_away || 'home', 20).toLowerCase()
  return {
    sourceRow: index + 1,
    matchDay: clean(row.matchDay ?? row.match_day, 20),
    date: clean(row.date, 10),
    time: clean(row.time || '15:30', 5),
    opponent: clean(row.opponent, 180),
    homeAway: /** @type {'home'|'away'|'neutral'} */ (HOME_AWAY.has(homeAway) ? homeAway : 'home'),
    competition: /** @type {'Campionato'|'Coppa'|'Amichevole'} */ (COMPETITIONS.has(competition) ? competition : 'Campionato'),
    location: clean(row.location, 180),
  }
}

/**
 * @param {SeasonImportRowInput[]} [rows]
 * @returns {{valid: boolean, errors: string[], rows: SeasonImportRow[]}}
 */
export function validateSeasonImportRows(rows = []) {
  const normalized = rows.map(normalizeSeasonImportRow)
  /** @type {string[]} */
  const errors = []
  normalized.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push(`Riga ${index + 1}: data non valida.`)
    if (!/^\d{2}:\d{2}$/.test(row.time)) errors.push(`Riga ${index + 1}: ora non valida.`)
    if (!row.opponent) errors.push(`Riga ${index + 1}: avversario mancante.`)
  })
  return { valid: errors.length === 0, errors, rows: normalized }
}

/**
 * @param {{date?: unknown, opponent?: unknown}} value
 * @returns {string}
 */
function eventKey({ date, opponent }) {
  return `${String(date || '').slice(0,10)}|${clean(opponent).toLocaleLowerCase('it-IT')}`
}

/**
 * @typedef {Object} CalendarMatchEvent
 * @property {string | null | undefined} [id]
 * @property {string | null | undefined} [type]
 * @property {string | null | undefined} [startAt]
 * @property {string | null | undefined} [date]
 * @property {string | null | undefined} [opponent]
 */
/**
 * @param {SeasonImportRow[]} [rows]
 * @param {CalendarMatchEvent[]} [calendarEvents]
 * @returns {Array<SeasonImportRow & {importStatus: 'duplicate'|'new', existingEventId: string|null}>}
 */
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
