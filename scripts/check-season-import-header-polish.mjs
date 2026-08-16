import fs from 'node:fs'
const view=fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8')
const style=fs.readFileSync('src/modules/calendar/seasonCalendarImport.css','utf8')
const checks=[
 ['intro uses compact hierarchy hook',view.includes('season-import-intro-compact')],
 ['warning uses compact hierarchy hook',view.includes('season-import-preview-warning-compact')],
 ['intro is no longer a large card',style.includes('background:transparent')&&style.includes('border-bottom:1px solid #1d3542')],
 ['desktop intro is a compact inline row',style.includes('.season-import-intro-compact{')&&style.includes('display:flex')],
 ['warning is a slim notice',style.includes('padding:10px 12px')&&style.includes('font-size:.78rem')],
 ['mobile stacks both blocks cleanly',style.includes('@media(max-width:760px)')&&style.includes('display:grid')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nSeason Import Header Polish: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
