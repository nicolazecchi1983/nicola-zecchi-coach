import fs from 'node:fs'

const read = p => fs.readFileSync(p, 'utf8')
const legacy = read('src/style.css')
const owner = read('src/modules/match/ui/matchLibrary.css')
const main = read('src/main.js')

const checks = [
  ['match library owner exists', owner.length > 5000],
  ['match library owner imported', main.includes("./modules/match/ui/matchLibrary.css")],
  ['toolbar geometry owned canonically', owner.includes('.match-library-toolbar {') && owner.includes('grid-template-columns: minmax(340px, 1.2fr)')],
  ['card geometry owned canonically', owner.includes('.match-library-card {') && owner.includes('grid-template-columns: 150px minmax(0, 1fr) 150px auto;')],
  ['monthly grouping owned canonically', owner.includes('.match-library-month > summary') && owner.includes('.match-library-month-content')],
  ['mobile geometry owned canonically', owner.includes('@media (max-width: 760px)') && owner.includes('.match-library-toolbar { grid-template-columns: 1fr; }')],
  ['canonical owner has no important escalation', !owner.includes('!important')],
  ['legacy has no match library selectors', !/^\s*\.match-library/m.test(legacy)],
  ['legacy records migration boundary', legacy.includes('MATCH LIBRARY — ownership migrated to src/modules/match/ui/matchLibrary.css in 0.27.26.')],
  ['legacy M2 library subsection retired', legacy.includes('Match Library M2.0 presentation migrated to canonical matchLibrary.css.')],
  ['legacy remains below 4500 lines', legacy.split(/\r?\n/).length < 4500],
  ['owner keeps adaptive tablet and mobile contracts', owner.includes('@media (max-width: 1000px)') && owner.includes('@media (max-width: 760px)')],
]

let ok = 0
for (const [name, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${name}`)
  if (pass) ok++
}
console.log(`\nDS Legacy Cleanup Pass 13: ${ok}/${checks.length}`)
if (ok !== checks.length) process.exit(1)
