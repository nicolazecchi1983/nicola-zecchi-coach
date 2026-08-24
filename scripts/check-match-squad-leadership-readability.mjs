import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')

const checks = [
  ['captain label remains explicit', view.includes('<span>Capitano</span>')],
  ['vice captain label is written in full', view.includes('<span>Vicecapitano</span>') && !view.includes('<span>Vice</span>')],
  ['captain select keeps canonical runtime hook', view.includes('name="captain" data-leadership-select="captain"')],
  ['vice captain select keeps canonical runtime hook', view.includes('name="vice_captain" data-leadership-select="vice_captain"')],
  ['leadership is a dedicated command row', view.includes('squad-command-leadership') && view.includes('data-squad-command-leadership')],
  ['leadership group guarantees two readable desktop columns', css.includes('grid-template-columns: repeat(2, minmax(320px, 1fr));')],
  ['leadership labels cannot wrap or collapse', css.includes('.leadership-control > span') && css.includes('white-space: nowrap;')],
  ['leadership selects get a readable desktop minimum', css.includes('.leadership-control select') && css.includes('width: 100%;') && css.includes('min-width: 0;')],
  ['tablet preserves two-column leadership contract', css.includes('@media (max-width: 1180px)') && css.includes('.squad-command-leadership {') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['mobile stacks leadership controls before squeezing names', css.includes('@media (max-width: 760px)') && css.includes('.squad-command-leadership {') && css.includes('grid-template-columns: 1fr;')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else console.error(`✗ ${label}`)
}
console.log(`\nMatch Squad Leadership Readability: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
