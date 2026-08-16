import assert from 'node:assert/strict'
import fs from 'node:fs'

const repository = fs.readFileSync('src/infrastructure/repositories/rosterRepository.js', 'utf8')
const service = fs.readFileSync('src/modules/roster/rosterService.js', 'utf8')
const view = fs.readFileSync('src/modules/roster/rosterView.js', 'utf8')
const app = fs.readFileSync('src/app/appController.js', 'utf8')
const teamEvents = fs.readFileSync('src/modules/team/events/teamRosterEvents.js', 'utf8')
const playerProfileEvents = fs.readFileSync('src/modules/roster/events/playerProfileEvents.js', 'utf8')
const sql = fs.readFileSync('supabase/20260808_player_identity_foundation_r9.sql', 'utf8')

const checks = [
  ['new roster player uses INSERT, not name-key UPSERT', repository.includes(".insert(payload)") && !repository.includes("onConflict: 'team_id,player_key'")],
  ['persistent identity prefers UUID', service.includes("return String(player?.id || rosterPlayerKey(player))")],
  ['roster UI receives identity function', view.includes('playerIdentity(player)') && !view.includes('playerKey(player)')],
  ['edit lookup uses UUID-aware identity', teamEvents.includes('rosterPlayerIdentity(item) === button.dataset.rosterEdit')],
  ['profile lookup uses UUID-aware identity', playerProfileEvents.includes('rosterPlayerIdentity(item) === button.dataset.playerProfile')],
  ['legacy profile read remains compatible', app.includes('appState.playerProfiles[identity] || appState.playerProfiles[legacyKey]') || playerProfileEvents.includes('appState.playerProfiles[legacyProfileKey] = saved')],
  ['database removes name-key uniqueness', sql.includes('drop constraint if exists team_players_team_key_unique')],
  ['database retains non-unique legacy lookup index', sql.includes('team_players_team_player_key_idx')],
]

for (const [label, ok] of checks) {
  assert.equal(ok, true, label)
  console.log(`✓ ${label}`)
}
console.log(`Player Identity Foundation: ${checks.length}/${checks.length} OK`)
