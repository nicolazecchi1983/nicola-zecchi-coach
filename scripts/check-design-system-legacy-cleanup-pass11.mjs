import fs from 'node:fs'

const read = p => fs.readFileSync(p, 'utf8')
const legacy = read('src/style.css')
const owner = read('src/modules/calendar/seasonCalendarImport.css')
const main = read('src/main.js')

const checks = [
  ['season import owner exists', owner.length > 5000],
  ['season import owner imported', main.includes("./modules/calendar/seasonCalendarImport.css")],
  ['base modal owned by calendar module', owner.includes('.season-import-modal{')],
  ['official source owned by calendar module', owner.includes('.season-import-official-source{')],
  ['preview columns owned by calendar module', owner.includes('.season-import-col-day{width:64px}') && owner.includes('.season-import-col-opponent{width:auto}')],
  ['desktop no-scroll contract owned by calendar module', owner.includes('@media (min-width: 761px)') && owner.includes('.season-import-preview-table-wrap')],
  ['compact header owned by calendar module', owner.includes('.season-import-intro-compact{') && owner.includes('.season-import-preview-warning-compact{')],
  ['legacy has no season import selectors', !/\.season-import[-\w]*/.test(legacy)],
  ['legacy records migration boundary', legacy.includes('Season Calendar Import — ownership migrated to src/modules/calendar/seasonCalendarImport.css in 0.27.24.')],
  ['owner does not contain domain javascript', !owner.includes('addEventListener') && !owner.includes('supabase')],
  ['legacy remains below 4800 lines', legacy.split(/\r?\n/).length < 4800],
  ['owner keeps existing responsive thresholds', owner.includes('@media(max-width:720px)') && owner.includes('@media(max-width:760px)')],
]

let ok=0
for (const [name, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${name}`)
  if (pass) ok++
}
console.log(`\nDS Legacy Cleanup Pass 11: ${ok}/${checks.length}`)
if (ok !== checks.length) process.exit(1)
