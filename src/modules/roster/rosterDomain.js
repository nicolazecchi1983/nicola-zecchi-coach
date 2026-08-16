/**
 * @typedef {Object} TeamIdentityContract
 * @property {string | null | undefined} [id]
 * @property {string | null | undefined} [name]
 * @property {string | null | undefined} [shortName]
 * @property {boolean | undefined} [rosterInitialized]
 */

/**
 * @param {TeamIdentityContract} [team]
 * @returns {boolean}
 */
export function isLegacyRosterCandidate(team = {}) {
  const token = `${team?.name || ''} ${team?.shortName || ''}`.toLocaleLowerCase('it-IT')
  return token.includes('mezzolara')
}

/**
 * @param {{team?: TeamIdentityContract, totalPersistentPlayers?: number}} [input]
 * @returns {boolean}
 */
export function shouldUseLegacyRoster({ team, totalPersistentPlayers = 0 } = {}) {
  if (!isLegacyRosterCandidate(team)) return false
  if (team?.rosterInitialized === true) return false
  return Number(totalPersistentPlayers || 0) === 0
}
