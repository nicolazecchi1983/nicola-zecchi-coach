import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(root, 'src')
const canonicalPath = path.join(srcRoot, 'shared', 'html', 'escapeHtml.js')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && entry.name.endsWith('.js') ? [full] : []
  })
}

const canonicalModule = await import(pathToFileURL(canonicalPath).href)
const { escapeHtml } = canonicalModule
if (typeof escapeHtml !== 'function') {
  console.error('CANONICAL HTML ESCAPE: FAIL — src/shared/html/escapeHtml.js non esporta escapeHtml()')
  process.exit(1)
}

const behaviorCases = [
  [null, ''],
  [undefined, ''],
  ['', ''],
  ['&<>"\'', '&amp;&lt;&gt;&quot;&#039;'],
  ['<script>alert("x")</script>', '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'],
  [42, '42'],
]

const behaviorFailures = behaviorCases
  .map(([input, expected]) => ({ input, expected, actual: escapeHtml(input) }))
  .filter(({ expected, actual }) => expected !== actual)

const entitySet = ['&amp;', '&lt;', '&gt;', '&quot;', '&#039;']
const duplicateImplementations = []
for (const file of walk(srcRoot)) {
  if (path.resolve(file) === path.resolve(canonicalPath)) continue
  const source = fs.readFileSync(file, 'utf8')
  const containsFullEscapeEntitySet = entitySet.every((entity) => source.includes(entity))
  const containsEscapeReplacePattern = /\.replace\s*\(\s*\/\[[^\]]*[&<>][^\]]*\]\/g/.test(source)
    || (/\.replace\s*\(\s*\/&\/g/.test(source)
      && /\.replace\s*\(\s*\/<\/g/.test(source)
      && /\.replace\s*\(\s*\/>\/g/.test(source))

  if (containsFullEscapeEntitySet && containsEscapeReplacePattern) {
    duplicateImplementations.push(path.relative(root, file))
  }
}

const failures = []
if (behaviorFailures.length) {
  failures.push(`Comportamento canonico errato: ${JSON.stringify(behaviorFailures)}`)
}
if (duplicateImplementations.length) {
  failures.push(`Implementazioni HTML escape parallele trovate: ${duplicateImplementations.join(', ')}`)
}

if (failures.length) {
  console.error('CANONICAL HTML ESCAPE: FAIL')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`CANONICAL HTML ESCAPE: OK — 1 owner canonico, ${walk(srcRoot).length} file JS verificati, ${behaviorCases.length} casi comportamentali`)
