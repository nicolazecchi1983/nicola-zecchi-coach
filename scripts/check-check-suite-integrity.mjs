import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const pkg = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'))
const suite = pkg.staffCheckSuite
const failures = []

if (pkg.scripts?.check !== 'node scripts/run-check-suite.mjs') failures.push('scripts.check must use the sequential Node runner')
if (!Array.isArray(suite) || suite.length < 190) failures.push('staffCheckSuite must preserve the complete regression gate')
if (Array.isArray(suite) && new Set(suite).size !== suite.length) failures.push('staffCheckSuite contains duplicate script names')
for (const name of suite || []) {
  if (!pkg.scripts?.[name]) failures.push(`missing npm script referenced by staffCheckSuite: ${name}`)
  if (name === 'check') failures.push(`recursive runner entry is not allowed: ${name}`)
}
for (const required of ['check:check-suite-integrity', 'check:syntax', 'check:architecture', 'typecheck:domain', 'test:domain', 'build', 'check:match-squad-leadership-readability', 'check:match-squad-command-row-isolation']) {
  if (!suite?.includes(required)) failures.push(`required gate missing from staffCheckSuite: ${required}`)
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`))
  process.exit(1)
}
console.log(`CHECK SUITE INTEGRITY: OK (${suite.length} gate, runner sequenziale)`) 
