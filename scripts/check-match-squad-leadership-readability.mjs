import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')

const checks = [
  ['captain label remains explicit', view.includes('<span>Capitano</span>')],
  ['vice captain label is written in full', view.includes('<span>Vicecapitano</span>') && !view.includes('<span>Vice</span>')],
  ['captain select keeps canonical runtime hook', view.includes('name="captain" data-leadership-select="captain"')],
  ['vice captain select keeps canonical runtime hook', view.includes('name="vice_captain" data-leadership-select="vice_captain"')],
  ['leadership appears after Undici iniziale title and before starter rows', view.indexOf('data-lineup-leadership') > view.indexOf('<h3>Undici iniziale</h3>') && view.indexOf('data-lineup-leadership') < view.indexOf('class="lineup-selection-list"')],
  ['leadership is a dedicated lineup-owned group', view.includes('lineup-leadership') && view.includes('data-lineup-leadership') && !view.includes('squad-command-leadership')],
  ['leadership group guarantees two readable desktop columns', css.includes('.lineup-list--selection .lineup-leadership {') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['leadership labels cannot wrap or collapse', css.includes('.leadership-control > span') && css.includes('white-space: nowrap;')],
  ['leadership selects get a readable desktop minimum', css.includes('.leadership-control select') && css.includes('width: 100%;') && css.includes('min-width: 0;')],
  ['tablet inherits the two-column lineup leadership contract', css.includes('.lineup-list--selection .lineup-leadership {') && !css.includes('.squad-command-leadership')],
  ['mobile preserves compact two-column leadership without a second breakpoint owner', !css.includes('.squad-command-leadership') && (css.match(/@media \(max-width: 520px\)/g) || []).length === 1],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else console.error(`✗ ${label}`)
}
console.log(`\nMatch Squad Leadership Readability: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
