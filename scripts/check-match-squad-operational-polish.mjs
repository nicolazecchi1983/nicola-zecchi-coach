import fs from 'node:fs'
const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const checks = [
  ['legacy duplicate inner team heading removed', !view.includes('<header class="section-title"><span>02</span>')],
  ['workspace begins from canonical command strip', view.includes('squad-command-strip') && view.includes('data-squad-command-strip')],
  ['primary configuration has its own structural group', view.includes('squad-command-primary') && view.includes('data-squad-command-primary')],
  ['leadership has its own lineup structural group', view.includes('lineup-leadership') && view.includes('data-lineup-leadership') && !view.includes('squad-command-leadership')],
  ['field reset belongs to pitch panel', view.indexOf('pitch-panel-head') < view.indexOf('data-reset-formation') && view.indexOf('data-reset-formation') < view.indexOf('data-football-pitch')],
  ['master layout follows canonical equal-column geometry', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['starter rows keep stable rhythm', css.includes('grid-template-rows: repeat(11, minmax(42px, 1fr))')],
  ['tablet command groups reflow structurally', css.includes('@media (max-width: 1180px)')],
  ['mobile primary command collapses to one column', css.includes('@media (max-width: 760px)') && css.includes('.squad-command-primary {\n    grid-template-columns: 1fr;')],
  ['no match domain data or persistence added', !view.includes('supabase') && !view.includes('repository') && !view.includes('service.')],
]
let ok=0
for (const [name, pass] of checks) { console.log(`${pass?'✓':'✗'} ${name}`); if(pass) ok++ }
console.log(`\nMatch Squad Operational Polish: ${ok}/${checks.length}`)
if(ok!==checks.length) process.exit(1)
