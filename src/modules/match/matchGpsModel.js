import { AppError } from '../../core/appError.js'
import { normalizeSearchText } from '../../shared/text/textNormalization.js'
import {
  MATCH_GPS_METRIC_REGISTRY,
  getMatchGpsMetrics,
} from './matchGpsMetricRegistry.js'

export const MATCH_GPS_SCHEMA_VERSION = 3

const MATCH_GPS_IDENTITY_COLUMNS = Object.freeze([
  Object.freeze({
    key: 'sourcePlayerName',
    label: 'Cognome/ nome',
    kind: 'text',
    aliases: ['cognome nome'],
  }),
  Object.freeze({
    key: 'sourceBirthDate',
    label: 'Data di nascita',
    kind: 'date',
    aliases: ['data di nascita'],
  }),
])

export const MATCH_GPS_METRIC_COLUMNS = MATCH_GPS_METRIC_REGISTRY

export const MATCH_GPS_SOURCE_COLUMNS = Object.freeze([
  ...MATCH_GPS_IDENTITY_COLUMNS,
  ...MATCH_GPS_METRIC_COLUMNS,
])

const MATCH_GPS_CONTEXT_COLUMNS = Object.freeze([
  Object.freeze({
    key: 'minutesPlayed',
    label: 'minuti giocati',
    kind: 'integer',
    aliases: ['minuti giocati', 'minuti', 'min giocati'],
  }),
])

const MATCH_ACTIVITY_KEYS = new Set(
  getMatchGpsMetrics({ activitySignal: true }).map(({ key }) => key),
)

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
  return new Set(
    [column.label, ...(column.aliases || [])].map(normalizeMatchGpsHeader),
  )
}

function resolveHeaderIndexes(normalized) {
  const indexes = {}

  for (const column of MATCH_GPS_IDENTITY_COLUMNS) {
    const aliases = headerAliases(column)
    indexes[column.key] = normalized.findIndex((value) => aliases.has(value))
  }

  for (const column of MATCH_GPS_METRIC_COLUMNS) {
    const aliases = headerAliases(column)
    indexes[column.key] = normalized.findIndex((value) => aliases.has(value))
  }

  for (const column of MATCH_GPS_CONTEXT_COLUMNS) {
    const aliases = headerAliases(column)
    indexes[column.key] = normalized.findIndex((value) => aliases.has(value))
  }

  return indexes
}

