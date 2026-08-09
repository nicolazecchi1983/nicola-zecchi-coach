import { supabase } from '../../supabase.js'

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
  return client
    .from('player_profiles')
    .upsert({
      ...payload,
      player_id: playerId,
      // Compatibilità con lo schema storico: per i nuovi record persistenti
      // il vecchio player_key contiene l'UUID, ma non governa più l'identità.
      player_key: playerId,
    }, { onConflict: 'player_id' })
    .select()
    .single()
}

export async function upsertLegacyPlayerProfile(playerKey, payload) {
  const client = requireSupabase()
  return client
    .from('player_profiles')
    .upsert({
      ...payload,
      player_key: playerKey,
    }, { onConflict: 'player_key' })
    .select()
    .single()
}
