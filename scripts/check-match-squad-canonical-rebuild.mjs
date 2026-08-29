import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const globalCss = fs.readFileSync('src/style.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const pitchCss = fs.readFileSync('src/modules/match/ui/matchPitch.css', 'utf8')

const command = view.indexOf('data-squad-command-strip')
const leadership = view.indexOf('data-lineup-leadership')
const master = view.indexOf('match-lineup-layout--master')
const pitch = view.indexOf('<div class="pitch-panel">')
const pitchHead = view.indexOf('pitch-panel-head')
const reset = view.indexOf('data-reset-formation')
const starters = view.indexOf('lineup-list lineup-list--selection')
const bench = view.indexOf('bench-block bench-block--automatic bench-block--full-width')

const oldMarkers = ['0.29.4 —', '0.29.5 —', '0.29.6 —', '0.29.7 —', '0.29.8 —', '0.29.9 —']

const checks = [
  ['canonical rebuild marker is the single current generation', css.includes('STAFF 0.29.11 — Nostra squadra · player-number + Soccer Board foundation') && oldMarkers.every((marker) => !css.includes(marker))],
  ['command precedes the operational core and bench', command >= 0 && master > command && starters > master && leadership > starters && bench > leadership],
  ['configuration and leadership have separate structural owners', view.includes('data-squad-command-primary') && view.includes('data-lineup-leadership') && !view.includes('data-squad-command-leadership')],
  ['pitch and starters are siblings in the master row', pitch > master && starters > pitch && starters < bench],
  ['pitch header owns reset before the football pitch', pitchHead > pitch && reset > pitchHead && reset < view.indexOf('data-football-pitch', pitch)],
  ['pitch panel is explicitly vertical so header sits above field', css.includes('.match-squad-step .pitch-panel {\n  min-width: 0;\n  display: flex;\n  flex-direction: column;')],
  ['desktop command uses three configuration columns with compact token-display allocation', css.includes('minmax(220px, 1fr) minmax(220px, 1fr) minmax(310px, 1.08fr)')],
  ['lineup leadership owns one premium role per row', css.includes('.lineup-list--selection .lineup-leadership {') && css.includes('grid-template-columns: minmax(0, 1fr);') && css.includes('.leadership-role-badge') && css.includes('.leadership-control select')],
  ['field retains vertical football aspect ratio via shared pitch foundation', pitchCss.includes('aspect-ratio: 68 / 105')],
  ['bench is full-width and three-column on desktop', css.includes('.bench-block--full-width') && css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))')],
  ['tablet and mobile layouts are explicit', css.includes('@media (max-width: 1180px)') && css.includes('@media (max-width: 980px)') && css.includes('@media (max-width: 760px)')],
  ['global style no longer owns squad command geometry', !globalCss.includes('.match-squad-step .formation-toolbar--single-row') && !globalCss.includes('.match-squad-step .token-display-options') && !globalCss.includes('.match-squad-step .leadership-selectors')],
  ['responsive final layer no longer owns leadership geometry', !responsive.includes('.match-squad-step .leadership-control') && !responsive.includes('.match-squad-step .leadership-badges')],
  ['canonical owner does not escalate specificity with important', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Canonical Rebuild: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
