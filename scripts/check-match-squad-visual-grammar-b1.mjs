import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const checks=[
 ['B1 marker exists',css.includes('R3.5B1 — visual grammar')],
 ['command is primary operational surface',/squad-command-strip\s*\{[\s\S]*?staff-color-primary/.test(css)],
 ['command uses raised panel token',/squad-command-strip\s*\{[\s\S]*?staff-color-bg-panel-raised/.test(css)],
 ['pitch and lineup share working-surface owner',/\.pitch-panel,[\s\S]*?\.lineup-list--selection\s*\{[\s\S]*?staff-color-bg-panel/.test(css)],
 ['bench is quieter and shadowless',/bench-block--full-width\s*\{[\s\S]*?box-shadow:\s*none/.test(css)],
 ['field labels use secondary DS text',(css.match(/color:\s*var\(--staff-color-text-secondary\)/g)||[]).length>=3],
 ['command controls use DS control background',(css.match(/background:\s*var\(--staff-color-bg-control\)/g)||[]).length>=4],
 ['starter number uses primary accent',/starter-number-input\s*\{[\s\S]*?color:\s*var\(--staff-color-primary\)/.test(css)],
 ['starter desktop geometry remains 64x46',/starter-number-input\s*\{[\s\S]*?width:\s*64px[\s\S]*?height:\s*46px/.test(css)],
 ['starter compact width remains 60px',/@media \(max-width: 520px\)[\s\S]*?starter-number-input\s*\{[\s\S]*?width:\s*60px/.test(css)],
 ['pitch header separator uses DS border token',/pitch-panel-head\s*\{[\s\S]*?staff-color-border-subtle/.test(css)],
 ['520 owner remains singular',(css.match(/@media \(max-width: 520px\)/g)||[]).length===1],
 ['760 layering remains untouched',(css.match(/@media \(max-width: 760px\)/g)||[]).length===4],
 ['R3.5A1 geometry owner remains',css.includes('R3.5A1 — canonical mobile geometry owner.')],
 ['no important escalation',!css.includes('!important')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5B1 Match Squad Visual Grammar: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
