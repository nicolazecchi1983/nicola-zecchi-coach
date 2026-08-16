import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const failures = []
const checks = []
const check = (label, ok) => {
  checks.push({ label, ok })
  if (!ok) failures.push(label)
  console.log(`${ok ? '✓' : '✗'} ${label}`)
}

const migration = read('supabase/20260812_security_rls_hardening_r2.sql')
const profileRepo = read('src/infrastructure/repositories/profileRepository.js')
const staffService = read('src/modules/staff/staffService.js')
const playerProfileRepo = read('src/infrastructure/repositories/playerProfileRepository.js')
const matchAnalysis = read('src/modules/match/events/matchAnalysisEvents.js')

check('analysis_templates UPDATE remains team-scoped', /analysis_templates_update_own[\s\S]*team_members[\s\S]*with\s+check/i.test(migration))
check('analysis_templates DELETE remains team-scoped', /analysis_templates_delete_own[\s\S]*team_members/i.test(migration))
check('match_analysis gains canonical team_id FK', /alter\s+table\s+public\.match_analysis[\s\S]*add\s+column\s+if\s+not\s+exists\s+team_id\s+uuid\s+references\s+public\.teams/i.test(migration))
check('match_analysis INSERTs get a fail-closed team resolver', /staff_match_analysis_set_team[\s\S]*current_user_single_team_id/i.test(migration))
check('match_analysis broad read policy is removed', /drop\s+policy\s+if\s+exists\s+"Staff can read match analysis"/i.test(migration))
check('match_analysis SELECT is team-scoped', /create\s+policy\s+match_analysis_select_team[\s\S]*current_user_is_team_member\(team_id\)[\s\S]*current_user_is_team_owner\(team_id\)/i.test(migration))
check('match_analysis writes require team edit access', /match_analysis_insert_team[\s\S]*current_user_can_edit_team\(team_id\)/i.test(migration))
check('player_profiles broad read/manage policies are removed', /drop\s+policy[\s\S]*Authenticated staff can read player profiles[\s\S]*Administrators can manage player profiles/i.test(migration))
check('player_profiles scopes through player_id -> team_players.team_id', /player_profiles_select_team[\s\S]*tp\.id\s*=\s*player_profiles\.player_id[\s\S]*tp\.team_id/i.test(migration))
check('profiles global authenticated read is removed', /drop\s+policy\s+if\s+exists\s+profiles_read_authenticated/i.test(migration))
check('profiles reads are self or same-team only', /profiles_team_read[\s\S]*id\s*=\s*auth\.uid\(\)[\s\S]*current_user_shares_team_with_user\(id\)/i.test(migration))
check('hard-coded profile owner bypass is removed', /drop\s+policy\s+if\s+exists\s+profiles_owner_update_all/i.test(migration))
check('global owner profile update policy is removed', /drop\s+policy\s+if\s+exists\s+"Owner can update profiles"/i.test(migration))
check('self-service profile escalation is guarded', /staff_profiles_self_update_guard[\s\S]*new\.role[\s\S]*new\.app_role[\s\S]*new\.active/i.test(migration))
check('browser profile self-update uses RPC, not direct table UPDATE', /rpc\('update_my_profile'/.test(profileRepo))
check('staff profile administration uses canonical RPC', /rpc\('admin_update_staff_profile'/.test(staffService))
check('player profile persistence uses canonical player_id', /player_id:\s*playerId/.test(playerProfileRepo))
check('match analysis browser INSERT remains compatible with trigger assignment', /supabase\.from\('match_analysis'\)\.insert\(records\)/.test(matchAnalysis))
check('post-hardening live verifier exists', fs.existsSync(path.join(root, 'supabase/SECURITY_RLS_VERIFY_R1_READONLY.sql')))

console.log(`\nSecurity / RLS Hardening R1: ${checks.length - failures.length}/${checks.length}`)
if (failures.length) process.exit(1)
