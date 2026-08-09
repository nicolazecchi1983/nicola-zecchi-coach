import {
  listTeamPlayerProfiles,
  upsertLegacyPlayerProfile,
  upsertPersistentPlayerProfile,
} from '../../infrastructure/repositories/playerProfileRepository.js'
import { rosterPlayerIdentity, rosterPlayerKey } from './rosterService.js'

export function playerProfileLookupKeys(player) {
  const identity = rosterPlayerIdentity(player)
  const legacyKey = rosterPlayerKey(player)
  return [...new Set([identity, legacyKey].filter(Boolean))]
}

export async function loadPlayerProfileMap(teamId) {
  const { data, error } = await listTeamPlayerProfiles(teamId)

  if (error) {
    console.warn('Schede giocatore non ancora collegate:', error.message)
    return {}
  }

  const map = {}
  for (const profile of data ?? []) {
    // Canonico: FK verso team_players.id.
    if (profile.player_id) map[String(profile.player_id)] = profile
    // Compatibilità: profili creati prima della R13.
    if (profile.player_key && !map[String(profile.player_key)]) {
      map[String(profile.player_key)] = profile
    }
  }
  return map
}

export async function savePlayerProfile(player, payload) {
  const playerId = String(player?.id || '').trim()
  if (playerId) {
    const { data, error } = await upsertPersistentPlayerProfile(playerId, payload)
    if (error) throw error
    return data
  }

  // Il fallback è ammesso solo per la Rosa legacy pre-migrazione.
  const legacyKey = rosterPlayerKey(player)
  if (!legacyKey) throw new Error('Identità giocatore non disponibile.')
  const { data, error } = await upsertLegacyPlayerProfile(legacyKey, payload)
  if (error) throw error
  return data
}
