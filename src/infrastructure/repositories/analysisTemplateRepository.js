import { supabase } from '../../supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

export function listAnalysisTemplateRows(teamId) {
  return requireSupabase()
    .from('analysis_templates')
    .select('id,team_id,owner_user_id,name,schema_version,schema_json,created_at,updated_at')
    .eq('team_id', teamId)
    .order('name', { ascending: true })
}

export function insertAnalysisTemplateRow(payload) {
  return requireSupabase()
    .from('analysis_templates')
    .insert(payload)
    .select('id,team_id,owner_user_id,name,schema_version,schema_json,created_at,updated_at')
    .single()
}

export function updateAnalysisTemplateRow(id, payload) {
  return requireSupabase()
    .from('analysis_templates')
    .update(payload)
    .eq('id', id)
    .select('id,team_id,owner_user_id,name,schema_version,schema_json,created_at,updated_at')
    .single()
}

export function deleteAnalysisTemplateRow(id) {
  return requireSupabase()
    .from('analysis_templates')
    .delete()
    .eq('id', id)
}
