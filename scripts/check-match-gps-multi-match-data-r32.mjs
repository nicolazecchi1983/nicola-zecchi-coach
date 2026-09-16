import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')

const repository = read('src/infrastructure/repositories/matchGpsRepository.js')
const service = read('src/modules/match/matchGpsService.js')
const analysisService = read('src/modules/match/matchGpsAnalysisService.js')
const analysisModel = read('src/modules/match/matchGpsAnalysisModel.js')
const registry = read('src/modules/match/matchGpsMetricRegistry.js')

const checks = [
  [
    'history repository is a team-scoped READ owner',
    repository.includes('export async function loadMatchGpsHistoryRows(teamId)') &&
      repository.includes(".from('match_gps_imports')") &&
      repository.includes(".eq('team_id', teamId)"),
  ],
  [
    'history repository batch-loads player metrics rather than N+1 event imports',
    repository.includes(".in('import_id', importIds)") &&
      repository.includes('metricsByImport'),
  ],
  [
    'history repository reads canonical match event chronology',
    repository.includes(".from('events')") &&
      repository.includes("'id,team_id,event_type,title,start_at,location,notes'") &&
      repository.includes(".eq('event_type', 'match')") &&
      repository.includes(".in('id', eventIds)"),
  ],
  [
    'history repository preserves canonical metric_values',
    repository.includes('metric_values,source_values,created_at'),
  ],
  [
    'single-match normalization is reused instead of duplicated',
    service.includes('export function normalizeMatchGpsMetricRow') &&
      service.includes('export function normalizeMatchGpsImportRow') &&
      analysisService.includes("import { normalizeMatchGpsImportRow } from './matchGpsService.js'"),
  ],
  [
    'analysis service has read-only public API',
    analysisService.includes('async loadHistory') &&
      !analysisService.includes('.replace(') &&
      !analysisService.includes('.save(') &&
      !analysisService.includes('.rpc('),
  ],
  [
    'history is ordered by event start time, not import time',
    analysisModel.includes('left.startAt.localeCompare(right.startAt)') &&
      !analysisModel.includes('left.importedAt.localeCompare'),
  ],
  [
    'null and zero remain distinct in numeric normalization',
    analysisModel.includes("if (value == null || String(value).trim() === '') return null") &&
      analysisModel.includes('Number.isFinite(numeric) ? numeric : null'),
  ],
  [
    '/90 requires positive minutes',
    analysisModel.includes('minutes <= 0') &&
      analysisModel.includes('(numeric / minutes) * 90'),
  ],
  [
    '/90 eligibility is Metric Registry owned',
    analysisModel.includes('getMatchGpsMetric(metricKey)') &&
      analysisModel.includes('if (!definition.per90) return null') &&
      registry.includes('per90: true'),
  ],
  [
    'squad series exposes player-count and minute context',
    analysisModel.includes('playerCount: match.rows.length') &&
      analysisModel.includes('totalMinutes: minutesCount ? totalMinutes : null'),
  ],
  [
    'player longitudinal series preserves missing-match gaps',
    analysisModel.includes('rowPresent: Boolean(row)') &&
      analysisModel.includes('actualValue: row') &&
      analysisModel.includes(': null'),
  ],
  [
    'R32.1 introduces no new database migration',
    !fs.readdirSync('supabase/migrations').some((name) => name.includes('multi_match_gps')),
  ],
]

let passed = 0

for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}

console.log(`\nR32.1 GPS Multi-Match Data: ${passed}/${checks.length}`)

if (passed !== checks.length) process.exit(1)