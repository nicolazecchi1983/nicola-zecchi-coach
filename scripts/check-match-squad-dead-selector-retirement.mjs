import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const view=fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const token=fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.js','utf8')
const checks=[
 ['retired starter select css gone',!css.includes('starter-number-select')],
 ['starter numeric input css remains',css.includes('.starter-number-input')],
 ['starter markup uses numeric input',view.includes('class="starter-number-input"')],
 ['starter markup has no retired select',!view.includes('class="starter-number-select"')],
 ['retired toolbar label branch gone',!css.includes('toolbar-control-label')],
 ['shared token label anatomy remains',token.includes('match-token-display__label')],
 ['Match Squad does not re-own shared token label',!css.includes('match-token-display__label')],
 ['retired leadership target css gone',!css.includes('is-leadership-target')],
 ['captain state remains',css.includes('.player-token.is-captain')],
 ['vice captain state remains',css.includes('.player-token.is-vice-captain')],
 ['starter desktop input width remains 64px',/starter-number-input\s*\{[\s\S]*?width:\s*64px/.test(css)],
 ['starter compact input width remains 60px',/@media \(max-width: 520px\)[\s\S]*?starter-number-input\s*\{[\s\S]*?width:\s*60px/.test(css)],
 ['R3.5A4 compact owner remains singular',(css.match(/@media \(max-width: 520px\)/g)||[]).length===1],
 ['760 layering remains intentionally untouched',(css.match(/@media \(max-width: 760px\)/g)||[]).length===4],
 ['no important escalation',!css.includes('!important')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5A5 Match Squad Dead Selector Retirement: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
