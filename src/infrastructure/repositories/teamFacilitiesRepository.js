import { supabase } from '../../supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

export async function listTeamFacilities(teamId) {
  const client = requireSupabase()
  return client
    .from('team_facilities')
    .select('id,team_id,name,active,created_at,updated_at')
    .eq('team_id', teamId)
    .eq('active', true)
    .order('name', { ascending: true })
}

export async function replaceTeamFacilitiesRows(teamId, names) {
  const client = requireSupabase()
  return client.rpc('replace_team_facilities', {
    p_team_id: teamId,
    p_names: names,
  })
}
