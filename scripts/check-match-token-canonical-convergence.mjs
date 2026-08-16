import fs from 'node:fs'

const shared = fs.readFileSync('src/shared/ui/teamToken.css','utf8')
const markup = fs.readFileSync('src/modules/match/ui/matchTokenMarkup.js','utf8')
const squadView = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const opponentView = fs.readFileSync('src/modules/match/ui/matchOpponentView.js','utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css','utf8')
const events = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')

const checks = [
  ['canonical token markup helper owns shell anatomy', markup.includes('matchTokenShellHtml') && markup.includes('staff-match-token__shell') && markup.includes('staff-match-token__number')],
  ['own team uses canonical token helper', squadView.includes('matchTokenShellHtml') && squadView.includes('staff-match-token token-')],
  ['opponent uses canonical token helper', opponentView.includes('matchTokenShellHtml') && opponentView.includes('opponent-token staff-match-token')],
  ['both contexts expose generic staff token pattern', squadView.includes('data-staff-token-pattern') && opponentView.includes('data-staff-token-pattern="solid"')],
  ['shared renderer owns solid appearance', shared.includes('.staff-match-token__shell') && shared.includes('--staff-token-primary-resolved')],
  ['shared renderer owns vertical kit pattern', shared.includes('[data-staff-token-pattern="vertical"] .staff-match-token__shell')],
  ['shared renderer owns horizontal kit pattern', shared.includes('[data-staff-token-pattern="horizontal"] .staff-match-token__shell')],
  ['own consumer does not own kit gradients', !squadCss.includes('repeating-linear-gradient')],
  ['opponent field token does not own kit gradients', !opponentCss.includes('.match-opponent-step .opponent-token {\n  background:')],
  ['own runtime preserves canonical shell and updates number node only', events.includes("querySelector('.staff-match-token__number')") && !events.includes('badge.textContent = showPhoto')],
  ['opponent runtime updates generic pattern on native step', events.includes('opponentStep.dataset.staffTokenPattern = pattern')],
  ['shared renderer owns hover shell response', shared.includes('.staff-match-token:hover .staff-match-token__shell')],
  ['shared renderer owns dragging shell response', shared.includes('.staff-match-token.is-dragging .staff-match-token__shell')],
  ['consumer CSS retains positioning rather than physical shell', squadCss.includes('.match-squad-step .player-token {') && opponentCss.includes('.match-opponent-step .opponent-token {')],
  ['field token canonical size remains centralized', shared.includes('--staff-token-size: 36px;')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed++
}
console.log(`\nMatch Token Canonical Convergence: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
