import { AppError } from '../../core/appError.js'
import { normalizeSearchText } from '../../shared/text/textNormalization.js'

export const MATCH_GPS_SCHEMA_VERSION = 1

export const MATCH_GPS_SOURCE_COLUMNS = Object.freeze([
  Object.freeze({ key: 'sourcePlayerName', label: 'Cognome/ nome', kind: 'text', aliases: ['cognome nome'] }),
  Object.freeze({ key: 'sourceBirthDate', label: 'Data di nascita', kind: 'date', aliases: ['data di nascita'] }),
  Object.freeze({ key: 'restingHeartRate', label: 'CARDIO RIP.', kind: 'number', unit: 'bpm', aliases: ['cardio rip'] }),
  Object.freeze({ key: 'maxHeartRate', label: 'CARDIO MAX.', kind: 'number', unit: 'bpm', aliases: ['cardio max'] }),
  Object.freeze({ key: 'maxSpeedMs', label: 'VEL MAX m/s', kind: 'number', unit: 'm/s', aliases: ['vel max m s', 'vel max ms'] }),
  Object.freeze({ key: 'distanceMaxSpeedKm', label: 'Dist. Max vel. KM', kind: 'number', unit: 'km', aliases: ['dist max vel km'] }),
  Object.freeze({ key: 'averageSpeed', label: 'VEL media', kind: 'number', unit: null, aliases: ['vel media'] }),
  Object.freeze({ key: 'accelerationMs2', label: 'ACC m/s2', kind: 'number', unit: 'm/s²', aliases: ['acc m s2', 'acc ms2'] }),
  Object.freeze({ key: 'accelerationCount', label: 'n. ACC', kind: 'integer', unit: null, aliases: ['n acc'] }),
  Object.freeze({ key: 'decelerationCount', label: 'n. DECELL', kind: 'integer', unit: null, aliases: ['n decell'] }),
  Object.freeze({ key: 'distanceKm', label: 'KM', kind: 'number', unit: 'km', aliases: ['km'] }),
])

export const MATCH_GPS_METRIC_COLUMNS = Object.freeze(
  MATCH_GPS_SOURCE_COLUMNS.filter(({ kind }) => kind === 'number' || kind === 'integer'),
)

const MATCH_ACTIVITY_KEYS = new Set(MATCH_GPS_METRIC_COLUMNS
  .map(({ key }) => key)
  .filter((key) => key !== 'restingHeartRate'))

function cleanText(value, max = 180) {
  return String(value ?? '').trim().slice(0, max)
}

export function normalizeMatchGpsHeader(value = '') {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function headerAliases(column) {
  return new Set([column.label, ...(column.aliases || [])].map(normalizeMatchGpsHeader))
}

export function findMatchGpsHeader(matrix = []) {
  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : []
    const normalized = row.map(normalizeMatchGpsHeader)
    const indexes = {}
    for (const column of MATCH_GPS_SOURCE_COLUMNS) {
      const aliases = headerAliases(column)
      indexes[column.key] = normalized.findIndex((value) => aliases.has(value))
    }
    if (indexes.sourcePlayerName < 0) continue
    const missing = MATCH_GPS_SOURCE_COLUMNS.filter(({ key }) => indexes[key] < 0)
    if (missing.length) {
      throw new AppError(`Colonne GPS mancanti: ${missing.map(({ label }) => label).join(', ')}`, {
        code: 'MATCH_GPS_COLUMNS_MISSING',
        stage: 'match-gps-parse',
        userMessage: `Il foglio non rispetta il formato GPS previsto. Colonne mancanti: ${missing.map(({ label }) => label).join(', ')}.`,
      })
    }
    return { rowIndex, indexes, headers: row.map((value) => cleanText(value, 120)) }
  }
  throw new AppError('Intestazione GPS non trovata.', {
    code: 'MATCH_GPS_HEADER_NOT_FOUND',
    stage: 'match-gps-parse',
    userMessage: 'Non trovo la riga delle intestazioni GPS nel foglio selezionato.',
  })
}

