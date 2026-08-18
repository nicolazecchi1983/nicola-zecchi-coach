import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const srcRoot = resolve(projectRoot, 'src')

const canonicalOwners = new Set([
  'src/design-system/training-editor.css',
])

// Transitional owners are frozen at the current audited baseline.
// R1.1A does NOT move visual rules. It only prevents ownership from spreading.
const transitionalCaps = new Map([
])

function fail(message) {
  console.error(`\nTraining Sheet CSS Ownership: ERROR — ${message}`)
  process.exit(1)
}

function walk(dir) {
  const result = []
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) result.push(...walk(full))
    else if (stat.isFile() && full.endsWith('.css')) result.push(full)
  }
  return result
}

function toProjectPath(file) {
  return relative(projectRoot, file).split(sep).join('/')
}

function matchingLines(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => /\.ts-paper(?:[-_A-Za-z0-9]|[\s.:>#,[{])/.test(line))
}

const retiredBridgePath = resolve(projectRoot, 'src/design-system/training-sheet-match-compat.css')
if (existsSync(retiredBridgePath)) {
  fail('retired Training Sheet Match compatibility bridge must not be reintroduced after R1.1E')
}

const matchLegacyPath = resolve(projectRoot, 'src/modules/match/ui/matchSheet.css')
const matchLegacyText = readFileSync(matchLegacyPath, 'utf8')
if (/\.ts-paper(?:[-_A-Za-z0-9]|[\s.:>#,[{])/.test(matchLegacyText) || matchLegacyText.includes('.ts-capture-root')) {
  fail('Match CSS must not own Training Sheet paper/capture selectors after R1.1B')
}

const cssFiles = walk(srcRoot)
const owners = []

for (const file of cssFiles) {
  const projectPath = toProjectPath(file)
  const text = readFileSync(file, 'utf8')
  const matches = matchingLines(text)
  if (matches.length === 0) continue

  owners.push({ projectPath, matches })

  if (canonicalOwners.has(projectPath)) continue

  if (transitionalCaps.has(projectPath)) {
    const cap = transitionalCaps.get(projectPath)
    if (matches.length > cap) {
      fail(
        `${projectPath} possiede ${matches.length} righe ts-paper; baseline congelata: ${cap}. ` +
        'R1.1A vieta nuova ownership fuori dal canonical owner.'
      )
    }
    continue
  }

  const preview = matches
    .slice(0, 5)
    .map(({ lineNumber, line }) => `  ${projectPath}:${lineNumber} ${line.trim()}`)
    .join('\n')

  fail(
    `nuovo owner ts-paper non autorizzato: ${projectPath}\n${preview}\n` +
    'Sposta la regola nel canonical Training Sheet owner oppure aggiorna esplicitamente il contratto architetturale.'
  )
}

if (!owners.some(({ projectPath }) => canonicalOwners.has(projectPath))) {
  fail('canonical owner src/design-system/training-editor.css non trovato o senza regole ts-paper')
}

for (const [path, cap] of transitionalCaps) {
  const owner = owners.find(({ projectPath }) => projectPath === path)
  const count = owner?.matches.length ?? 0
  if (count > cap) fail(`${path}: ${count} > baseline ${cap}`)
}

console.log('✓ canonical Training Sheet CSS owner exists')
console.log('✓ no new external ts-paper owner introduced')
console.log('✓ Match legacy ownership is zero and retired bridge is absent')
console.log('')
console.log('Training Sheet CSS Ownership R1.1F2: 3/3')
