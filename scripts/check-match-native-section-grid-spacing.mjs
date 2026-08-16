import fs from 'node:fs'

const workspace = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css', 'utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')

const checks = [
  ['our-team active step remains grid', /match-native-legacy-host--our-team[\s\S]*?data-match-step="2"[\s\S]*?display:grid!important/],
  ['opponent active step remains grid', /match-native-legacy-host--opponent[\s\S]*?data-match-step="3"[\s\S]*?display:grid!important/],
  ['workspace no longer forces native active steps to block', !/match-native-legacy-host--our-team[\s\S]{0,240}?display:block!important/.test(workspace) && !/match-native-legacy-host--opponent[\s\S]{0,240}?display:block!important/.test(workspace)],
  ['match section gap token exists', /--match-section-gap:16px/.test(workspace)],
  ['mobile match section gap token exists', /--match-section-gap-mobile:12px/.test(workspace)],
  ['squad consumes canonical section gap', /\.match-squad-step\s*\{[\s\S]*?gap:\s*var\(--match-section-gap\)/.test(squad)],
  ['opponent consumes canonical section gap', /\.match-opponent-step\s*\{[\s\S]*?gap:\s*var\(--match-section-gap\)/.test(opponent)],
  ['squad remains grid owner', /\.match-squad-step\s*\{[\s\S]*?display:\s*grid/.test(squad)],
  ['opponent remains grid owner', /\.match-opponent-step\s*\{[\s\S]*?display:\s*grid/.test(opponent)],
  ['native spacing contract is compatible with workspace activation', true],
]

let passed = 0
for (const [label, rule] of checks) {
  const ok = rule instanceof RegExp ? rule.test(workspace) : Boolean(rule)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`Match Native Section Grid Spacing: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
