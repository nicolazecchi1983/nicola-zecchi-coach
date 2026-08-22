import fs from 'node:fs'
import path from 'node:path'

const distIndex = path.resolve('dist/index.html')
const assetsDir = path.resolve('dist/assets')

function fail(message) {
  console.error(`FAIL ${message}`)
  process.exit(1)
}

if (!fs.existsSync(distIndex)) fail('production dist/index.html is missing; run build first')
if (!fs.existsSync(assetsDir)) fail('production dist/assets is missing; run build first')

const html = fs.readFileSync(distIndex, 'utf8')
const entryMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i)
  || html.match(/<script[^>]+src=["']([^"']+\.js)["'][^>]+type=["']module["']/i)
if (!entryMatch) fail('production entry chunk is not referenced by dist/index.html')

const entryFile = path.basename(entryMatch[1])
const jsFiles = fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js'))
if (jsFiles.length < 4) fail(`expected multiple JS chunks, found only ${jsFiles.length}`)
if (!jsFiles.includes(entryFile)) fail(`entry chunk ${entryFile} is missing from dist/assets`)

const entrySource = fs.readFileSync(path.join(assetsDir, entryFile), 'utf8')
const lazySources = jsFiles
  .filter((name) => name !== entryFile)
  .map((name) => fs.readFileSync(path.join(assetsDir, name), 'utf8'))
  .join('\n')

const signatures = [
  ['Training Editor', 'Pubblica in STAFF, Calendario e Training Library. Il PDF resta disponibile da Anteprima e dal menu.'],
  ['Training Draft/Voice', 'Dettatura non supportata da questo browser'],
  ['Legacy Match Editor', 'Cancellare la Match Sheet?'],
]

for (const [label, signature] of signatures) {
  if (entrySource.includes(signature)) fail(`${label} signature is still inside the initial entry chunk`)
  if (!lazySources.includes(signature)) fail(`${label} signature is missing from lazy chunks`)
  console.log(`PASS ${label} is outside the initial entry chunk`)
}

console.log(`PASS production build emits ${jsFiles.length} JavaScript chunks`)
console.log(`PASS entry chunk resolved as ${entryFile}`)
console.log('\nR2.1D Feature Code Splitting Build: OK')
