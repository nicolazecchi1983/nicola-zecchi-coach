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

export function sortMatchLineupPlayers(players = []) {
  return [...players].sort((left, right) => {
    const a = playerSortParts(left)
    const b = playerSortParts(right)
    return a.surname.localeCompare(b.surname, 'it', { sensitivity: 'base' })
      || a.firstName.localeCompare(b.firstName, 'it', { sensitivity: 'base' })
      || a.displayName.localeCompare(b.displayName, 'it', { sensitivity: 'base' })
  })
}

export function findMatchLineupDuplicatePlayers({ starters = [], bench = [] } = {}) {
  const counts = new Map()
  ;[...starters, ...bench].map(cleanName).filter(Boolean)
    .forEach((name) => counts.set(name, (counts.get(name) || 0) + 1))
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
}
