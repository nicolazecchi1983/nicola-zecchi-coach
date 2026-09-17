import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')

const migration = read('supabase/migrations/20260916084825_match_gps_extensible_metric_values.sql')
const foundation = read('supabase/migrations/20260915073404_match_gps_foundation.sql')

const legacySqlColumns = [
  'resting_heart_rate',
  'max_heart_rate',
  'max_speed_ms',
  'distance_max_speed_km',
  'average_speed',
  'acceleration_ms2',
  'acceleration_count',
  'deceleration_count',
  'distance_km',
]

const canonicalLegacyKeys = [
  'restingHeartRate',
  'maxHeartRate',
  'maxSpeedMs',
  'distanceMaxSpeedKm',
  'averageSpeed',
  'accelerationMs2',
  'accelerationCount',
  'decelerationCount',
  'distanceKm',
]

const rpcSignature = [
  'p_team_id uuid',
  'p_event_id uuid',
  'p_schema_version integer',
  'p_source_file_name text',
  'p_source_sheet_name text',
  'p_source_header_row integer',
  'p_source_headers jsonb',
  'p_source_row_count integer',
  'p_rows jsonb',
]

const checks = [
  [
    'metric_values is an object-only non-null JSONB payload',
    migration.includes('add column if not exists metric_values jsonb') &&
      migration.includes("not null default '{}'::jsonb") &&
      migration.includes("check (jsonb_typeof(metric_values) = 'object')"),
  ],
  [
    'existing GPS rows are backfilled from the R31 typed metrics',
    migration.includes('update public.match_gps_player_metrics') &&
      migration.includes('set metric_values = jsonb_strip_nulls(') &&
      migration.includes("where metric_values = '{}'::jsonb") &&
      canonicalLegacyKeys.every((key) => migration.includes(`'${key}'`)),
  ],
  [
    'all R31 physical metric columns remain represented',
    legacySqlColumns.every((column) =>
      foundation.includes(column) &&
      migration.includes(column)
    ),
  ],
  [
    'migration contains no destructive GPS column or table removal',
    !/\bdrop\s+(column|table)\b/i.test(migration),
  ],
  [
    'future metric payload merges on top of legacy canonical values',
    migration.includes(") || coalesce(row_data.metric_values, '{}'::jsonb)") &&
      migration.includes('metric_values jsonb'),
  ],
  [
    'raw source_values remains persisted independently',
    migration.includes("coalesce(row_data.source_values, '{}'::jsonb)") &&
      migration.includes('source_values jsonb'),
  ],
  [
    'minutes remain contextual and outside metric_values',
    migration.includes('row_data.minutes_played') &&
      !migration.includes("'minutesPlayed', row_data.minutes_played"),
  ],
  [
    'replace RPC preserves the existing public signature',
    rpcSignature.every((part) => migration.includes(part)) &&
      migration.includes(
        'uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb'
      ),
  ],
  [
    'replace RPC remains SECURITY INVOKER',
    migration.includes('security invoker') &&
      !migration.includes('security definer'),
  ],
  [
    'replace RPC still validates canonical team match ownership',
    migration.includes('public.current_user_can_edit_team(p_team_id)') &&
      migration.includes("e.event_type = 'match'") &&
      migration.includes('e.team_id = p_team_id'),
  ],
  [
    'replace RPC still validates canonical roster identities',
    migration.includes('left join public.team_players tp') &&
      migration.includes('tp.team_id = p_team_id') &&
      migration.includes('MATCH_GPS_PLAYER_INVALID'),
  ],
  [
    'RPC execute access remains denied to public and anon',
    migration.includes(
      'revoke all on function public.replace_match_gps_import('
    ) &&
      migration.includes(') from public, anon;'),
  ],
  [
    'RPC execute access remains explicitly authenticated-only',
    migration.includes(
      'grant execute on function public.replace_match_gps_import('
    ) &&
      migration.includes(') to authenticated;'),
  ],
  [
    'migration does not weaken GPS RLS',
    !/disable\s+row\s+level\s+security/i.test(migration) &&
      foundation.includes(
        'alter table public.match_gps_player_metrics enable row level security'
      ),
  ],
]

let passed = 0

for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}

console.log(`\nR32.0A GPS Extensible Metric Storage: ${passed}/${checks.length}`)

if (passed !== checks.length) process.exit(1)