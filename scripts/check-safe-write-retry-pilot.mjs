import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

const rosterFile = 'src/infrastructure/repositories/rosterRepository.js'
const profileFile = 'src/infrastructure/repositories/playerProfileRepository.js'
const retryTestFile = 'tests/domain/dataAccessRetry.test.js'
const pkg = JSON.parse(read('package.json'))
const policy = await import(pathToFileURL(path.join(root, 'src/infrastructure/dataAccess/dataOperationPolicy.js')).href)

const roster = read(rosterFile)
const profile = read(profileFile)
const tests = read(retryTestFile)

const idempotentStages = [
  'player-profile-upsert-persistent',
  'player-profile-upsert-legacy',
  'team-roster-update-player',
  'team-roster-deactivate-player',
]

const source = `${roster}\n${profile}`
const checks = [
  ['Policy espone IDEMPOTENT_WRITE', policy.DATA_OPERATION_KIND.IDEMPOTENT_WRITE === 'idempotent-write'],
  ['Persistent player profile usa retry idempotente', /IDEMPOTENT_WRITE[\s\S]*player-profile-upsert-persistent|player-profile-upsert-persistent[\s\S]*IDEMPOTENT_WRITE/.test(profile)],
  ['Legacy player profile usa retry idempotente', /IDEMPOTENT_WRITE[\s\S]*player-profile-upsert-legacy|player-profile-upsert-legacy[\s\S]*IDEMPOTENT_WRITE/.test(profile)],
  ['Roster update usa retry idempotente', /IDEMPOTENT_WRITE[\s\S]*team-roster-update-player|team-roster-update-player[\s\S]*IDEMPOTENT_WRITE/.test(roster)],
  ['Roster deactivate usa retry idempotente', /IDEMPOTENT_WRITE[\s\S]*team-roster-deactivate-player|team-roster-deactivate-player[\s\S]*IDEMPOTENT_WRITE/.test(roster)],
  ['Tutti gli stage pilot presenti', idempotentStages.every((stage) => source.includes(stage))],
  ['CREATE non abilitato nei repository pilot', !/DATA_OPERATION_KIND\.CREATE/.test(source)],
  ['DELETE non abilitato nei repository pilot', !/DATA_OPERATION_KIND\.DELETE/.test(source)],
  ['BATCH non abilitato nei repository pilot', !/DATA_OPERATION_KIND\.BATCH/.test(source)],
  ['Test Vitest copre IDEMPOTENT_WRITE', tests.includes("describe('IDEMPOTENT_WRITE retry policy'")],
  ['Test Vitest protegge DELETE/BATCH', tests.includes('DATA_OPERATION_KIND.DELETE') && tests.includes('DATA_OPERATION_KIND.BATCH')],
  ['Guard inserito nel release gate', releaseGateIncludes(pkg, 'check:safe-write-retry-pilot')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.28.5 Safe Write Retry Pilot: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
