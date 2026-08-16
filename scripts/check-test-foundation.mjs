import fs from 'node:fs'
import path from 'node:path'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const pkg = JSON.parse(read('package.json'))
const config = read('vitest.config.js')
const expectedTests = [
  'tests/domain/rosterDomain.test.js',
  'tests/domain/seasonCalendarImportModel.test.js',
  'tests/domain/matchModel.test.js',
  'tests/domain/matchWorkflowModel.test.js',
  'tests/domain/trainingAnalyticsModel.test.js',
  'tests/domain/matchAnalysisSchema.test.js',
  'tests/domain/trainingSheetParser.test.js',
]

const checks = [
  ['Vitest dichiarato come devDependency', Boolean(pkg.devDependencies?.vitest)],
  ['script test:domain presente', pkg.scripts?.['test:domain'] === 'vitest run --config vitest.config.js'],
  ['script test:domain:watch presente', pkg.scripts?.['test:domain:watch'] === 'vitest --config vitest.config.js'],
  ['test di dominio incluso nella release gate', releaseGateIncludes(pkg, 'test:domain')],
  ['config Vitest usa ambiente Node', config.includes("environment: 'node'")],
  ['config limita la suite ai test di dominio', config.includes("tests/domain/**/*.test.js")],
  ['primo set di test di dominio completo', expectedTests.every((file) => fs.existsSync(path.join(root, file)))],
  ['Match coperto con test comportamentali reali', read('tests/domain/matchModel.test.js').includes("from '../../src/modules/match/matchModel.js'")],
  ['Training analytics coperta con test comportamentali reali', read('tests/domain/trainingAnalyticsModel.test.js').includes("from '../../src/modules/training/trainingAnalyticsModel.js'")],
  ['Calendar import coperto con test comportamentali reali', read('tests/domain/seasonCalendarImportModel.test.js').includes("from '../../src/modules/calendar/seasonCalendarImportModel.js'")],
  ['Match Analysis Schema coperto con test comportamentali reali', read('tests/domain/matchAnalysisSchema.test.js').includes("from '../../src/modules/match/matchAnalysisSchema.js'")],
  ['Training Sheet Parser coperto con test comportamentali reali', read('tests/domain/trainingSheetParser.test.js').includes("from '../../src/services/trainingSheetParser.js'")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}

console.log(`\n0.26.1 Test Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
