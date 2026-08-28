import fs from 'node:fs'

const events = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')

const checks = [
  ['eleven token shells remain in canonical pitch markup', (view.match(/data-player-token=/g) || []).length === 1 && view.includes('Array.from({ length: 11 }')],
  ['runtime never hides token shell from display toggles', events.includes('badge.hidden = false') && !events.includes('badge.hidden = !showPhoto && !showNumber')],
  ['number/photo affect canonical token content only', events.includes("querySelector('.staff-match-token__number')") && events.includes('tokenNumber.textContent = showPhoto')],
  ['surname visibility remains independent', events.includes('label.hidden = !showSurname')],
  ['empty-content state is explicit rather than invisible', events.includes("token.classList.toggle('is-token-content-empty', !showPhoto && !showNumber)")],
  ['empty token keeps visible visual marker', css.includes('.player-token.is-token-content-empty .token-photo::after')],
  ['token shell remains absolutely positioned on pitch', css.includes('.match-squad-step .player-token {') && css.includes('position: absolute;')],
  ['token shell remains above pitch markings', css.includes('z-index: 4;')],
  ['visibility invariant does not alter drag runtime', events.includes("token.classList.remove('is-dragging')")],
  ['visibility invariant preserves one-way player-number semantics',
    events.includes('const syncStarterNumberFromPlayer =') &&
    !events.includes('const syncStarterPlayerFromNumber =') &&
    !events.includes('syncStarterPlayerFromNumber(Number(numberMatch[1]))')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Token Visibility Invariant: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
