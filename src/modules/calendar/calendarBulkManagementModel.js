const MATCH_WORK_KEYS = ['match_report', 'opponent_study', 'post_match']

function parseNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return rawNotes
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function hasMeaningfulValue(value) {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.some(hasMeaningfulValue)
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => !['schema_version', 'schemaVersion', '_schemaVersion', 'updated_at', 'updatedAt', 'matchId'].includes(key))
      .some(([, item]) => hasMeaningfulValue(item))
  }
  return true
}

export function calendarEventProtection(event = {}) {
  if (event.type === 'training' && (event.trainingSheetPath || event.editorData)) {
    return { protected: true, reason: 'Training Sheet collegata' }
  }

  if (event.type === 'match') {
    const notes = parseNotes(event.rawNotes)
    const workKey = MATCH_WORK_KEYS.find((key) => hasMeaningfulValue(notes[key]))
    if (workKey) {
      const label = ({
        match_report: 'Match Report',
        opponent_study: 'Studio avversario',
        post_match: 'Post gara',
      })[workKey]
      return { protected: true, reason: `${label} presente` }
    }
  }

  return { protected: false, reason: '' }
}

export function eventDateKey(event = {}) {
  const raw = String(event.startAt || '').trim()
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function eventCompetition(event = {}) {
  if (event.type !== 'match') return ''
  return event.matchType === 'cup' ? 'cup'
    : event.matchType === 'friendly' ? 'friendly'
      : 'league'
}

export function selectCalendarEventsForBulkAction(events = [], criteria = {}) {
  const mode = String(criteria.mode || 'range')
  const from = String(criteria.from || '')
  const to = String(criteria.to || '')
  const type = String(criteria.type || '')
  const competition = String(criteria.competition || '')

  const selected = events.filter((event) => {
    if (mode === 'range') {
      if (!from || !to || from > to) return false
      const key = eventDateKey(event)
      return key && key >= from && key <= to
    }
    if (mode === 'type') return !type || event.type === type
    if (mode === 'competition') return event.type === 'match' && (!competition || eventCompetition(event) === competition)
    if (mode === 'all') return true
    return false
  })

  const protectedEvents = []
  const deletableEvents = []
  selected.forEach((event) => {
    const protection = calendarEventProtection(event)
    if (protection.protected) protectedEvents.push({ ...event, protectionReason: protection.reason })
    else deletableEvents.push(event)
  })

  const byType = selected.reduce((acc, event) => {
    const key = event.type || 'other'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return {
    selected,
    deletableEvents,
    protectedEvents,
    byType,
  }
}
