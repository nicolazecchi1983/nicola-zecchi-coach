import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const events = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const architecture = fs.readFileSync('docs/MATCH_OPPONENT_V2_ARCHITECTURE.md', 'utf8')

const checks = [
  ['command surface has explicit 50/50 grid', view.includes('opponent-command-grid') && css.includes('.opponent-command-grid') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')],
  ['initial system remains left command responsibility', view.includes('opponent-initial-system-control') && view.includes('name="opponent_system_0"')],
  ['right command responsibility is real opponent token appearance', view.includes('opponent-token-appearance-control') && view.includes('Aspetto pedine')],
  ['opponent number visibility is a real persisted form control', view.includes('name="opponent_token_number"') && events.includes('form.elements.opponent_token_number')],
  ['opponent number visibility never hides the token shell', events.includes("token.classList.toggle('is-number-hidden', !showNumber)") && css.includes('.is-number-hidden .opponent-token-number')],
  ['appearance includes compact live preview', view.includes('opponent-token-mini-preview') && css.includes('.opponent-token-mini-preview')],
  ['color palette remains progressive disclosure', view.includes('<details class="opponent-appearance-disclosure">') && view.includes('＋ Cambia colori')],
  ['color popover is compact and anchored', css.includes('width: min(360px, 88vw)') && css.includes('position: absolute') && css.includes('right: 0')],
  ['color popover does not own page-flow geometry', !css.includes('.opponent-appearance-popover {\n  position: static')],
  ['field header no longer duplicates color action', !view.match(/opponent-field-panel[\s\S]{0,500}<summary>＋ Cambia colori<\/summary>/)],
  ['field and sheet remain exact desktop 50/50 core', css.includes('.opponent-core-layout') && css.match(/\.opponent-core-layout[\s\S]{0,180}grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)],
  ['architecture records command and appearance responsibilities', architecture.includes('Command 50/50') && architecture.includes('number visibility') && architecture.includes('compact popover')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`Match Opponent Command & Appearance Architecture: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
