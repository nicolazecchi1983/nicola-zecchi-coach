import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const errorFile = 'src/infrastructure/dataAccess/dataAccessError.js'
const policyFile = 'src/infrastructure/dataAccess/dataOperationPolicy.js'
const errorTestFile = 'tests/domain/dataAccessError.test.js'
const policyTestFile = 'tests/domain/dataOperationPolicy.test.js'
const pkg = JSON.parse(read('package.json'))

const errorModule = exists(errorFile) ? await import(pathToFileURL(path.join(root, errorFile)).href) : {}
const policyModule = exists(policyFile) ? await import(pathToFileURL(path.join(root, policyFile)).href) : {}

const checks = [
  ['Normalizer data-access presente', exists(errorFile)],
  ['Policy operazioni presente', exists(policyFile)],
  ['Test normalizzazione presente', exists(errorTestFile)],
  ['Test policy presente', exists(policyTestFile)],
  ['Espone normalizeDataAccessError', typeof errorModule.normalizeDataAccessError === 'function'],
  ['Espone isRetryableDataAccessError', typeof errorModule.isRetryableDataAccessError === 'function'],
  ['Espone DATA_OPERATION_KIND', Boolean(policyModule.DATA_OPERATION_KIND?.READ)],
  ['READ retry automatico consentito', policyModule.getDataOperationPolicy?.('read')?.automaticRetry === true],
  ['CREATE retry automatico disabilitato', policyModule.getDataOperationPolicy?.('create')?.automaticRetry === false],
  ['DELETE retry automatico disabilitato', policyModule.getDataOperationPolicy?.('delete')?.automaticRetry === false],
  ['Nessun withRetry runtime introdotto nella foundation', !exists('src/infrastructure/dataAccess/withRetry.js')],
  ['Guard inserito nel release gate', releaseGateIncludes(pkg, 'check:data-access-resilience-foundation')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.28.3 Data Access Resilience Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