export function findMatchGpsHeader(matrix = []) {
  let identityHeaderFound = false

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : []
    const normalized = row.map(normalizeMatchGpsHeader)
    const indexes = resolveHeaderIndexes(normalized)

    if (indexes.sourcePlayerName < 0) continue

    identityHeaderFound = true

    const metricColumns = MATCH_GPS_METRIC_COLUMNS.filter(
      ({ key }) => indexes[key] >= 0,
    )

    if (!metricColumns.length) continue

    return {
      rowIndex,
      indexes,
      metricColumns,
      headers: row.map((value) => cleanText(value, 120)),
    }
  }

  if (identityHeaderFound) {
    throw new AppError('Nessuna metrica GPS riconosciuta.', {
      code: 'MATCH_GPS_METRICS_NOT_FOUND',
      stage: 'match-gps-parse',
      userMessage:
        'Trovo la colonna giocatore, ma nessuna metrica GPS riconosciuta da STAFF.',
    })
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

  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return `${String(yyyy).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeMatchGpsDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return datePartsToIso(
      value.getDate(),
      value.getMonth() + 1,
      value.getFullYear(),
    )
  }

  const text = cleanText(value, 32)
  if (!text) return null

  const italian = text.match(
    /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/,
  )

  if (italian) {
    return datePartsToIso(italian[1], italian[2], italian[3])
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (iso) {
    return datePartsToIso(iso[3], iso[2], iso[1])
  }

  return null
}

function parseNumericCell(value, { integer = false } = {}) {
  if (value == null || String(value).trim() === '') {
    return { value: null, invalid: false }
  }

  if (typeof value === 'number') {
    const valid =
      Number.isFinite(value) &&
      value >= 0 &&
      (!integer || Number.isInteger(value))

    return {
      value: valid ? value : null,
      invalid: !valid,
    }
  }

  const text = String(value).trim().replace(/\s+/g, '')

  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) {
    return { value: null, invalid: true }
  }

  const parsed = Number(text.replace(',', '.'))
  const valid =
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    (!integer || Number.isInteger(parsed))

  return {
    value: valid ? parsed : null,
    invalid: !valid,
  }
}

function sourceValueMap(row, header) {
  const values = {}
  const occurrences = new Map()

  for (let index = 0; index < header.headers.length; index += 1) {
    const rawLabel = cleanText(header.headers[index], 120)
    const baseLabel = rawLabel || `Colonna ${index + 1}`

    const occurrence = (occurrences.get(baseLabel) || 0) + 1
    occurrences.set(baseLabel, occurrence)

    const sourceLabel =
      occurrence === 1
        ? baseLabel
        : `${baseLabel} (${occurrence})`

    values[sourceLabel] = row[index] ?? null
  }

  return values
}

function resolveOrdinalIndex(header) {
  const candidate = header.indexes.sourcePlayerName - 1

  if (candidate < 0) return -1

  const normalized = normalizeMatchGpsHeader(header.headers[candidate])

  if (
    !normalized ||
    ['n', 'nr', 'num', 'numero', 'progressivo'].includes(normalized)
  ) {
    return candidate
  }

  return -1
}

function hasRawValue(value) {
  return value != null && String(value).trim() !== ''
}

export function parseMatchGpsWorksheetRows(matrix = []) {
  const header = findMatchGpsHeader(matrix)
  const rows = []
  const ordinalIndex = resolveOrdinalIndex(header)

  for (
    let rowIndex = header.rowIndex + 1;
    rowIndex < matrix.length;
    rowIndex += 1
  ) {
    const row = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : []

    let sourceOrdinal = null

    if (ordinalIndex >= 0) {
      const ordinal = Number(row[ordinalIndex])

      if (!Number.isInteger(ordinal) || ordinal < 1) continue

      sourceOrdinal = ordinal
    }

    const sourcePlayerName = cleanText(
      row[header.indexes.sourcePlayerName],
    )

    if (!sourcePlayerName) continue

    const birthDateIndex = header.indexes.sourceBirthDate
    const sourceBirthDate =
      birthDateIndex == null || birthDateIndex < 0
        ? null
        : normalizeMatchGpsDate(row[birthDateIndex])

    const metrics = {}
    const invalidFields = []

    let hasRecognizedRawMetric = false

    for (const column of header.metricColumns) {
      const metricIndex = header.indexes[column.key]
      const rawValue = row[metricIndex]

      if (hasRawValue(rawValue)) {
        hasRecognizedRawMetric = true
      }

      const parsed = parseNumericCell(rawValue, {
        integer: column.kind === 'integer',
      })

      metrics[column.key] = parsed.value

      if (parsed.invalid) {
        invalidFields.push(column.key)
      }
    }

    const minutesIndex = header.indexes.minutesPlayed

    const parsedMinutes =
      minutesIndex == null || minutesIndex < 0
        ? { value: null, invalid: false }
        : parseNumericCell(row[minutesIndex], { integer: true })

    if (parsedMinutes.invalid) {
      invalidFields.push('minutesPlayed')
    }

    if (
      ordinalIndex < 0 &&
      !hasRecognizedRawMetric &&
      !hasRawValue(minutesIndex >= 0 ? row[minutesIndex] : null) &&
      sourceBirthDate == null
    ) {
      continue
    }

    const hasActivityData = [...MATCH_ACTIVITY_KEYS].some(
      (key) => metrics[key] != null,
    )

    rows.push({
      sourceRow: rowIndex + 1,
      sourceOrdinal,
      sourcePlayerName,
      sourceBirthDate,
      sourceBirthYear: sourceBirthDate
        ? Number(sourceBirthDate.slice(0, 4))
        : null,
      minutesPlayed: parsedMinutes.value,
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
      userMessage:
        'Il foglio contiene le intestazioni, ma non trovo righe giocatore utilizzabili.',
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
  const raw = player?.year ?? player?.birthYear ?? player?.birth_year
  if (raw == null || String(raw).trim() === '') return null
  const value = Number(raw)
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
    minutesPlayed: row.minutesPlayed ?? null,
    metrics: { ...row.metrics },
    sourceValues: { ...row.sourceValues },
  }))
}
