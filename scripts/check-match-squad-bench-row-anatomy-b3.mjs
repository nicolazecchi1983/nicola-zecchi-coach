import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
function mediaBlocks(width){
 const marker=`@media (max-width: ${width}px) {`,out=[];let from=0
 while(true){const start=css.indexOf(marker,from);if(start<0)break;let depth=0,body=-1,closed=false
  for(let i=start;i<css.length;i++){if(css[i]==='{'){depth++;if(body<0)body=i+1}else if(css[i]==='}'){depth--;if(depth===0){out.push(css.slice(body,i));from=i+1;closed=true;break}}}
  if(!closed)break
 }
 return out
}
const mobile760=mediaBlocks(760).join('\n')
const checks=[
 ['bench header grid owner',/\.bench-block-head\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/.test(css)],
 ['bench title nowrap',/\.bench-block-head h3\s*\{[\s\S]*?white-space:\s*nowrap/.test(css)],
 ['bench count nowrap',/\.bench-count\s*\{[\s\S]*?white-space:\s*nowrap/.test(css)],
 ['desktop bench number column 44',/\.bench-slot\s*\{[\s\S]*?grid-template-columns:\s*44px\s*minmax\(0,\s*1fr\)/.test(css)],
 ['desktop number exact 44',/\.bench-slot-number\s*\{[\s\S]*?height:\s*44px[\s\S]*?max-height:\s*44px/.test(css)],
  ['bench number cell owns intentional two-line grid',/\.bench-slot-number\s*\{[\s\S]*?grid-template-rows:\s*auto auto[\s\S]*?align-content:\s*center[\s\S]*?justify-items:\s*center[\s\S]*?gap:\s*2px/.test(css)],
  ['bench position and real shirt number have separate typography owners',/\.bench-slot-order\s*\{[\s\S]*?font-size:\s*\.64rem/.test(css)&&/\.bench-slot-number > b\s*\{[\s\S]*?font-size:\s*\.72rem/.test(css)],
 ['desktop select exact 44',/\.bench-slot select\s*\{[\s\S]*?height:\s*44px[\s\S]*?max-height:\s*44px/.test(css)],
 ['desktop select vertical padding zero',/\.bench-slot select\s*\{[\s\S]*?padding:\s*0 36px 0 12px/.test(css)],
 ['mobile B3 inside existing 760 owner',/@media \(max-width: 760px\)[\s\S]*?R3\.5B3-R1 — bench mobile anatomy inside canonical 760 owner/.test(css)],
 ['mobile bench number column 60',/R3\.5B3-R1[\s\S]*?bench-slot\s*\{[\s\S]*?grid-template-columns:\s*60px\s*minmax\(0,\s*1fr\)/.test(css)],
 ['mobile controls exact 48',/R3\.5B3-R1[\s\S]*?bench-slot-number,[\s\S]*?bench-slot select\s*\{[\s\S]*?height:\s*48px[\s\S]*?max-height:\s*48px/.test(css)],
 ['B2 topology four 760 owners',(css.match(/@media \(max-width: 760px\)/g)||[]).length===4],
 ['A4 topology one 520 owner',(css.match(/@media \(max-width: 520px\)/g)||[]).length===1],
 ['primary command one-column collapse remains singular',(mobile760.match(/\.match-squad-step \.squad-command-primary\s*\{\s*grid-template-columns:\s*1fr;\s*\}/g)||[]).length===1],
 ['bench controls border-box',/\.bench-slot-number\s*\{[\s\S]*?box-sizing:\s*border-box/.test(css)&&/\.bench-slot select\s*\{[\s\S]*?box-sizing:\s*border-box/.test(css)],
 ['no important escalation',!css.includes('!important')],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5B3-R1 Bench Canonical Anatomy: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
