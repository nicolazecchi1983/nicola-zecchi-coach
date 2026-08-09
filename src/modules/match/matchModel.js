export const MATCH_DRAFT_SCHEMA_VERSION = 3
export const MATCH_DOCUMENT_SCHEMA_VERSION = 1

const HOME_AWAY_VALUES = new Set(['home', 'away', 'neutral'])

function cleanText(value) {
  return String(value ?? '').trim()
}

function normalizeTimestamp(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function createValidationIssue(code, field, message) {
  return Object.freeze({ code, field, message })
}

export function normalizeScore(home, away) {
  const left = String(home ?? '').trim()
  const right = String(away ?? '').trim()
  return left || right ? `${left || 0}-${right || 0}` : ''
}

export function parseScore(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(':', '-')
  if (!normalized) return { home: '', away: '', display: '' }
  const match = normalized.match(/^(\d{1,2})-(\d{1,2})$/)
  if (!match) return { home: '', away: '', display: normalized }
  const home = String(Math.min(99, Number(match[1])))
  const away = String(Math.min(99, Number(match[2])))
  return { home, away, display: `${home}-${away}` }
}

export function normalizeMatchHomeAway(value) {
  const normalized = cleanText(value).toLocaleLowerCase('it-IT')
  if (HOME_AWAY_VALUES.has(normalized)) return normalized
  if (normalized === 'trasferta') return 'away'
  if (normalized === 'campo neutro' || normalized === 'neutro') return 'neutral'
  return 'home'
}

export function resolveMatchLocation(input = {}) {
  const explicit = cleanText(input.location)
  if (explicit) return explicit

  // Compatibilità con Match Library: lì "venue" storicamente indica l'impianto,
  // mentre nel Match Sheet legacy "venue" indica Casa/Trasferta/Campo neutro.
  const legacyVenue = cleanText(input.venue)
  const venueToken = legacyVenue.toLocaleLowerCase('it-IT')
  if (!['casa', 'trasferta', 'campo neutro', 'home', 'away', 'neutral'].includes(venueToken)) {
    return legacyVenue
  }
  return ''
}

export function normalizeMatchDocument(input = {}) {
  const result = parseScore(input.result || normalizeScore(input.result_home, input.result_away))
  const halfResult = parseScore(input.half_result || normalizeScore(input.half_result_home, input.half_result_away))
  const homeAwaySource = input.homeAway ?? input.home_away ?? input.venue

  return {
    ...input,
    _documentSchemaVersion: MATCH_DOCUMENT_SCHEMA_VERSION,
    eventId: cleanText(input.eventId ?? input.event_id ?? input.id) || null,
    date: cleanText(input.date).slice(0, 10),
    time: cleanText(input.time).slice(0, 5),
    competition: cleanText(input.competition || 'Campionato'),
    opponent: cleanText(input.opponent),
    homeAway: normalizeMatchHomeAway(homeAwaySource),
    location: resolveMatchLocation(input),
    round: cleanText(input.round ?? input.matchDay ?? input.match_day),
    result: result.display,
    result_home: result.home,
    result_away: result.away,
    half_result: halfResult.display,
    half_result_home: halfResult.home,
    half_result_away: halfResult.away,
    created_at: normalizeTimestamp(input.created_at || input.createdAt),
    updated_at: normalizeTimestamp(input.updated_at || input.updatedAt),
  }
}

export function inspectMatchDocument(input = {}) {
  const data = normalizeMatchDocument(input)
  const errors = []
  const warnings = []

  if (!data.date) {
    errors.push(createValidationIssue('MATCH_DATE_REQUIRED', 'date', 'La data della gara è obbligatoria.'))
  }
  if (!data.opponent || data.opponent.toLocaleLowerCase('it-IT') === 'da definire') {
    errors.push(createValidationIssue('MATCH_OPPONENT_REQUIRED', 'opponent', 'Definisci la squadra avversaria.'))
  }
  if (!data.time) {
    warnings.push(createValidationIssue('MATCH_TIME_MISSING', 'time', 'Orario gara non ancora definito.'))
  }
  if (!data.location) {
    warnings.push(createValidationIssue('MATCH_LOCATION_MISSING', 'location', 'Impianto gara non ancora definito.'))
  }

  return Object.freeze({
    valid: errors.length === 0,
    data: Object.freeze(data),
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  })
}

function syncScoreFields(form, prefix) {
  const displayField = form.elements[prefix]
  const homeField = form.elements[`${prefix}_home`]
  const awayField = form.elements[`${prefix}_away`]
  if (!displayField) return

  const legacy = normalizeScore(homeField?.value, awayField?.value)
  if (legacy) {
    const parsedLegacy = parseScore(legacy)
    displayField.value = parsedLegacy.display
    if (homeField) homeField.value = parsedLegacy.home
    if (awayField) awayField.value = parsedLegacy.away
    return
  }

  const current = parseScore(displayField.value)
  if (current.home !== '' && current.away !== '') {
    displayField.value = current.display
    if (homeField) homeField.value = current.home
    if (awayField) awayField.value = current.away
  }
}

export function collectMatchFormData(form) {
  if (!form) return {}
  syncScoreFields(form, 'result')
  syncScoreFields(form, 'half_result')

  const data = Object.fromEntries(new FormData(form).entries())
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    data[input.name] = input.checked
  })

  return {
    _schemaVersion: MATCH_DRAFT_SCHEMA_VERSION,
    ...data,
  }
}

export function getMatchDraftPayload(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { _schemaVersion, ...data } = raw
  return data
}
