import { supabase } from '../../supabase.js'
import { withDataAccessRetry } from '../dataAccess/withDataAccessRetry.js'
import { DATA_OPERATION_KIND } from '../dataAccess/dataOperationPolicy.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

export async function listTeamPlayerProfiles(teamId) {
  const client = requireSupabase()
  if (!teamId) return { data: [], error: null }
  return client
    .from('player_profiles')
    .select('*, team_players!inner(team_id)')
    .eq('team_players.team_id', teamId)
}

export async function upsertPersistentPlayerProfile(playerId, payload) {
  const client = requireSupabase()
  const row = {
    ...payload,
    player_id: playerId,
    // Compatibilità con lo schema storico: per i nuovi record persistenti
    // il vecchio player_key contiene l'UUID, ma non governa più l'identità.
    player_key: playerId,
  }

  return withDataAccessRetry(
    () => client
      .from('player_profiles')
      .upsert(row, { onConflict: 'player_id' })
      .select()
      .single(),
    { kind: DATA_OPERATION_KIND.IDEMPOTENT_WRITE, stage: 'player-profile-upsert-persistent' },
  )
}

export async function upsertLegacyPlayerProfile(playerKey, payload) {
  const client = requireSupabase()
  const row = {
    ...payload,
    player_key: playerKey,
  }

  return withDataAccessRetry(
    () => client
      .from('player_profiles')
      .upsert(row, { onConflict: 'player_key' })
      .select()
      .single(),
    { kind: DATA_OPERATION_KIND.IDEMPOTENT_WRITE, stage: 'player-profile-upsert-legacy' },
  )
}
