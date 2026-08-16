import fs from 'node:fs'

const view = fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8')
const style = fs.readFileSync('src/modules/calendar/seasonCalendarImport.css','utf8')

const checks = [
  ['preview table declares semantic colgroup', view.includes('<colgroup>') && view.includes('season-import-col-day') && view.includes('season-import-col-home-away')],
  ['match-day column is deliberately compact', style.includes('.season-import-table .season-import-col-day{width:64px}')],
  ['home-away column receives enough desktop width', style.includes('.season-import-table .season-import-col-home-away{width:164px}')],
  ['home-away select cannot collapse below readable width', style.includes('min-width:142px') && style.includes('white-space:nowrap')],
  ['competition column remains readable', style.includes('.season-import-table .season-import-col-competition{width:190px}') && style.includes('min-width:168px')],
  ['opponent receives remaining flexible width', style.includes('.season-import-table .season-import-col-opponent{width:auto}')],
  ['mobile keeps controlled horizontal scroll instead of compressing labels', style.includes('@media(max-width:720px)') && style.includes('min-width:1040px')],
]

let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nSeason Import Preview Layout: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
