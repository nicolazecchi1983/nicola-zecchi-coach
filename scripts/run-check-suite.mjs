import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'))
const suite = packageJson.staffCheckSuite

function fail(message) {
  console.error(`\nCHECK SUITE: ERROR — ${message}`)
  process.exit(1)
}

if (!Array.isArray(suite) || suite.length === 0) fail('staffCheckSuite mancante o vuota in package.json')
if (new Set(suite).size !== suite.length) fail('staffCheckSuite contiene comandi duplicati')
for (const scriptName of suite) {
  if (typeof scriptName !== 'string' || !scriptName.trim()) fail('staffCheckSuite contiene un nome script non valido')
  if (!packageJson.scripts?.[scriptName]) fail(`script npm mancante: ${scriptName}`)
  if (scriptName === 'check') fail('staffCheckSuite non può contenere il runner check stesso')
}

if (process.argv.includes('--list')) {
  suite.forEach((scriptName, index) => console.log(`${String(index + 1).padStart(3, '0')}/${suite.length} ${scriptName}`))
  process.exit(0)
}

const npmExecPath = process.env.npm_execpath
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const startedAt = Date.now()

console.log(`CHECK SUITE: avvio ${suite.length} gate sequenziali`) 

for (let index = 0; index < suite.length; index += 1) {
  const scriptName = suite[index]
  const label = `[${String(index + 1).padStart(3, '0')}/${suite.length}] ${scriptName}`
  console.log(`\n=== ${label} ===`)

  const command = npmExecPath ? process.execPath : npmCommand
  const args = npmExecPath ? [npmExecPath, 'run', scriptName] : ['run', scriptName]
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  })

  if (result.error) {
    console.error(`\nCHECK SUITE: impossibile avviare ${scriptName}`)
    console.error(result.error)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`\nCHECK SUITE: FALLITA su ${label} (codice ${result.status ?? 1})`)
    process.exit(result.status ?? 1)
  }
}

const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1)
console.log(`\nCHECK SUITE: OK — ${suite.length}/${suite.length} gate superati in ${elapsedSeconds}s`)