function twoDigitYear(value) {
  const year = Number(value)
  return year <= 29 ? 2000 + year : 1900 + year
}

function datePartsToIso(day, month, year) {
  const yyyy = String(year).length === 2 ? twoDigitYear(year) : Number(year)
  const date = new Date(Date.UTC(yyyy, Number(month) - 1, Number(day)))
  if (date.getUTCFullYear() !== yyyy || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null
  return `${String(yyyy).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeMatchGpsDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return datePartsToIso(value.getDate(), value.getMonth() + 1, value.getFullYear())
  }
  const text = cleanText(value, 32)
  if (!text) return null
  const italian = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/)
  if (italian) return datePartsToIso(italian[1], italian[2], italian[3])
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return datePartsToIso(iso[3], iso[2], iso[1])
  return null
}

function parseNumericCell(value, { integer = false } = {}) {
  if (value == null || String(value).trim() === '') return { value: null, invalid: false }
  if (typeof value === 'number') {
    const valid = Number.isFinite(value) && value >= 0 && (!integer || Number.isInteger(value))
    return { value: valid ? value : null, invalid: !valid }
  }
  const text = String(value).trim().replace(/\s+/g, '')
  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) return { value: null, invalid: true }
  const parsed = Number(text.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed >= 0 && (!integer || Number.isInteger(parsed))
  return { value: valid ? parsed : null, invalid: !valid }
}

function sourceValueMap(row, header) {
  const values = {}
  for (const column of MATCH_GPS_SOURCE_COLUMNS) {
    const sourceLabel = header.headers[header.indexes[column.key]] || column.label
    values[sourceLabel] = row[header.indexes[column.key]] ?? null
  }
  return values
}

export function parseMatchGpsWorksheetRows(matrix = []) {
  const header = findMatchGpsHeader(matrix)
  const rows = []
  const ordinalIndex = header.indexes.sourcePlayerName - 1

  for (let rowIndex = header.rowIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : []
    const ordinal = Number(row[ordinalIndex])
    if (!Number.isInteger(ordinal) || ordinal < 1) continue

    const sourcePlayerName = cleanText(row[header.indexes.sourcePlayerName])
    if (!sourcePlayerName) continue
    const sourceBirthDate = normalizeMatchGpsDate(row[header.indexes.sourceBirthDate])
    const metrics = {}
    const invalidFields = []
    for (const column of MATCH_GPS_METRIC_COLUMNS) {
      const parsed = parseNumericCell(row[header.indexes[column.key]], { integer: column.kind === 'integer' })
      metrics[column.key] = parsed.value
      if (parsed.invalid) invalidFields.push(column.key)
    }
    const hasActivityData = [...MATCH_ACTIVITY_KEYS].some((key) => metrics[key] != null)
    rows.push({
      sourceRow: rowIndex + 1,
      sourceOrdinal: ordinal,
      sourcePlayerName,
      sourceBirthDate,
      sourceBirthYear: sourceBirthDate ? Number(sourceBirthDate.slice(0, 4)) : null,
      metrics,
      sourceValues: sourceValueMap(row, header),
      invalidFields,
      hasActivityData,
      included: hasActivityData,
      playerId: null,
      matchStatus: hasActivityData ? 'unmatched' : 'excluded',
      candidatePlayerIds: [],
    })
  }

  if (!rows.length) {
    throw new AppError('Nessuna riga giocatore trovata.', {
      code: 'MATCH_GPS_ROWS_NOT_FOUND',
      stage: 'match-gps-parse',
      userMessage: 'Il foglio contiene le intestazioni, ma non trovo righe giocatore numerate.',
    })
  }

  return {
    schemaVersion: MATCH_GPS_SCHEMA_VERSION,
    headerRow: header.rowIndex + 1,
    headers: header.headers,
    rows,
  }
}

function nameTokens(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'it'))
    .join('|')
}

function rosterBirthYear(player) {
  const value = Number(player?.year ?? player?.birthYear ?? player?.birth_year)
  return Number.isInteger(value) ? value : null
}

export function matchGpsRowsToRoster(rows = [], roster = []) {
  const persistentRoster = roster.filter((player) => cleanText(player?.id))
  return rows.map((row) => {
    if (!row.included) return { ...row, playerId: null, matchStatus: 'excluded', candidatePlayerIds: [] }
    const candidates = persistentRoster.filter((player) => nameTokens(player.name ?? player.full_name) === nameTokens(row.sourcePlayerName))
    const compatible = row.sourceBirthYear == null
      ? candidates
      : candidates.filter((player) => rosterBirthYear(player) == null || rosterBirthYear(player) === row.sourceBirthYear)
    if (compatible.length === 1) {
      return { ...row, playerId: String(compatible[0].id), matchStatus: 'matched', candidatePlayerIds: [String(compatible[0].id)] }
    }
    return {
      ...row,
      playerId: null,
      matchStatus: candidates.length ? 'review' : 'unmatched',
      candidatePlayerIds: candidates.map((player) => String(player.id)),
    }
  })
}

export function assignMatchGpsPlayer(rows = [], sourceRow, playerId, roster = []) {
  const resolvedId = cleanText(playerId)
  const playerExists = !resolvedId || roster.some((player) => String(player?.id || '') === resolvedId)
  if (!playerExists) return rows
  return rows.map((row) => row.sourceRow === Number(sourceRow) && row.included
    ? { ...row, playerId: resolvedId || null, matchStatus: resolvedId ? 'matched' : 'unmatched' }
    : row)
}

export function summarizeMatchGpsRows(rows = []) {
  const included = rows.filter((row) => row.included)
  return {
    sourceRows: rows.length,
    includedRows: included.length,
    excludedRows: rows.length - included.length,
    matchedRows: included.filter((row) => row.playerId).length,
    reviewRows: included.filter((row) => !row.playerId).length,
    invalidRows: included.filter((row) => row.invalidFields?.length).length,
  }
}

export function validateMatchGpsRows(rows = [], roster = []) {
  const included = rows.filter((row) => row.included)
  const errors = []
  if (!included.length) errors.push('Il foglio non contiene dati GPS partita da importare.')
  const rosterIds = new Set(roster.map((player) => String(player?.id || '')).filter(Boolean))
  const assigned = new Set()
  for (const row of included) {
    if (row.invalidFields?.length) errors.push(`Riga ${row.sourceRow}: contiene valori numerici non validi.`)
    const playerId = cleanText(row.playerId)
    if (!playerId) errors.push(`Riga ${row.sourceRow}: associa ${row.sourcePlayerName} a un giocatore della Rosa.`)
    else if (!rosterIds.has(playerId)) errors.push(`Riga ${row.sourceRow}: il giocatore associato non appartiene alla Rosa attiva.`)
    else if (assigned.has(playerId)) errors.push(`Riga ${row.sourceRow}: lo stesso giocatore è associato a più righe.`)
    else assigned.add(playerId)
  }
  return { valid: errors.length === 0, errors, rows: included }
}

export function buildMatchGpsSaveRows(rows = [], roster = []) {
  const validation = validateMatchGpsRows(rows, roster)
  if (!validation.valid) {
    throw new AppError(validation.errors.join(' '), {
      code: 'MATCH_GPS_IMPORT_INVALID',
      stage: 'match-gps-save',
      userMessage: validation.errors[0],
    })
  }
  return validation.rows.map((row) => ({
    playerId: row.playerId,
    sourceRow: row.sourceRow,
    sourceOrdinal: row.sourceOrdinal,
    sourcePlayerName: row.sourcePlayerName,
    sourceBirthDate: row.sourceBirthDate,
    metrics: { ...row.metrics },
    sourceValues: { ...row.sourceValues },
  }))
}
