import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))
const failures = []
const checks = []
const check = (label, ok, detail = '') => {
  checks.push({ label, ok, detail })
  if (!ok) failures.push(label)
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
}

const manifestPath = 'security/rls-audit-manifest.json'
check('security manifest exists', exists(manifestPath))
const manifest = JSON.parse(read(manifestPath))
const registeredTables = new Set(Object.keys(manifest.browserDataApiTables || {}))

const srcFiles = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(rel)
    else if (/\.(js|mjs|ts)$/.test(entry.name)) srcFiles.push(rel)
  }
}
walk('src')

const usedTables = new Set()
for (const file of srcFiles) {
  const text = read(file)
  for (const match of text.matchAll(/\.from\(\s*['"]([A-Za-z0-9_]+)['"]\s*\)/g)) usedTables.add(match[1])
}
const missingRegistry = [...usedTables].filter((t) => !registeredTables.has(t)).sort()
const staleRegistry = [...registeredTables].filter((t) => !usedTables.has(t)).sort()
check('every browser Data API table is registered', missingRegistry.length === 0, missingRegistry.join(', '))
check('security registry has no stale browser tables', staleRegistry.length === 0, staleRegistry.join(', '))

const sqlFiles = fs.readdirSync(path.join(root, 'supabase')).filter((f) => f.endsWith('.sql') && !f.includes('AUDIT_READONLY'))
for (const sqlFile of sqlFiles) {
  const sql = read(`supabase/${sqlFile}`)
  for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)/gi)) {
    const table = match[1]
    const rlsPattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i')
    check(`migration-created table ${table} enables RLS`, rlsPattern.test(sql), sqlFile)
  }
}

const hardening = read('supabase/20260812_analysis_templates_rls_hardening_r1.sql')
check('analysis template UPDATE rechecks team membership', /for\s+update[\s\S]*team_members[\s\S]*team_id\s*=\s*analysis_templates\.team_id/i.test(hardening))
check('analysis template UPDATE WITH CHECK rechecks team access', /with\s+check\s*\([\s\S]*team_members[\s\S]*teams/i.test(hardening))
check('analysis template DELETE rechecks team membership', /for\s+delete[\s\S]*team_members[\s\S]*team_id\s*=\s*analysis_templates\.team_id/i.test(hardening))

const browserText = srcFiles.map(read).join('\n')
check('service-role key is never referenced by browser source', !/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(browserText))
const env = exists('.env') ? read('.env') : ''
check('.env contains no service-role secret', !/SERVICE_ROLE|service_role/i.test(env))

const edge = read('supabase/functions/create-staff-user/index.ts')
check('privileged Edge Function validates caller JWT', /callerClient\.auth\.getUser\(\)/.test(edge))
check('privileged Edge Function resolves team access before admin action', /resolveTeamAccess\(adminClient, caller\.id, payload\.teamId\)/.test(edge))
check('service-role use stays server-side in Edge Function', /SUPABASE_SERVICE_ROLE_KEY/.test(edge) && /adminClient/.test(edge))

check('read-only live RLS audit SQL exists', exists('supabase/SECURITY_RLS_AUDIT_READONLY.sql'))

const unresolved = Object.entries(manifest.browserDataApiTables || {})
  .filter(([, value]) => value.repoRlsEvidence === 'runtime-db-verification-required')
  .map(([name]) => name)
check('legacy tables requiring live DB verification are explicitly tracked', unresolved.length > 0, unresolved.join(', '))

console.log(`\nSecurity / RLS Audit Foundation: ${checks.length - failures.length}/${checks.length}`)
if (failures.length) process.exit(1)
