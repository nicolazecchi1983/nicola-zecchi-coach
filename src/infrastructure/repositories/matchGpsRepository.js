import { supabase } from '../../supabase.js'
import { DATA_OPERATION_KIND } from '../dataAccess/dataOperationPolicy.js'
import { withDataAccessRetry } from '../dataAccess/withDataAccessRetry.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase non configurato.')
  return supabase
}

export async function loadMatchGpsImportRow(teamId, eventId) {
  const client = requireSupabase()
  return withDataAccessRetry(async () => {
    const importResult = await client
      .from('match_gps_imports')
      .select('id,team_id,event_id,schema_version,source_file_name,source_sheet_name,source_header_row,source_headers,source_row_count,imported_by,imported_at,updated_at')
      .eq('team_id', teamId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (importResult.error || !importResult.data) return importResult

    const metricsResult = await client
      .from('match_gps_player_metrics')
      .select('id,import_id,team_id,player_id,source_row,source_ordinal,source_player_name,source_birth_date,minutes_played,resting_heart_rate,max_heart_rate,max_speed_ms,distance_max_speed_km,average_speed,acceleration_ms2,acceleration_count,deceleration_count,distance_km,metric_values,source_values,created_at')
      .eq('team_id', teamId)
      .eq('import_id', importResult.data.id)
      .order('source_row', { ascending: true })

    return metricsResult.error
      ? { data: null, error: metricsResult.error }
      : { data: { ...importResult.data, metrics: metricsResult.data || [] }, error: null }
  }, { kind: DATA_OPERATION_KIND.READ, stage: 'match-gps-load' })
}

export async function replaceMatchGpsImportRow(payload) {
  const client = requireSupabase()
  return withDataAccessRetry(
    () => client.rpc('replace_match_gps_import', payload),
    { kind: DATA_OPERATION_KIND.IDEMPOTENT_WRITE, stage: 'match-gps-save' },
  )
}
