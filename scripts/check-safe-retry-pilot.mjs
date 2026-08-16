import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

const helperFile = 'src/infrastructure/dataAccess/withDataAccessRetry.js'
const appGatewayFile = 'src/app/appDataGateway.js'
const rosterRepoFile = 'src/infrastructure/repositories/rosterRepository.js'
const testFile = 'tests/domain/dataAccessRetry.test.js'
const pkg = JSON.parse(read('package.json'))

const helper = exists(helperFile)
  ? await import(pathToFileURL(path.join(root, helperFile)).href)
  : {}
const policy = await import(pathToFileURL(path.join(root, 'src/infrastructure/dataAccess/dataOperationPolicy.js')).href)

let calls = 0
const delays = []
const smokeResult = typeof helper.withDataAccessRetry === 'function'
  ? await helper.withDataAccessRetry(async () => {
      calls += 1
      if (calls < 3) return { data: null, error: { status: 503, message: 'service unavailable' } }
      return { data: 'ok', error: null }
    }, {
      kind: policy.DATA_OPERATION_KIND.READ,
      sleepFn: async (ms) => { delays.push(ms) },
    })
  : null

const appGateway = read(appGatewayFile)
const rosterRepo = read(rosterRepoFile)
const helperSource = exists(helperFile) ? read(helperFile) : ''

const checks = [
  ['Retry helper presente', exists(helperFile)],
  ['Test Vitest retry presente', exists(testFile)],
  ['Helper esporta withDataAccessRetry', typeof helper.withDataAccessRetry === 'function'],
  ['Smoke READ riesce al terzo tentativo', smokeResult?.data === 'ok' && calls === 3],
  ['Backoff pilot 250ms -> 500ms', JSON.stringify(delays) === JSON.stringify([250, 500])],
  ['Access profile usa retry READ', /withDataAccessRetry\([\s\S]*stage:\s*'access-profile'/.test(appGateway)],
  ['Match analysis list usa retry READ', /withDataAccessRetry\([\s\S]*stage:\s*'match-analysis-list'/.test(appGateway)],
  ['Roster list usa retry READ', /withDataAccessRetry\([\s\S]*stage:\s*'team-roster-list'/.test(rosterRepo)],
  ['CREATE non abilitato dal pilot', !/kind:\s*DATA_OPERATION_KIND\.CREATE/.test(appGateway + rosterRepo)],
  ['DELETE non abilitato dal pilot', !/kind:\s*DATA_OPERATION_KIND\.DELETE/.test(appGateway + rosterRepo)],
  ['Helper delega la sicurezza alla policy', helperSource.includes('canAutomaticallyRetryDataOperation')],
  ['Guard inserito nel release gate', releaseGateIncludes(pkg, 'check:safe-retry-pilot')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.28.4 Safe Retry Pilot: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
