import fs from 'node:fs'
import path from 'node:path'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const pkg = JSON.parse(read('package.json'))
const configPath = path.join(root, 'jsconfig.type-safety.json')
const config = JSON.parse(read('jsconfig.type-safety.json'))

const typedFiles = [
  'src/modules/roster/rosterDomain.js',
  'src/modules/calendar/seasonCalendarImportModel.js',
  'src/modules/match/matchModel.js',
  'src/modules/training/trainingSheetModel.js',
]

const checks = []
const expect = (label, condition) => checks.push({ label, ok: Boolean(condition) })

expect('TypeScript dichiarato come devDependency', Boolean(pkg.devDependencies?.typescript))
expect('config checkJs dedicata presente', fs.existsSync(configPath))
expect('checkJs attivo', config.compilerOptions?.checkJs === true)
expect('strict attivo nel perimetro tipizzato', config.compilerOptions?.strict === true)
expect('typecheck non emette file', config.compilerOptions?.noEmit === true)
expect('perimetro iniziale limitato a quattro nuclei critici', typedFiles.every((file) => config.include?.includes(file)) && config.include?.length === typedFiles.length)
expect('script typecheck:domain presente', pkg.scripts?.['typecheck:domain'] === 'tsc -p jsconfig.type-safety.json')
expect('typecheck entra nella release gate', releaseGateIncludes(pkg, 'typecheck:domain'))
expect('foundation check entra nella release gate', releaseGateIncludes(pkg, 'check:type-safety-foundation'))
expect('Rosa dichiara contratto TeamIdentity', read(typedFiles[0]).includes('@typedef {Object} TeamIdentityContract'))
expect('Calendar import dichiara contratti riga/evento', read(typedFiles[1]).includes('@typedef {Object} SeasonImportRow') && read(typedFiles[1]).includes('@typedef {Object} CalendarMatchEvent'))
expect('Match dichiara input e validation issue', read(typedFiles[2]).includes('@typedef {Record<string, any>} MatchDocumentInput') && read(typedFiles[2]).includes('ValidationIssue'))
expect('Training dichiara status e input', read(typedFiles[3]).includes("@typedef {'draft'|'published'} TrainingSheetStatus") && read(typedFiles[3]).includes('TrainingSheetInput'))
expect('nessuna conversione TypeScript runtime introdotta', !config.include.some((file) => file.endsWith('.ts')))

let passed = 0
for (const check of checks) {
  if (check.ok) {
    passed += 1
    console.log(`✓ ${check.label}`)
  } else {
    console.error(`✗ ${check.label}`)
  }
}

console.log(`\n0.26.3 Type Safety Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
