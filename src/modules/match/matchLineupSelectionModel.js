import { MATCH_CALLUPS_MAX_PLAYERS } from './matchCallupsModel.js'

export const MATCH_LINEUP_STARTER_COUNT = 11
export const MATCH_LINEUP_MAX_BENCH = MATCH_CALLUPS_MAX_PLAYERS - MATCH_LINEUP_STARTER_COUNT

function cleanName(value) {
  return String(value ?? '').trim()
}

function playerSortParts(player = {}) {
  const canonicalName = cleanName(player.canonicalName || player.name)
  const displayName = cleanName(player.displayName || canonicalName)
  const surname = cleanName(player.surname) || cleanName(displayName.split(/\s+/).at(-1))
  const firstName = cleanName(player.firstName)
  return { surname, firstName, displayName }
}

function canonicalPlayerName(player = {}) {
  return cleanName(player.canonicalName || player.name)
}

export function sortMatchLineupPlayers(players = []) {
  return [...players].sort((left, right) => {
    const a = playerSortParts(left)
    const b = playerSortParts(right)
    return a.surname.localeCompare(b.surname, 'it', { sensitivity: 'base' })
      || a.firstName.localeCompare(b.firstName, 'it', { sensitivity: 'base' })
      || a.displayName.localeCompare(b.displayName, 'it', { sensitivity: 'base' })
  })
}

export function sanitizeMatchLineupStarters(starters = [], rosterPlayers = []) {
  const allowed = new Set(rosterPlayers.map(canonicalPlayerName).filter(Boolean))
  const seen = new Set()
  return Array.from({ length: MATCH_LINEUP_STARTER_COUNT }, (_, index) => {
    const name = cleanName(starters[index])
    if (!name || !allowed.has(name) || seen.has(name)) return ''
    seen.add(name)
    return name
  })
}

export function findMatchLineupDuplicatePlayers({ starters = [], bench = [] } = {}) {
  const usage = new Map()
  ;[...starters, ...bench]
    .map(cleanName)
    .filter(Boolean)
    .forEach((name) => usage.set(name, (usage.get(name) || 0) + 1))

  return [...usage.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort((left, right) => left.localeCompare(right, 'it', { sensitivity: 'base' }))
}
