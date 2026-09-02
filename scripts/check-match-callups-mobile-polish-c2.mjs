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
['owner head one column',/@media \(max-width: 760px\)[\s\S]*?\.callups-head\s*\{[\s\S]*?display:\s*grid\s*!important[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/.test(owner)],
['bulk row 2 columns',/@media \(max-width: 760px\)[\s\S]*?\.callups-bulk-actions\s*\{[\s\S]*?display:\s*grid\s*!important[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important/.test(owner)],
['counter second row compact',/@media \(max-width: 760px\)[\s\S]*?\.callups-counter\s*\{[\s\S]*?position:\s*static\s*!important[\s\S]*?justify-self:\s*end[\s\S]*?white-space:\s*nowrap\s*!important/.test(owner)],
['match metadata has no fake mobile input geometry',!view.includes('type="date"')&&!responsive.includes('.callups-toolbar input')],
['actions 44',/@media \(max-width: 760px\)[\s\S]*?\.callups-toolbar-actions button\s*\{[\s\S]*?min-height:\s*44px\s*!important[\s\S]*?height:\s*44px\s*!important/.test(owner)&&/@media \(max-width: 760px\)[\s\S]*?\.callups-toolbar \[data-callups-pdf\]\s*\{[\s\S]*?min-height:\s*44px\s*!important[\s\S]*?height:\s*44px\s*!important/.test(owner)],
['alert compact',/@media \(max-width: 760px\)[\s\S]*?\.callups-alert\s*\{[\s\S]*?padding:\s*9px 11px[\s\S]*?font-size:\s*\.76rem[\s\S]*?line-height:\s*1\.25/.test(owner)],
['head contract remains',owner.includes('.callups-head')&&view.includes('callups-head callups-selection-bar')],
['bulk hooks remain',view.includes('data-callups-select-all')&&view.includes('data-callups-clear-all')],
['no unrelated owner',!owner.includes('.board-')&&!owner.includes('.match-score')],
['legacy counter max removed',!/CALLUPS: canonical real-device geometry[\s\S]*?max-width:\s*112px/.test(responsive)],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C2 Callups Mobile Polish (C3-compatible): ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
