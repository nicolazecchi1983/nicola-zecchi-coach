import { supabase } from '../../supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

export async function listTeamPlayers(teamId) {
  const client = requireSupabase()
  return client
    .from('team_players')
    .select('*')
    .eq('team_id', teamId)
    .eq('active', true)
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })
}

export async function countTeamPlayers(teamId) {
  const client = requireSupabase()
  return client
    .from('team_players')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
}

export async function markTeamRosterInitialized(teamId) {
  const client = requireSupabase()
  return client
    .from('teams')
    .update({ roster_initialized: true, updated_at: new Date().toISOString() })
    .eq('id', teamId)
}

export async function insertTeamPlayers(rows) {
  const client = requireSupabase()
  return client.from('team_players').insert(rows)
}

export async function insertTeamPlayer(payload) {
  const client = requireSupabase()
  return client
    .from('team_players')
    .insert(payload)
    .select('*')
    .single()
}

export async function updateTeamPlayer(teamId, playerId, payload) {
  const client = requireSupabase()
  return client
    .from('team_players')
    .update(payload)
    .eq('id', playerId)
    .eq('team_id', teamId)
    .select('*')
    .single()
}

export async function deactivateTeamPlayer(teamId, playerId) {
  const client = requireSupabase()
  return client
    .from('team_players')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', playerId)
    .eq('team_id', teamId)
}
