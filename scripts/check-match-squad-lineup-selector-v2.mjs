import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const view = read('src/modules/match/ui/matchSquadView.js')
const squadCss = read('src/modules/match/ui/matchSquad.css')
const legacyCss = read('src/modules/match/ui/matchSheet.css')
const rosterView = read('src/modules/roster/ui/rosterModalViews.js')
const rosterCss = read('src/modules/roster/roster.css')
const events = read('src/modules/match/events/legacyMatchEditorEvents.js')

const checks = [
  ['starter number is compact numeric input', /class="starter-number-input"[\s\S]*inputmode="numeric"/.test(view)],
  ['starter number no longer uses native 1-99 select', !/class="starter-number-select"/.test(view)],
  ['player selector remains separate identity control', /class="starter-player-select"/.test(view)],
  ['runtime binds number inputs', /input\[name\^="starter_number_"\]/.test(events)],
  ['number-to-player sync remains active', /syncStarterPlayerFromNumber/.test(events)],
  ['player-to-number sync remains active', /syncStarterNumberFromPlayer/.test(events)],
  ['native lineup owns compact-number plus flexible-player geometry', /grid-template-columns:\s*(?:6[0-9]|7[0-2])px\s+minmax\(0,\s*1fr\)/.test(squadCss)],
  ['legacy lineup important rule excludes native squad', /\.match-step:not\(\.match-squad-step\) \.lineup-row\{grid-template-columns:38px 70px minmax\(0,1fr\)!important\}/.test(legacyCss)],
  ['roster modal v2 markup exists', /roster-player-form--v2/.test(rosterView)],
  ['shirt number optional badge exists', /roster-field-label-row[\s\S]*Opzionale/.test(rosterView)],
  ['old multiline shirt helper removed', !/STAFF lo propone automaticamente nelle formazioni/.test(rosterView)],
  ['roster modal has domain visual owner', /Roster Player Modal v2/.test(rosterCss)],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Lineup Selector v2: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
