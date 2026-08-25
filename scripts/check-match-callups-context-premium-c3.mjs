import fs from 'node:fs'
const view=fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const owner=fs.readFileSync('src/modules/match/ui/callups.css','utf8')
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8')
const events=fs.readFileSync('src/modules/match/events/callupsEvents.js','utf8')
const checks=[
['fake Partita/avversario field retired',!view.includes('Partita / avversario')],
['fake readonly date picker retired',!view.includes('type="date"')&&!view.includes('readonly')],
['context is above bulk actions',view.indexOf('callups-match-context')<view.indexOf('callups-selection-bar')],
['AVVERSARIO context label exists',view.includes('<span>AVVERSARIO</span>')],
['date is semantic metadata',view.includes('<time datetime=')&&view.includes('matchDateLabel')],
['PDF hooks preserved as named hidden controls',view.includes('type="hidden" name="callups_match" data-callups-match')&&view.includes('type="hidden" name="callups_date" data-callups-date')],
['PDF runtime reads same hooks',events.includes("querySelector('[data-callups-match]').value")&&events.includes("querySelector('[data-callups-date]').value")],
['toolbar is action-only',view.includes('callups-toolbar callups-toolbar--actions')&&!view.includes('<label><span>Partita')],
['context is domain-owned',owner.includes('.callups-match-context')&&owner.includes('.callups-context-opponent')&&owner.includes('.callups-context-date')],
['dead visible field CSS retired domain',!owner.includes('.callups-toolbar input')&&!owner.includes('.callups-toolbar label')],
['dead visible field CSS retired responsive',!responsive.includes('.callups-toolbar input')],
['mobile context geometry exists',/@media \(max-width: 760px\)[\s\S]*?\.callups-match-context/.test(owner)],
['long opponent protected compact',/@media \(max-width: 520px\)[\s\S]*?-webkit-line-clamp:\s*2/.test(owner)],
['bulk controls preserved',view.includes('data-callups-select-all')&&view.includes('data-callups-clear-all')],
['plural roles preserved',view.includes("Portiere: 'Portieri'")&&view.includes("Difensore: 'Difensori'")&&view.includes("Centrocampista: 'Centrocampisti'")&&view.includes("Attaccante: 'Attaccanti'")],
['DS owners preserved',owner.includes('.callups-panel')&&owner.includes('.callups-head')&&owner.includes('.callups-toolbar')&&owner.includes('.callups-counter')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C3-R1 Callups Context Premium: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
