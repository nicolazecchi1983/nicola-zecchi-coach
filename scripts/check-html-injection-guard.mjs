import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(root, 'src')
const baselinePath = path.join(root, 'scripts', 'security', 'innerhtml-baseline.json')
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && entry.name.endsWith('.js') ? [full] : []
  })
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length
}

const actual = new Map()
const forbidden = []
for (const file of walk(srcRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file).replaceAll('\\', '/')
  const innerHTML = countMatches(source, /\.innerHTML\s*=/g)
  const insertAdjacentHTML = countMatches(source, /\.insertAdjacentHTML\s*\(/g)
  const innerHTMLAppend = countMatches(source, /\.innerHTML\s*\+=/g)
  const outerHTMLAssign = countMatches(source, /\.outerHTML\s*=/g)

  if (innerHTML || insertAdjacentHTML) actual.set(rel, { innerHTML, insertAdjacentHTML })
  if (innerHTMLAppend) forbidden.push(`${rel}: innerHTML += (${innerHTMLAppend})`)
  if (outerHTMLAssign) forbidden.push(`${rel}: outerHTML = (${outerHTMLAssign})`)
}

const failures = []
const reviewed = baseline.sinks || {}

for (const [file, counts] of actual) {
  const allowed = reviewed[file]
  if (!allowed) {
    failures.push(`Nuovo HTML sink non revisionato: ${file} (innerHTML=${counts.innerHTML}, insertAdjacentHTML=${counts.insertAdjacentHTML})`)
    continue
  }
  if (counts.innerHTML > allowed.innerHTML) {
    failures.push(`Crescita innerHTML non revisionata in ${file}: ${counts.innerHTML} > baseline ${allowed.innerHTML}`)
  }
  if (counts.insertAdjacentHTML > allowed.insertAdjacentHTML) {
    failures.push(`Crescita insertAdjacentHTML non revisionata in ${file}: ${counts.insertAdjacentHTML} > baseline ${allowed.insertAdjacentHTML}`)
  }
}

for (const [file, allowed] of Object.entries(reviewed)) {
  if (!allowed.classification || !allowed.reason) failures.push(`Baseline incompleta per ${file}: classification/reason obbligatori`)
  if (!Number.isInteger(allowed.innerHTML) || !Number.isInteger(allowed.insertAdjacentHTML)) {
    failures.push(`Baseline conteggi non validi per ${file}`)
  }
}

if (forbidden.length) failures.push(`Sink vietati trovati: ${forbidden.join(', ')}`)

const baselineInner = Object.values(reviewed).reduce((sum, item) => sum + item.innerHTML, 0)
const baselineAdjacent = Object.values(reviewed).reduce((sum, item) => sum + item.insertAdjacentHTML, 0)
const actualInner = [...actual.values()].reduce((sum, item) => sum + item.innerHTML, 0)
const actualAdjacent = [...actual.values()].reduce((sum, item) => sum + item.insertAdjacentHTML, 0)

if (actualInner > baselineInner) failures.push(`Numero totale innerHTML aumentato: ${actualInner} > ${baselineInner}`)
if (actualAdjacent > baselineAdjacent) failures.push(`Numero totale insertAdjacentHTML aumentato: ${actualAdjacent} > ${baselineAdjacent}`)

if (failures.length) {
  console.error('HTML INJECTION GUARD: FAIL')
  failures.forEach((failure) => console.error(`- ${failure}`))
  console.error('Per introdurre/modificare un HTML sink serve review esplicita e aggiornamento di scripts/security/innerhtml-baseline.json.')
  process.exit(1)
}

console.log(`HTML INJECTION GUARD: OK — ${actualInner} innerHTML + ${actualAdjacent} insertAdjacentHTML, ${actual.size} file revisionati; nessun nuovo sink non approvato`)
