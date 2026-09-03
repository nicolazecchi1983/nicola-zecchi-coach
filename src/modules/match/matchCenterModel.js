export const MATCH_CENTER_SCHEMA_VERSION = 1

export const MATCH_CENTER_EVENT_TYPES = Object.freeze([
  'goal',
  'substitution',
  'sanction',
  'formation_change',
])

export const MATCH_CENTER_STATUSES = Object.freeze([
  'not_started',
  'in_progress',
  'half_time',
  'finished',
])

export const MATCH_CENTER_PERIODS = Object.freeze([
  'pre_match',
  'first_half',
  'half_time',
  'second_half',
  'extra_time_first',
  'extra_time_break',
  'extra_time_second',
  'penalties',
  'full_time',
])

const EVENT_TYPE_SET = new Set(MATCH_CENTER_EVENT_TYPES)
const STATUS_SET = new Set(MATCH_CENTER_STATUSES)
const PERIOD_SET = new Set(MATCH_CENTER_PERIODS)
const SIDE_SET = new Set(['our', 'opponent'])
const SANCTION_SET = new Set(['yellow', 'second_yellow', 'red'])

function cleanText(value) {
  return String(value ?? '').trim()
}

function cleanInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = null } = {}) {
  if (value === '' || value == null) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback
  return parsed
}

function parseNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return { ...rawNotes }
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function normalizePlayer(value = {}) {
  if (typeof value === 'string') {
    return { playerId: '', name: cleanText(value) }
  }
  return {
    playerId: cleanText(value?.playerId ?? value?.player_id ?? value?.id),
    name: cleanText(value?.name ?? value?.canonicalName),
  }
}

function normalizeEventSide(value) {
  const side = cleanText(value)
  return SIDE_SET.has(side) ? side : 'our'
}

function normalizeMatchCenterEvent(value = {}, fallbackSequence = 0) {
  const type = cleanText(value.type)
  if (!EVENT_TYPE_SET.has(type)) return null

  const common = {
    id: cleanText(value.id),
    type,
    side: normalizeEventSide(value.side),
    minute: cleanInteger(value.minute, { min: 0, max: 130 }),
    addedMinute: cleanInteger(value.addedMinute ?? value.added_minute, { min: 0, max: 30, fallback: 0 }),
    sequence: cleanInteger(value.sequence, { min: 0, fallback: fallbackSequence }),
    createdAt: cleanText(value.createdAt ?? value.created_at),
  }

  if (type === 'goal') {
    return {
      ...common,
      scorer: normalizePlayer(value.scorer),
      assist: normalizePlayer(value.assist),
    }
  }

  if (type === 'substitution') {
    return {
      ...common,
      out: normalizePlayer(value.out),
      in: normalizePlayer(value.in),
      reason: cleanText(value.reason),
    }
  }

  if (type === 'sanction') {
    const sanction = cleanText(value.sanction)
    return {
      ...common,
      player: normalizePlayer(value.player),
      sanction: SANCTION_SET.has(sanction) ? sanction : 'yellow',
    }
  }

  return {
    ...common,
    formation: cleanText(value.formation),
    customFormation: cleanText(value.customFormation ?? value.custom_formation),
  }
}

function serializePlayer(player = {}) {
  return {
    player_id: cleanText(player.playerId) || null,
    name: cleanText(player.name) || null,
  }
}

function serializeMatchCenterEvent(event = {}) {
  const common = {
    id: cleanText(event.id),
    type: event.type,
    side: normalizeEventSide(event.side),
    minute: event.minute,
    added_minute: event.addedMinute || 0,
    sequence: event.sequence,
    created_at: cleanText(event.createdAt) || null,
  }

  if (event.type === 'goal') {
    return {
      ...common,
      scorer: serializePlayer(event.scorer),
      assist: serializePlayer(event.assist),
    }
  }

  if (event.type === 'substitution') {
    return {
      ...common,
      out: serializePlayer(event.out),
      in: serializePlayer(event.in),
      reason: cleanText(event.reason) || null,
    }
  }

  if (event.type === 'sanction') {
    return {
      ...common,
      player: serializePlayer(event.player),
      sanction: event.sanction,
    }
  }

  return {
    ...common,
    formation: cleanText(event.formation) || null,
    custom_formation: cleanText(event.customFormation) || null,
  }
}

