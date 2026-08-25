import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/callups.css','utf8')
const view=fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const checks=[
 ['panel canonical owner preserved',css.includes('.callups-panel')],
 ['header canonical owner preserved',css.includes('.callups-head')],
 ['header owner used by runtime markup',view.includes('callups-head callups-selection-bar')],
 ['toolbar canonical owner preserved',css.includes('.callups-toolbar')],
 ['selected counter canonical owner preserved',css.includes('.callups-counter')],
 ['role grouping canonical owner preserved',css.includes('.callups-role-group')],
 ['player rows canonical owner preserved',css.includes('.callup-player')],
 ['existing 900px behavior retained',css.includes('@media (max-width: 900px)')],
 ['bulk controls remain callups-domain owned',css.includes('.callups-bulk-actions')&&css.includes('.callups-bulk-button')],
 ['owner does not absorb Board or Match Sheet',!css.includes('.board-')&&!css.includes('.match-sheet')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C1-R1 DS Pass18 Compatibility: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
