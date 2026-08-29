import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const r34c=css.indexOf('0.29.61 — R3.4C Match Squad Cross-Viewport Alignment')
const b2=css.indexOf('R3.5B2-R4 — Operational Density & Premium Layout')
const grouped=(css.match(/\.match-squad-step \.squad-command-primary,\s*\n\s*\.match-squad-step \.squad-command-leadership\s*\{/g)||[]).length
const checks=[
 ['B2-R4 marker exists',b2>=0],
 ['B2 final desktop owner is after R3.4C',b2>r34c],
 ['92px desktop header declaration wins by source order',css.lastIndexOf('min-height: 92px;')>css.lastIndexOf('min-height: 116px;')],
 ['two-row desktop pitch header wins by source order',css.lastIndexOf('grid-template-rows: auto auto;')>css.lastIndexOf('grid-template-rows: 1fr;')],
 ['desktop actions stay bounded without hard minimum',/R3\.5B2-R4[\s\S]*?pitch-panel-actions[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?max-width:\s*430px/.test(css)],
 ['desktop starter controls are 44px',/R3\.5B2-R4[\s\S]*?starter-number-input,[\s\S]*?height:\s*44px/.test(css)],
 ['mobile command controls are 48px',/@media \(max-width: 760px\)[\s\S]*?min-height:\s*48px[\s\S]*?height:\s*48px/.test(css)],
 ['mobile pitch header is compacted',/@media \(max-width: 760px\)[\s\S]*?pitch-panel-head[\s\S]*?gap:\s*10px/.test(css)],
 ['mobile lineup surface is compacted',/@media \(max-width: 760px\)[\s\S]*?lineup-list--selection\s*\{[\s\S]*?padding:\s*10px/.test(css)],
 ['canonical grouped mobile command collapse stays singular',grouped===1],
 ['R3.5A1 geometry remains',css.includes('R3.5A1 — canonical mobile geometry owner.')],
 ['520 owner remains singular',(css.match(/@media \(max-width: 520px\)/g)||[]).length===1],
 ['760 topology remains exactly four owners',(css.match(/@media \(max-width: 760px\)/g)||[]).length===4],
 ['starter runtime hooks remain styled',css.includes('.starter-number-input')&&css.includes('.starter-player-select')],
 ['no important escalation',!css.includes('!important')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5B2-R4 Match Squad Operational Density: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
