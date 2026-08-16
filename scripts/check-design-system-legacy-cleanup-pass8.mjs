import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8')
const legacy = read('src/style.css')
const owner = read('src/modules/training/trainingLibrary.css')
const main = read('src/main.js')

const checks = [
  ['canonical owner exists', fs.existsSync('src/modules/training/trainingLibrary.css')],
  ['canonical owner imported', main.includes("import './modules/training/trainingLibrary.css'")],
  ['legacy no longer owns training-library root', !/\.training-library\s*\{/.test(legacy)],
  ['legacy no longer owns library toolbar', !/\.library-toolbar\s*\{/.test(legacy)],
  ['legacy no longer owns library sheet summary', !/\.library-sheet-summary\s*\{/.test(legacy)],
  ['legacy no longer owns library feedback editor', !/\.library-feedback-editor\s*\{/.test(legacy)],
  ['legacy no longer owns compact filter menu', !/\.library-filter-menu\s*>\s*summary\s*\{/.test(legacy)],
  ['owner contains library root', /\.training-library\s*\{/.test(owner)],
  ['owner contains toolbar', /\.library-toolbar\s*\{/.test(owner)],
  ['owner contains feedback editor', /\.library-feedback-editor\s*\{/.test(owner)],
  ['owner contains compact filter panel', /\.library-filter-panel\s*\{/.test(owner)],
  ['owner contains mobile contract', /@media\s*\(max-width:\s*760px\)/.test(owner)],
]
let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
  if (!ok) failed++
}
console.log(`\nDS Legacy Cleanup Pass 8: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