function normalizeStatus(value) {
  const status = cleanText(value)
  return STATUS_SET.has(status) ? status : 'not_started'
}

function normalizePeriod(value) {
  const period = cleanText(value)
  return PERIOD_SET.has(period) ? period : 'pre_match'
}

function scoreAfterGoal(score, event, delta) {
  if (event?.type !== 'goal') return { ...score }
  const key = event.side === 'opponent' ? 'opponent' : 'our'
  return {
    ...score,
    [key]: Math.max(0, Number(score[key] || 0) + delta),
  }
}

export function normalizeMatchCenterState(value = {}, { persisted = false } = {}) {
  const rawEvents = Array.isArray(value.events) ? value.events : []
  const seenIds = new Set()
  const events = rawEvents
    .map((event, index) => normalizeMatchCenterEvent(event, index))
    .filter(Boolean)
    .filter((event) => {
      if (!event.id) return true
      if (seenIds.has(event.id)) return false
      seenIds.add(event.id)
      return true
    })

  const score = value.score && typeof value.score === 'object' ? value.score : {}

  return {
    status: normalizeStatus(value.status),
    period: normalizePeriod(value.period),
    score: {
      our: cleanInteger(score.our ?? value.goalsFor ?? value.goals_for, { min: 0, max: 99, fallback: 0 }),
      opponent: cleanInteger(score.opponent ?? value.goalsAgainst ?? value.goals_against, { min: 0, max: 99, fallback: 0 }),
    },
    events,
    updatedAt: cleanText(value.updatedAt ?? value.updated_at),
    persisted: Boolean(persisted),
    _schemaVersion: MATCH_CENTER_SCHEMA_VERSION,
  }
}

export function readMatchCenterFromEventNotes(rawNotes) {
  const notes = parseNotes(rawNotes)
  const exists = Boolean(notes.match_center && typeof notes.match_center === 'object')
  return normalizeMatchCenterState(notes.match_center || {}, { persisted: exists })
}

export function mergeMatchCenterIntoEventNotes(rawNotes, value = {}) {
  const notes = parseNotes(rawNotes)
  const center = normalizeMatchCenterState(value, { persisted: true })

  return JSON.stringify({
    ...notes,
    type: notes.type || 'match_event',
    match_center: {
      schema_version: MATCH_CENTER_SCHEMA_VERSION,
      status: center.status,
      period: center.period,
      score: {
        our: center.score.our,
        opponent: center.score.opponent,
      },
      events: center.events.map(serializeMatchCenterEvent),
      updated_at: center.updatedAt || null,
    },
  })
}

export function matchCenterFingerprint(value = {}) {
  const center = normalizeMatchCenterState(value)
  return JSON.stringify({
    status: center.status,
    period: center.period,
    score: center.score,
    events: center.events.map(serializeMatchCenterEvent),
  })
}

export function createMatchCenterEvent(value = {}, { id, now = new Date().toISOString(), sequence = 0 } = {}) {
  const normalized = normalizeMatchCenterEvent({
    ...value,
    id: cleanText(value.id) || cleanText(id),
    createdAt: cleanText(value.createdAt ?? value.created_at) || now,
    sequence: value.sequence ?? sequence,
  }, sequence)

  if (!normalized) throw new Error('Tipo evento Match Center non valido.')
  if (!normalized.id) throw new Error('Identificativo evento Match Center mancante.')
  return normalized
}

export function appendMatchCenterEvent(state = {}, event = {}) {
  const center = normalizeMatchCenterState(state)
  if (center.events.some((item) => item.id && item.id === event.id)) {
    throw new Error('Evento Match Center già presente.')
  }

  return normalizeMatchCenterState({
    ...center,
    score: scoreAfterGoal(center.score, event, 1),
    events: [...center.events, event],
  }, { persisted: center.persisted })
}

export function removeMatchCenterEvent(state = {}, eventId = '') {
  const center = normalizeMatchCenterState(state)
  const target = cleanText(eventId)
  const removed = center.events.find((event) => event.id === target)

  return normalizeMatchCenterState({
    ...center,
    score: scoreAfterGoal(center.score, removed, -1),
    events: center.events.filter((event) => event.id !== target),
  }, { persisted: center.persisted })
}
