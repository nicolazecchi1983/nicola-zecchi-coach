import fs from 'node:fs'
import packageJson from '../package.json' with { type: 'json' }
import { MATCH_POST_UTILITIES, MATCH_WORKFLOW_SECTIONS } from '../src/modules/match/matchWorkflowModel.js'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')
const controller = read('src/app/appController.js')
const model = read('src/modules/match/matchGpsModel.js')
const workbook = read('src/modules/match/matchGpsWorkbook.js')
const service = read('src/modules/match/matchGpsService.js')
const repository = read('src/infrastructure/repositories/matchGpsRepository.js')
const architecture = read('scripts/validate-architecture.mjs')
const view = read('src/modules/match/ui/matchGpsView.js')
const events = read('src/modules/match/events/matchGpsEvents.js')
const access = read('src/core/accessControl.js')
const session = read('src/app/appSessionRestore.js')
const main = read('src/main.js')
const migration = read('supabase/migrations/20260915073404_match_gps_foundation.sql')
const securityManifest = JSON.parse(read('security/rls-audit-manifest.json'))

const checks = [
  ['GPS remains a POST utility, not an eighth workflow section', MATCH_WORKFLOW_SECTIONS.length === 7 && MATCH_POST_UTILITIES.map(({ key }) => key).join('|') === 'statistics|gps'],
  ['Excel parser is lazy and accepts only xlsx', workbook.includes("return import('xlsx')") && workbook.includes('/\\.xlsx$/i')],
  ['SheetJS is pinned to the official distribution', packageJson.dependencies?.xlsx === 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz'],
  ['Parser preserves source values and excludes resting-only rows', model.includes('sourceValues: sourceValueMap') && model.includes('getMatchGpsMetrics({ activitySignal: true })')],
  ['Player mapping uses canonical roster IDs', model.includes('playerId: String(compatible[0].id)') && model.includes('lo stesso giocatore è associato a più righe')],
  ['Persistence uses the atomic replace RPC', repository.includes("rpc('replace_match_gps_import'") && service.includes('p_rows: rows.map(persistenceRow)')],
  ['Supabase access stays inside the approved repository boundary', architecture.includes("'src/infrastructure/repositories/matchGpsRepository.js'")],
  ['Workspace uses module-local state and registered lifecycle prepare', controller.includes('createMatchGpsWorkspace') && controller.includes("'match-gps': async () =>")],
  ['Dedicated binder owns GPS interactions', controller.includes('wireMatchGpsEvents') && events.includes('data-match-gps-player-map')],
  ['GPS has separate read and import capabilities', access.includes("MATCH_GPS_VIEW: 'matchGps.view'") && access.includes("MATCH_GPS_IMPORT: 'matchGps.import'")],
  ['Session restore recognizes GPS match context', session.includes("'match-gps'") && session.includes("'match-gps': 'GPS partita'")],
  ['GPS view is responsive and loaded before canonical responsive CSS', view.includes('data-match-gps-workspace') && main.indexOf('matchGps.css') < main.indexOf('responsive.css')],
  ['Migration binds imports to canonical match event and player IDs', migration.includes('foreign key (event_id, team_id, event_type)') && migration.includes('foreign key (player_id, team_id)')],
  ['Migration enables RLS and explicit authenticated grants', (migration.match(/enable row level security/g) || []).length === 2 && migration.includes('grant select, insert, update, delete on public.match_gps_imports to authenticated')],
  ['Both browser tables are registered in the security manifest', ['match_gps_imports', 'match_gps_player_metrics'].every((table) => securityManifest.browserDataApiTables?.[table]?.migration?.includes('match_gps_foundation.sql'))],
  ['Atomic RPC is invoker-scoped and replaces rows transactionally', migration.includes('security invoker') && migration.includes('delete from public.match_gps_player_metrics') && migration.includes('jsonb_to_recordset')],
  ['Atomic RPC execute privilege is restricted to authenticated', migration.includes('revoke all on function public.replace_match_gps_import(uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb) from public, anon') && migration.includes('grant execute on function public.replace_match_gps_import(uuid, uuid, integer, text, text, integer, jsonb, integer, jsonb) to authenticated')],
]

let passed = 0
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (ok) passed += 1 }
console.log(`\nMatch GPS Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
