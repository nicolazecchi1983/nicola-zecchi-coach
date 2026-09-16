import { getMatchGpsMetric } from './matchGpsMetricRegistry.js'

function text(value = '') {
  return String(value ?? '').trim()
}

function finiteNumberOrNull(value) {
  if (value == null || String(value).trim() === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function parseEventNotes(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  const raw = text(value)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {}
  } catch {
    return {}
  }
}

function eventMetadata(event = {}) {
  const notes = parseEventNotes(event.notes)
  const nested = notes.match && typeof notes.match === 'object' && !Array.isArray(notes.match)
    ? notes.match
    : {}
  return { ...notes, ...nested }
}

function opponentFromTitle(title = '') {
  const match = text(title).match(/\bvs\.?\s+(.+)$/i)
  return text(match?.[1])
}

export function normalizeMatchGpsHistoryEntry(input = {}) {
  const event = input.event && typeof input.event === 'object'
    ? input.event
    : {}
  const metadata = eventMetadata(event)
  const startAt = text(event.start_at ?? event.startAt ?? input.startAt)
  const eventId = text(input.eventId ?? input.event_id ?? event.id)
  const importId = text(input.importId ?? input.id)

  return {
    importId: importId || null,
    eventId: eventId || null,
    startAt: startAt || null,
    matchDate: startAt ? startAt.slice(0, 10) : null,
    opponent: text(
      event.opponent
      ?? metadata.opponent
      ?? metadata.opponent_name
      ?? opponentFromTitle(event.title),
    ) || 'Avversario',
    competition: text(
      event.competition
      ?? metadata.competition
      ?? metadata.competition_name,
    ) || null,
    competitionRound: text(
      event.competitionRound
      ?? event.competition_round
      ?? metadata.competitionRound
      ?? metadata.competition_round
      ?? metadata.round,
    ) || null,
    homeAway: text(
      event.homeAway
      ?? event.home_away
      ?? metadata.homeAway
      ?? metadata.home_away
      ?? metadata.match_type,
    ) || null,
    location: text(event.location) || null,
    importedAt: text(input.importedAt ?? input.imported_at) || null,
    updatedAt: text(input.updatedAt ?? input.updated_at) || null,
    sourceFileName: text(input.sourceFileName ?? input.source_file_name),
    rows: Array.isArray(input.rows) ? input.rows : [],
  }
}

export function normalizeMatchGpsHistory(items = []) {
  return items
    .map(normalizeMatchGpsHistoryEntry)
    .filter((item) => item.eventId)
    .sort((left, right) => {
      if (left.startAt && right.startAt) {
        return left.startAt.localeCompare(right.startAt)
          || String(left.eventId).localeCompare(String(right.eventId))
      }
      if (left.startAt) return -1
      if (right.startAt) return 1
      return String(left.eventId).localeCompare(String(right.eventId))
    })
}

export function normalizeMatchGpsPer90(value, minutesPlayed) {
  const numeric = finiteNumberOrNull(value)
  const minutes = finiteNumberOrNull(minutesPlayed)

  if (numeric == null || minutes == null || minutes <= 0) return null
  return (numeric / minutes) * 90
}

export function readMatchGpsMetricValue(
  row = {},
  metricKey,
  { mode = 'actual' } = {},
) {
  const definition = getMatchGpsMetric(metricKey)
  if (!definition) return null

  const raw = finiteNumberOrNull(row?.metrics?.[definition.key])
  if (raw == null) return null

  if (mode === 'actual') return raw
  if (mode === 'per90') {
    if (!definition.per90) return null
    return normalizeMatchGpsPer90(raw, row.minutesPlayed)
  }

  throw new TypeError(`Unsupported GPS metric mode: ${mode}`)
}

function summarizeValues(values = []) {
  const numeric = values
    .map(finiteNumberOrNull)
    .filter((value) => value != null)

  if (!numeric.length) {
    return Object.freeze({
      count: 0,
      sum: null,
      average: null,
      min: null,
      max: null,
    })
  }

  const sum = numeric.reduce((total, value) => total + value, 0)

  return Object.freeze({
    count: numeric.length,
    sum,
    average: sum / numeric.length,
    min: Math.min(...numeric),
    max: Math.max(...numeric),
  })
}

export function buildMatchGpsSquadMetricSeries(
  history = [],
  metricKey,
) {
  const definition = getMatchGpsMetric(metricKey)
  if (!definition) return []

  return normalizeMatchGpsHistory(history).map((match) => {
    const actualValues = []
    const normalizedValues = []
    let totalMinutes = 0
    let minutesCount = 0

    for (const row of match.rows) {
      const actual = readMatchGpsMetricValue(row, metricKey)
      if (actual != null) actualValues.push(actual)

      const minutes = finiteNumberOrNull(row.minutesPlayed)
      if (minutes != null && minutes >= 0) {
        totalMinutes += minutes
        minutesCount += 1
      }

      if (definition.per90) {
        const normalized = readMatchGpsMetricValue(row, metricKey, { mode: 'per90' })
        if (normalized != null) normalizedValues.push(normalized)
      }
    }

    return {
      eventId: match.eventId,
      matchDate: match.matchDate,
      startAt: match.startAt,
      opponent: match.opponent,
      competition: match.competition,
      competitionRound: match.competitionRound,
      playerCount: match.rows.length,
      totalMinutes: minutesCount ? totalMinutes : null,
      actual: summarizeValues(actualValues),
      per90: definition.per90 ? summarizeValues(normalizedValues) : null,
    }
  })
}

export function buildMatchGpsPlayerMetricSeries(
  history = [],
  playerId,
  metricKey,
) {
  const resolvedPlayerId = text(playerId)
  const definition = getMatchGpsMetric(metricKey)
  if (!resolvedPlayerId || !definition) return []

  return normalizeMatchGpsHistory(history).map((match) => {
    const row = match.rows.find(
      (item) => text(item?.playerId) === resolvedPlayerId,
    ) || null

    return {
      eventId: match.eventId,
      matchDate: match.matchDate,
      startAt: match.startAt,
      opponent: match.opponent,
      competition: match.competition,
      competitionRound: match.competitionRound,
      rowPresent: Boolean(row),
      minutesPlayed: row?.minutesPlayed ?? null,
      actualValue: row
        ? readMatchGpsMetricValue(row, metricKey)
        : null,
      per90Value: row && definition.per90
        ? readMatchGpsMetricValue(row, metricKey, { mode: 'per90' })
        : null,
    }
  })
}