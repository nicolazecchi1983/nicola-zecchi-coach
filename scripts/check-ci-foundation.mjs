import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const packagePath = path.join(root, 'package.json')
const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml')

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')
const checks = []

function expect(label, condition) {
  checks.push({ label, ok: Boolean(condition) })
}

expect('workflow CI presente', fs.existsSync(workflowPath))
expect('CI scatta sui push', /^\s*push:\s*$/m.test(workflow))
expect('CI scatta sulle pull request', /^\s*pull_request:\s*$/m.test(workflow))
expect('permessi repository read-only', /permissions:\s*\n\s+contents:\s*read/m.test(workflow))
expect('checkout usa action ufficiale corrente', /uses:\s*actions\/checkout@v6/.test(workflow))
expect('checkout non persiste credenziali', /persist-credentials:\s*false/.test(workflow))
expect('setup-node usa action ufficiale corrente', /uses:\s*actions\/setup-node@v7/.test(workflow))
expect('CI usa Node 22', /node-version:\s*['"]22\.x['"]/.test(workflow))
expect('cache npm usa package-lock', /cache:\s*npm/.test(workflow) && /cache-dependency-path:\s*package-lock\.json/.test(workflow))
expect('install deterministico con npm ci', /run:\s*npm ci/.test(workflow))
expect('package espone script ci', packageJson.scripts?.ci === 'npm run check')
expect('workflow usa release gate canonico', /run:\s*npm run ci/.test(workflow))
expect('release gate include Vitest', releaseGateIncludes(packageJson, 'test:domain'))
expect('release gate include build Vite', releaseGateIncludes(packageJson, 'build'))
expect('CI foundation è inclusa nel check aggregato', releaseGateIncludes(packageJson, 'check:ci-foundation'))

let passed = 0
for (const check of checks) {
  if (check.ok) {
    passed += 1
    console.log(`✓ ${check.label}`)
  } else {
    console.error(`✗ ${check.label}`)
  }
}

console.log(`\n0.26.2 CI Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
