import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const legacy = fs.readFileSync('src/modules/match/ui/matchSheet.css', 'utf8')

const checks = [
  ['Nostra squadra retires all legacy formation-toolbar classes', view.includes('class="squad-command-strip"') && !view.includes('formation-toolbar--single-row') && !view.includes('class="formation-toolbar')],
  ['command strip owns one explicit outer column', css.includes('grid-template-columns: minmax(0, 1fr);')],
  ['command strip forces row flow', css.includes('grid-auto-flow: row;')],
  ['command strip stretches its rows instead of inheriting legacy end alignment', css.includes('align-items: stretch;')],
  ['configuration group is pinned to row one', css.includes('.match-squad-step .squad-command-primary {') && css.includes('grid-row: 1;') && css.includes('grid-column: 1;')],
  ['leadership group is pinned to row two', css.includes('.match-squad-step .squad-command-leadership {') && css.includes('grid-row: 2;')],
  ['configuration group owns full row width', css.includes('.match-squad-step .squad-command-primary {') && css.includes('width: 100%;')],
  ['leadership group owns full row width', css.includes('.match-squad-step .squad-command-leadership {') && css.indexOf('width: 100%;', css.indexOf('.match-squad-step .squad-command-leadership {')) > css.indexOf('.match-squad-step .squad-command-leadership {')],
  ['legacy Match Sheet still exists only as compatibility owner', legacy.includes('.formation-toolbar{') || legacy.includes('.formation-toolbar {')],
  ['field reset remains outside command strip', view.indexOf('data-reset-formation') > view.indexOf('<div class="pitch-panel">')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Command Row Isolation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
