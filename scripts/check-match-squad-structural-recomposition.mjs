import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')

const layoutStart = view.indexOf('<div class="match-lineup-layout match-lineup-layout--master">')
const benchStart = view.indexOf('<div class="bench-block bench-block--automatic bench-block--full-width"')
const sectionEnd = view.lastIndexOf('</section>`')
const sideColumn = view.includes('class="squad-side-column"')

const checks = [
  ['canonical recomposition contract exists', css.includes('STAFF 0.29.11 — Nostra squadra · player-number + Soccer Board foundation')],
  ['pitch and starters still share master operational row', layoutStart >= 0 && view.indexOf('lineup-list lineup-list--selection', layoutStart) > layoutStart],
  ['bench is structurally outside the master row', benchStart > layoutStart && benchStart < sectionEnd && view.slice(layoutStart, benchStart).includes('</div>\n    </div>')],
  ['legacy side column wrapper is retired', !sideColumn],
  ['bench has explicit full-width hook', view.includes('bench-block--full-width') && css.includes('.bench-block--full-width')],
  ['desktop master row follows approved 50/50 geometry', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['bench uses horizontal three-column desktop grid', css.includes('.bench-grid--slots') && css.includes('repeat(3, minmax(0, 1fr))')],
  ['tablet bench reduces to two columns', css.includes('repeat(2, minmax(0, 1fr))')],
  ['mobile bench reduces to one column', css.includes('@media (max-width: 760px)') && css.includes('.match-squad-step .bench-grid--slots {\n    grid-template-columns: 1fr;')],
  ['formation field names and runtime hooks remain unchanged', view.includes('name="formation"') && view.includes('data-reset-formation') && view.includes('data-leadership-select="captain"') && view.includes('data-bench-select="${index}"')],
  ['no persistence or domain dependency introduced in view', !view.includes('supabase') && !view.includes('repository') && !view.includes('service.')],
  ['new layout adds no important escalation', !css.includes('!important')],
]

let ok = 0
for (const [name, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${name}`)
  if (pass) ok++
}
console.log(`\nMatch Squad Structural Recomposition: ${ok}/${checks.length}`)
if (ok !== checks.length) process.exit(1)
