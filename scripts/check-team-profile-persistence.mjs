import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/services/teamProfile.js', import.meta.url), 'utf8')

function extractFunction(name) {
  const start = source.indexOf(`export async function ${name}`)
  if (start < 0) return ''
  return source.slice(start)
}

const save = extractFunction('saveTeamProfile')

const checks = [
  ['saveTeamProfile exists', Boolean(save)],
  ['connected save does not pre-write local cache', (() => {
    const backendGuard = save.indexOf('if (!supabase || !user?.id)')
    const ensure = save.indexOf('const teamId = await ensureTeam')
    const early = save.slice(0, ensure)
    const connectedPath = early.slice(backendGuard)
    return backendGuard >= 0 && ensure > backendGuard &&
      connectedPath.includes('cachedProfile = next') &&
      connectedPath.includes('writeLocal(cachedProfile') &&
      early.indexOf('writeLocal(next') < 0
  })()],
  ['remote UPDATE is awaited before canonical cache commit', (() => {
    const update = save.indexOf(".from('teams')")
    const commit = save.lastIndexOf('cachedProfile = normalize(data)')
    return update >= 0 && commit > update
  })()],
  ['failed remote write throws before cache commit', (() => {
    const errorGuard = save.indexOf('if (error) throw error')
    const commit = save.lastIndexOf('cachedProfile = normalize(data)')
    return errorGuard >= 0 && commit > errorGuard
  })()],
  ['canonical cache uses Supabase response, not optimistic input',
    save.includes('cachedProfile = normalize(data)') && !save.includes('cachedProfile = next\n  if (')],
  ['logo upload uses immutable/versioned object path',
    source.includes('/logos/${Date.now()}-${crypto.randomUUID()}')],
  ['logo upload does not overwrite currently referenced asset',
    source.includes('upsert: false')],
  ['architecture documents Supabase-authoritative Team Profile writes',
    fs.readFileSync(new URL('../docs/STAFF_ARCHITECTURE.md', import.meta.url), 'utf8')
      .includes('Supabase-confirmed Team Profile writes are authoritative')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) {
    passed += 1
    console.log(`PASS ${label}`)
  } else {
    console.error(`FAIL ${label}`)
  }
}

console.log(`Team Profile Persistence ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
