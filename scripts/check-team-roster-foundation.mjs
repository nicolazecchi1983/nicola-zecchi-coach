import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const app = read('src/app/appController.js')
const rosterService = read('src/modules/roster/rosterService.js')
const rosterView = read('src/modules/roster/rosterView.js')
const rosterRepository = read('src/infrastructure/repositories/rosterRepository.js')
const teamSettings = read('src/modules/settings/teamSettingsView.js')
const opponentStudy = read('src/modules/match/ui/matchOpponentStudyView.js')
const sql = read('supabase/20260808_team_roster_foundation.sql')
const playerIdentitySql = read('supabase/20260808_player_identity_foundation_r9.sql')
const teamProfile = read('src/services/teamProfile.js')

const checks = [
  ['appState roster source', app.includes('appState.players')],
  ['legacy players only fallback', app.includes('players as legacyPlayers') && !/\bplayers\.find\(/.test(app)],
  ['roster repository owns team_players access', rosterRepository.includes(".from('team_players')") && !rosterService.includes(".from('team_players')")],
  ['roster scoped by team', rosterRepository.includes(".eq('team_id', teamId)") || rosterRepository.includes(".eq('team_id', team.id)")],
  ['soft removal preserves history', rosterRepository.includes("active: false")],
  ['roster management actions', rosterView.includes('data-roster-create') && rosterView.includes('data-roster-edit')],
  ['team and roster settings wording', teamSettings.includes('Squadra e Rosa')],
  ['opponent study navigation always visible', (opponentStudy.match(/matchContextNavigationHtml\('opponent-study'\)/g) || []).length >= 2],
  ['database relation team players', sql.includes('references public.teams(id)')],
  ['player identity no longer name-key unique', playerIdentitySql.includes('drop constraint if exists team_players_team_key_unique')],
  ['RLS enabled', sql.includes('enable row level security')],
  ['neutral default team identity', teamProfile.includes("name: 'La tua squadra'") && !teamProfile.includes("name: 'Mezzolara Calcio'")],
  ['training preview uses configured team', app.includes("const team = getTeamProfile()") && app.includes("teamBrand") && !app.includes('<img src="/mezzolara-logo.png" alt="Mezzolara Calcio">')],
]

const failed = checks.filter(([, ok]) => !ok)
checks.forEach(([label, ok]) => console.log(`${ok ? '✓' : '✗'} ${label}`))
if (failed.length) {
  console.error(`Team & Roster Foundation: ${failed.length}/${checks.length} controlli falliti.`)
  process.exit(1)
}
console.log(`Team & Roster Foundation: ${checks.length}/${checks.length} OK`)
