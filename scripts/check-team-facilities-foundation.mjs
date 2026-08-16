import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const sql = read('supabase/20260808_team_facilities_foundation_r11.sql')
const service = read('src/modules/team/teamFacilitiesService.js')
const repository = read('src/infrastructure/repositories/teamFacilitiesRepository.js')
const locationModel = read('src/modules/team/teamLocationModel.js')
const settings = read('src/modules/settings/teamSettingsView.js')
const controller = read('src/app/appController.js')
const calendarEventViews = read('src/modules/calendar/ui/calendarEventViewBuilders.js')
const calendarRuntime = read('src/modules/calendar/events/calendarRuntimeActions.js')

const checks = [
  ['persistent team_facilities table', /create table if not exists public\.team_facilities/i.test(sql)],
  ['team_id foreign key', /team_id uuid not null references public\.teams\(id\)/i.test(sql)],
  ['RLS enabled', /alter table public\.team_facilities enable row level security/i.test(sql)],
  ['atomic replace RPC', /replace_team_facilities/i.test(sql) && /security invoker/i.test(sql)],
  ['facility repository scoped by team', /\.eq\('team_id', teamId\)/.test(repository)],
  ['service delegates persistence to repository', /teamFacilitiesRepository/.test(service) && !/supabase\.js/.test(service)],
  ['location model reads facilities not calendar events', /facilities\.map/.test(locationModel) && !/events\.map/.test(locationModel)],
  ['settings manage facilities', /data-team-facilities-list/.test(settings) && /data-add-team-facility/.test(settings)],
  ['training options use teamFacilities', /getTeamLocationOptions\(getFacilities\(\)\)/.test(calendarEventViews)],
  ['calendar non-training location stays free', /Inserisci luogo…/.test(calendarRuntime)],
  ['calendar events not facility source', !/getTeamLocationOptions\(appState\.calendarEvents/.test(controller) && !/getTeamLocationOptions\(appState\.calendarEvents/.test(calendarEventViews)],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
if (failed) {
  console.error(`Team Facilities Foundation: ${checks.length - failed}/${checks.length}`)
  process.exit(1)
}
console.log(`Team Facilities Foundation: ${checks.length}/${checks.length}`)
