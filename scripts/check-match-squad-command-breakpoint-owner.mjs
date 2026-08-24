import fs from 'node:fs'
const css=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
function blocks(width){
 const marker=`@media (max-width: ${width}px) {`,out=[];let from=0
 while(true){const start=css.indexOf(marker,from);if(start<0)break;let depth=0,body=-1,closed=false
 for(let i=start;i<css.length;i++){if(css[i]==='{'){depth++;if(body<0)body=i+1}else if(css[i]==='}'){depth--;if(depth===0){out.push(css.slice(body,i));from=i+1;closed=true;break}}}
 if(!closed)break}return out}
const b1180=blocks(1180).join('\n'),b760=blocks(760).join('\n')
const count=(t,r)=>(t.match(r)||[]).length
const checks=[
 ['1180 primary has one owner',count(b1180,/\.match-squad-step \.squad-command-primary\s*\{/g)===1],
 ['1180 token display has one owner',count(b1180,/\.match-squad-step \.token-display-field\s*\{/g)===1],
 ['1180 leadership has one owner',count(b1180,/\.match-squad-step \.squad-command-leadership\s*\{/g)===1],
 ['1180 primary keeps two columns',/\.squad-command-primary\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(b1180)],
 ['1180 token keeps full row',/\.token-display-field\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/.test(b1180)],
 ['1180 leadership keeps final equal columns',/\.squad-command-leadership\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(b1180)],
 ['dead 280px owner is gone',!b1180.includes('minmax(280px, 1fr)')],
 ['760 command collapse occurs once',count(b760,/\.squad-command-primary,\s*\n\s*\.match-squad-step \.squad-command-leadership\s*\{/g)===1],
 ['760 command remains one column',/\.squad-command-primary,\s*\n\s*\.match-squad-step \.squad-command-leadership\s*\{[\s\S]*?grid-template-columns:\s*1fr/.test(b760)],
 ['760 token auto preserved',/\.token-display-field\s*\{[\s\S]*?grid-column:\s*auto/.test(b760)],
 ['760 bench collapse preserved',/\.bench-grid--slots\s*\{[\s\S]*?grid-template-columns:\s*1fr/.test(b760)],
 ['1180 pitch refinement preserved',/\[data-football-pitch\]\s*\{[\s\S]*?width:\s*min\(92%,\s*500px\)/.test(b1180)],
 ['1040 core owner remains',blocks(1040).join('\n').includes('.match-lineup-layout--master')],
 ['R3.5A1 geometry owner remains',css.includes('R3.5A1 — canonical mobile geometry owner.')],
 ['no important escalation',!css.includes('!important')]
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5A3 Match Squad Command Breakpoint Owner: ${p}/${checks.length}`);if(p!==checks.length)process.exit(1)
