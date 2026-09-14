import fs from 'node:fs'

const normalizeEol = (value) => String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
import assert from 'node:assert/strict'

const legacy = normalizeEol(fs.readFileSync('src/style.css', 'utf8'))
const calendar = normalizeEol(fs.readFileSync('src/modules/calendar/calendarPolish.css', 'utf8'))

const checks = [
  ['legacy base calendar owner removed', !legacy.includes('/* CALENDARIO */')],
  ['legacy smartphone calendar owner removed', !legacy.includes('V5.3.3 — Smartphone: sola visualizzazione Mese')],
  ['legacy clean header owner removed', !legacy.includes('V5.3.4 — Header calendario pulito')],
  ['legacy compact month owner removed', !legacy.includes('V5.3.5 - cambio mese compatto')],
  ['canonical toolbar owns grid', calendar.includes('.calendar-toolbar {') && calendar.includes('grid-template-columns: 1fr auto 1fr')],
  ['canonical clean toolbar owns month navigation geometry', calendar.includes('.calendar-toolbar--clean {') && calendar.includes('grid-template-columns: var(--staff-control-height-compact) auto var(--staff-control-height-compact)')],
  ['canonical month grid owns seven columns', calendar.includes('.calendar-weekdays,\n.calendar-grid') && calendar.includes('repeat(7, minmax(0, 1fr))')],
  ['canonical event owns full clickable width', calendar.includes('width: 100%') && calendar.includes('cursor: pointer')],
]
let ok=0
for(const [name, pass] of checks){ try{assert.ok(pass); console.log(`✓ ${name}`); ok++}catch{console.error(`✗ ${name}`)} }
console.log(`\nDS Legacy Cleanup Pass 1: ${ok}/${checks.length}`)
if(ok!==checks.length) process.exit(1)
