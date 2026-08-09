const FEEDBACK_RATINGS = new Set(['green', 'yellow', 'red'])

function finiteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function scaleValue(value) {
  const number = finiteNumber(value)
  return number != null && number >= 1 && number <= 5 ? number : null
}

function nonNegativeNumber(value) {
  const number = finiteNumber(value)
  return number != null ? Math.max(0, number) : null
}

function textValue(value) {
  return String(value ?? '').trim()
}

function stringList(value) {
  return Array.isArray(value)
    ? value.map((item) => textValue(item)).filter(Boolean)
    : []
}

function countList(value) {
  return Array.isArray(value) ? value.length : 0
}

function phaseDuration(phase = {}) {
  return Math.max(0, finiteNumber(phase.duration ?? phase.duration_minutes) || 0)
}

function usesGoalkeepers(phase = {}) {
  const value = phase.goalkeepers
  if (value === true) return true
  return ['yes', 'si', 'sì', 'true', '1'].includes(textValue(value).toLowerCase())
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function increment(map, key) {
  const normalized = textValue(key)
  if (!normalized) return
  map.set(normalized, (map.get(normalized) || 0) + 1)
}

function mapToObject(map) {
  return Object.fromEntries(
    [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'it')),
  )
}

function feedbackRating(event = {}) {
  const raw = textValue(
    event.libraryFeedback?.trafficLight
      ?? event.libraryFeedback?.rating
      ?? event.feedbackRating,
  ).toLowerCase()
  return FEEDBACK_RATINGS.has(raw) ? raw : null
}

export function buildTrainingAnalyticsRecord(event = {}) {
  const data = event.editorData && typeof event.editorData === 'object'
    ? event.editorData
    : {}
  const phases = Array.isArray(data.phases) ? data.phases : []
  const presentCount = nonNegativeNumber(event.presentCount ?? data.present)
  const squadTotal = nonNegativeNumber(event.squadTotal)
  const attendanceRate = presentCount != null && squadTotal
    ? Math.min(1, presentCount / squadTotal)
    : null
  const rating = feedbackRating(event)

  return Object.freeze({
    eventId: event.id ?? null,
    date: textValue(data.date) || null,
    time: textValue(data.time || event.time) || null,
    startAt: event.startAt || null,
    matchDay: textValue(data.match_day ?? data.matchDay ?? event.matchDay) || null,
    location: textValue(data.location || event.place) || null,
    progressive: finiteNumber(data.progressive),
    status: textValue(data.status) || (event.trainingSheetPath ? 'published' : 'draft'),
    published: Boolean(event.trainingSheetPath),
    presentCount,
    squadTotal,
    attendanceRate: round(attendanceRate, 4),
    absentCount: countList(data.absent ?? data.absences?.absent),
    injuredCount: countList(data.injured ?? data.absences?.injured),
    differentiatedCount: countList(data.differentiated),
    durationMinutes: phases.reduce((sum, phase) => sum + phaseDuration(phase), 0),
    phaseCount: phases.length,
    goalkeeperPhaseCount: phases.filter(usesGoalkeepers).length,
    intensity: scaleValue(data.intensity),
    volume: scaleValue(data.volume),
    focus: textValue(data.focus) || null,
    objective: textValue(data.objective) || null,
    principles: textValue(data.principles) || null,
    pillars: Object.freeze(stringList(data.pillars)),
    feedbackRating: rating,
    feedbackNotes: textValue(event.libraryFeedback?.notes) || null,
    hasFeedback: Boolean(rating || textValue(event.libraryFeedback?.notes)),
  })
}

export function buildTrainingAnalyticsSnapshot(events = []) {
  const records = events
    .filter((event) => (event.type === 'training' || event.event_type === 'training') && event.trainingSheetPath)
    .map(buildTrainingAnalyticsRecord)

  const matchDay = new Map()
  const focus = new Map()
  const pillars = new Map()
  const feedback = new Map([
    ['green', 0],
    ['yellow', 0],
    ['red', 0],
    ['none', 0],
  ])

  records.forEach((record) => {
    increment(matchDay, record.matchDay)
    increment(focus, record.focus)
    record.pillars.forEach((pillar) => increment(pillars, pillar))
    feedback.set(record.feedbackRating || 'none', (feedback.get(record.feedbackRating || 'none') || 0) + 1)
  })

  const totalDurationMinutes = records.reduce((sum, record) => sum + record.durationMinutes, 0)
  const sessionsWithDuration = records.filter((record) => record.durationMinutes > 0)

  const coverage = (predicate) => records.length
    ? round(records.filter(predicate).length / records.length, 3)
    : 0

  return Object.freeze({
    records: Object.freeze(records),
    summary: Object.freeze({
      sessions: records.length,
      totalDurationMinutes,
      averageDurationMinutes: round(
        average(sessionsWithDuration.map((record) => record.durationMinutes)),
      ),
      averageIntensity: round(average(records.map((record) => record.intensity))),
      averageVolume: round(average(records.map((record) => record.volume))),
      averagePresent: round(average(records.map((record) => record.presentCount))),
      averageAttendanceRate: round(average(records.map((record) => record.attendanceRate)), 3),
      feedbackSessions: records.filter((record) => record.hasFeedback).length,
      notesSessions: records.filter((record) => Boolean(record.feedbackNotes)).length,
    }),
    distributions: Object.freeze({
      matchDay: Object.freeze(mapToObject(matchDay)),
      focus: Object.freeze(mapToObject(focus)),
      pillars: Object.freeze(mapToObject(pillars)),
      feedback: Object.freeze(Object.fromEntries(feedback)),
    }),
    coverage: Object.freeze({
      matchDay: coverage((record) => Boolean(record.matchDay)),
      focus: coverage((record) => Boolean(record.focus)),
      objective: coverage((record) => Boolean(record.objective)),
      intensity: coverage((record) => record.intensity != null),
      volume: coverage((record) => record.volume != null),
      attendance: coverage((record) => record.presentCount != null),
    }),
  })
}
