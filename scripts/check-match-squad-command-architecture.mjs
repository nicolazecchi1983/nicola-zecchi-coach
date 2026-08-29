import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const tokenCss = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css', 'utf8')

const commandStart = view.indexOf('data-squad-command-strip')
const pitchStart = view.indexOf('<div class="pitch-panel">')
const resetStart = view.indexOf('data-reset-formation')
const lineupStart = view.indexOf('lineup-list lineup-list--selection')
const benchStart = view.indexOf('bench-block bench-block--automatic bench-block--full-width')

const checks = [
  ['command strip has one explicit structural owner', commandStart >= 0 && view.includes('squad-command-strip')],
  ['formation configuration has a dedicated primary group', view.includes('data-squad-command-primary')],
  ['leadership is owned by the lineup column', view.includes('data-lineup-leadership') && !view.includes('data-squad-command-leadership')],
  ['captain and vice fields remain canonical', view.includes('name="captain"') && view.includes('name="vice_captain"')],
  ['reset action is outside command strip and inside pitch panel', resetStart > pitchStart && resetStart < lineupStart && view.slice(commandStart, pitchStart).indexOf('data-reset-formation') === -1],
  ['pitch panel exposes a contextual header for field actions', view.includes('pitch-panel-head') && view.includes('Campo di gioco')],
  ['pitch and starters remain sibling operational surfaces', pitchStart >= 0 && lineupStart > pitchStart],
  ['leadership sits inside starters surface before XI rows', view.indexOf('data-lineup-leadership') > lineupStart && view.indexOf('data-lineup-leadership') < view.indexOf('class="lineup-selection-list"')],
  ['command strip no longer contains captain or vice', view.slice(commandStart, pitchStart).indexOf('data-leadership-select') === -1],
  ['bench remains autonomous after master operational row', benchStart > lineupStart],
  ['lineup leadership uses equal two-column geometry', css.includes('.lineup-list--selection .lineup-leadership {') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['all command fields share the canonical 54px rhythm', css.includes('.formation-system-control select,') && css.includes('.formation-custom-control input,') && css.includes('.leadership-control select') && css.includes('height: 54px;') && tokenCss.includes('height: 54px;')],
  ['reset is a compact contextual secondary action', css.includes('.formation-reset-button--field') && css.includes('height: 36px;')],
  ['canonical command block adds no important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Command Architecture: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
