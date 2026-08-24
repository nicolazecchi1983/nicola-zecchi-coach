export const MATCH_CALLUPS_SCHEMA_VERSION = 1

function cleanText(value) { return String(value ?? '').trim() }
function cleanNumber(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 && number <= 99 ? number : null
}
function parseNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return { ...rawNotes }
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}
function normalizePlayer(player = {}) {
  return {
    playerId: cleanText(player.playerId ?? player.id),
    name: cleanText(player.name ?? player.canonicalName),
    role: cleanText(player.role || 'Altro'),
    shirtNumber: cleanNumber(player.shirtNumber ?? player.number),
  }
}
export function normalizeMatchCallups(value = {}, { persisted = false } = {}) {
  const seen = new Set()
  const players = []
  for (const raw of Array.isArray(value.players) ? value.players : []) {
    const player = normalizePlayer(raw)
    const key = player.playerId || player.name.toLocaleLowerCase('it-IT')
    if (!key || seen.has(key)) continue
    seen.add(key)
    players.push(player)
  }
  return {
    players,
    persisted: Boolean(persisted),
    updatedAt: cleanText(value.updatedAt ?? value.updated_at),
    _schemaVersion: MATCH_CALLUPS_SCHEMA_VERSION,
  }
}
export function readMatchCallupsFromEventNotes(rawNotes) {
  const notes = parseNotes(rawNotes)
  const exists = Boolean(notes.match_callups && typeof notes.match_callups === 'object')
  return normalizeMatchCallups(notes.match_callups || {}, { persisted: exists })
}
export function mergeMatchCallupsIntoEventNotes(rawNotes, callups) {
  const notes = parseNotes(rawNotes)
  return JSON.stringify({
    ...notes,
    type: notes.type || 'match_event',
    match_callups: {
      ...normalizeMatchCallups(callups, { persisted: true }),
      persisted: undefined,
      schema_version: MATCH_CALLUPS_SCHEMA_VERSION,
    },
  })
}
export function filterRosterBySavedCallups(rosterPlayers = [], callups = {}) {
  if (!callups?.persisted) return rosterPlayers
  const ids = new Set((callups.players || []).map((p) => p.playerId).filter(Boolean))
  const names = new Set((callups.players || []).map((p) => p.name.toLocaleLowerCase('it-IT')).filter(Boolean))
  return rosterPlayers.filter((player) => {
    const id = cleanText(player.id ?? player.playerId)
    const name = cleanText(player.canonicalName ?? player.name).toLocaleLowerCase('it-IT')
    return (id && ids.has(id)) || (name && names.has(name))
  })
}

export function createActiveMatchRosterSelector({
  getRosterPlayers,
  getActiveMatchContext,
  getCalendarEvents,
} = {}) {
  return function getActiveMatchRosterPlayers() {
    const roster = typeof getRosterPlayers === 'function' ? getRosterPlayers() : []
    const activeMatch = typeof getActiveMatchContext === 'function' ? getActiveMatchContext() : null
    const events = typeof getCalendarEvents === 'function' ? getCalendarEvents() : []
    const event = events.find((item) => String(item?.id || '') === String(activeMatch?.id || '')) || null
    return filterRosterBySavedCallups(roster, readMatchCallupsFromEventNotes(event?.notes || ''))
  }
}
