import fs from 'node:fs'
const view=fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const owner=fs.readFileSync('src/modules/match/ui/callups.css','utf8')
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8')
const checks=[
['plural labels',view.includes("Portiere: 'Portieri'")&&view.includes("Difensore: 'Difensori'")&&view.includes("Centrocampista: 'Centrocampisti'")&&view.includes("Attaccante: 'Attaccanti'")],
['domain role singular',view.includes('data-callup-role="${escapeHtml(player.role)}"')],
['display label used',view.includes('group.label.toUpperCase()')],
['mobile row compact',/@media \(max-width: 760px\)[\s\S]*?\.callup-player\s*\{[\s\S]*?grid-template-columns:\s*auto 34px minmax\(0,\s*1fr\)/.test(owner)],
['mobile repeated role hidden',/@media \(max-width: 760px\)[\s\S]*?\.callup-player small\s*\{[\s\S]*?display:\s*none/.test(owner)],
['responsive head one column',/CALLUPS: canonical real-device geometry[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/.test(responsive)],
['bulk row 2 columns',/\.callups-bulk-actions\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important/.test(responsive)],
['counter second row compact',/\.callups-counter\s*\{[\s\S]*?justify-self:\s*end[\s\S]*?white-space:\s*nowrap\s*!important/.test(responsive)],
['match metadata has no fake mobile input geometry',!view.includes('type="date"')&&!responsive.includes('.callups-toolbar input')],
['actions 44',/\.callups-toolbar-actions button,[\s\S]*?height:\s*44px\s*!important/.test(responsive)],
['alert compact',/\.callups-alert\s*\{[\s\S]*?padding:\s*9px 11px/.test(responsive)],
['head contract remains',owner.includes('.callups-head')&&view.includes('callups-head callups-selection-bar')],
['bulk hooks remain',view.includes('data-callups-select-all')&&view.includes('data-callups-clear-all')],
['no unrelated owner',!owner.includes('.board-')&&!owner.includes('.match-score')],
['legacy counter max removed',!/CALLUPS: canonical real-device geometry[\s\S]*?max-width:\s*112px/.test(responsive)],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C2 Callups Mobile Polish (C3-compatible): ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
