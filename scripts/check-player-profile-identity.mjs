import fs from 'node:fs'

const service = fs.readFileSync('src/modules/roster/playerProfileService.js', 'utf8')
const repository = fs.readFileSync('src/infrastructure/repositories/playerProfileRepository.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const gateway = fs.readFileSync('src/app/appDataGateway.js', 'utf8')
const sql = fs.readFileSync('supabase/20260808_player_profile_identity_r13.sql', 'utf8')

const checks = [
  ['player_profiles has canonical player_id FK', sql.includes('player_profiles_player_id_fkey') && sql.includes('references public.team_players(id)')],
  ['one canonical profile per persistent player', sql.includes('player_profiles_player_id_key unique (player_id)')],
  ['R9 UUID-in-player_key rows are backfilled', sql.includes('pp.player_key = tp.id::text')],
  ['ambiguous legacy keys are not blindly linked', sql.includes('having count(*) = 1')],
  ['persistent save conflicts on player_id', repository.includes("onConflict: 'player_id'")],
  ['player_key no longer drives persistent save', (() => {
    const persistentSection = repository.split('export async function upsertLegacyPlayerProfile')[0]
    return !persistentSection.includes("onConflict: 'player_key'")
  })()],
  ['profile map prefers player_id', service.includes('profile.player_id') && service.includes('map[String(profile.player_id)]')],
  ['profile reads are scoped through team_players.team_id', repository.includes("team_players!inner(team_id)") && repository.includes(".eq('team_players.team_id', teamId)")],
  ['controller loads profiles for active team', controller.includes('loadPlayerProfileMap(getTeamProfile().id || null)')],
  ['controller saves through player profile service', controller.includes('savePlayerProfile(player, payload)')],
  ['old direct player_key upsert removed from controller', !controller.includes(".upsert(payload, { onConflict: 'player_key' })")],
  ['profile loading removed from generic app gateway', !gateway.includes('loadPlayerProfileMap')],
  ['legacy pre-migration fallback remains explicit', service.includes('upsertLegacyPlayerProfile')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nPlayer Profile Identity: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
