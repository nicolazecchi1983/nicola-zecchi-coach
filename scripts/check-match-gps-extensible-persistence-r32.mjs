import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')

const model = read('src/modules/match/matchGpsModel.js')
const service = read('src/modules/match/matchGpsService.js')
const repository = read('src/infrastructure/repositories/matchGpsRepository.js')
const registry = read('src/modules/match/matchGpsMetricRegistry.js')
const migration = read('supabase/migrations/20260916084825_match_gps_extensible_metric_values.sql')

const checks = [
  [
    'R32 GPS payload schema is version 3',
    model.includes('export const MATCH_GPS_SCHEMA_VERSION = 3'),
  ],
  [
    'repository loads canonical metric_values',
    repository.includes('distance_km,metric_values,source_values,created_at'),
  ],
  [
    'repository preserves workbook order independently of optional ordinal',
    repository.includes(".order('source_row', { ascending: true })"),
  ],
  [
    'service derives legacy compatibility from the Metric Registry',
    service.includes("import { MATCH_GPS_METRIC_REGISTRY } from './matchGpsMetricRegistry.js'") &&
      service.includes('definition.legacyColumn'),
  ],
  [
    'service merges legacy metrics with extensible metric_values',
    service.includes('...legacyMetricsFromRow(row)') &&
      service.includes("...normalizeMetricValues(row.metric_values, 'match-gps-load')"),
  ],
  [
    'metric_values wins over legacy values on read',
    service.indexOf('...legacyMetricsFromRow(row)') <
      service.indexOf("...normalizeMetricValues(row.metric_values, 'match-gps-load')"),
  ],
  [
    'service persists canonical metric_values and legacy scalar compatibility',
    service.includes('metric_values: metricValues') &&
      service.includes('payload[definition.legacyColumn] = metricValues[definition.key] ?? null'),
  ],
  [
    'minutes remain contextual outside metric_values',
    service.includes('minutes_played: row.minutesPlayed ?? null') &&
      !service.includes("metricValues.minutesPlayed"),
  ],
  [
    'source_values remains an independent source snapshot',
    service.includes('source_values: row.sourceValues || {}'),
  ],
  [
    'non-numeric extensible values fail closed before RPC persistence',
    service.includes("code: 'MATCH_GPS_METRIC_VALUES_INVALID'") &&
      service.includes("typeof metricValue !== 'number'"),
  ],
  [
    'registry legacyColumn mapping remains optional for future metrics',
    registry.includes('legacyColumn,') &&
      registry.includes('legacyColumn:'),
  ],
  [
    'database migration owns the JSONB metric_values column',
    migration.includes('add column if not exists metric_values jsonb'),
  ],
]

let passed = 0

for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}

console.log(`\nR32.0C GPS Extensible Persistence: ${passed}/${checks.length}`)

if (passed !== checks.length) process.exit(1)