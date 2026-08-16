import fs from 'node:fs'

const workspace = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css', 'utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')

const checks = [
  ['workspace declares one desktop section-gap token', workspace.includes('--match-section-gap:16px;')],
  ['workspace declares one mobile section-gap token', workspace.includes('--match-section-gap-mobile:12px;')],
  ['workspace declares inner-gap token separately', workspace.includes('--match-inner-gap:12px;')],
  ['Nostra squadra is an explicit vertical stack', /\.match-squad-step\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*var\(--match-section-gap\)/.test(squad)],
  ['Avversario consumes the same desktop section gap', /\.match-opponent-step\s*\{[\s\S]*?gap:\s*var\(--match-section-gap\)/.test(opponent)],
  ['Nostra squadra command no longer owns external bottom margin', !/\.squad-command-strip[\s\S]{0,500}?margin:\s*0\s+auto\s+16px/.test(squad)],
  ['Nostra squadra bench no longer owns external top margin', !/\.bench-block--full-width[\s\S]{0,300}?margin:\s*16px\s+auto\s+0/.test(squad)],
  ['Nostra squadra consumes shared mobile gap', squad.includes('gap: var(--match-section-gap-mobile);')],
  ['Avversario consumes shared mobile gap', opponent.includes('gap: var(--match-section-gap-mobile);')],
  ['Avversario no longer hardcodes 24px outer rhythm', !/\.match-opponent-step\s*\{[\s\S]*?gap:\s*24px/.test(opponent)],
  ['core column gap remains internal and independent', squad.includes('grid-template-columns: repeat(2, minmax(0, 1fr));') && opponent.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['shared section rhythm does not use important overrides', !workspace.includes('--match-section-gap:16px!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`Match Section Spacing Contract: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
