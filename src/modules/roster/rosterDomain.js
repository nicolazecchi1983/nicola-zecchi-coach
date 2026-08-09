export function isLegacyRosterCandidate(team = {}) {
  const token = `${team?.name || ''} ${team?.shortName || ''}`.toLocaleLowerCase('it-IT')
  return token.includes('mezzolara')
}

export function shouldUseLegacyRoster({ team, totalPersistentPlayers = 0 } = {}) {
  if (!isLegacyRosterCandidate(team)) return false
  if (team?.rosterInitialized === true) return false
  return Number(totalPersistentPlayers || 0) === 0
}
