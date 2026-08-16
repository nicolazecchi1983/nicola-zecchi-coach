import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const legacy = fs.readFileSync('src/modules/match/ui/matchSheet.css', 'utf8')
const pitchCss = fs.readFileSync('src/modules/match/ui/matchPitch.css', 'utf8')
const sharedTokenCss = fs.readFileSync('src/shared/ui/teamToken.css', 'utf8')

const hasUnscopedLegacy = (selector) => new RegExp(`(^|[}\n])\\.${selector.replaceAll('.', '\\.')}(?=[{:,])`, 'm').test(legacy)

const checks = [
  ['visual rebuild is the canonical current owner', css.includes('STAFF 0.29.11 — Nostra squadra · player-number + Soccer Board foundation')],
  ['starter progress indices remain removed from markup', !view.includes('lineup-index')],
  ['starter rows expose compact number input plus player selector only', view.includes('class="starter-number-input"') && view.includes('class="starter-player-select"') && (/grid-template-columns:\s*(?:6[0-9]|7[0-2])px\s+minmax\(0,\s*1fr\);/.test(css))],
  ['bench exposes only A disposizione title plus count', view.includes('<div class="bench-block-head"><h3>A disposizione</h3>') && !view.includes('PANCHINA AUTOMATICA') && !view.includes('bench-help')],
  ['leadership uses the same premium field family as formation controls', css.includes('.formation-system-control select,') && css.includes('.leadership-control select') && css.includes('min-height: 54px;')],
  ['leadership labels are clean field labels rather than badges', css.includes('.leadership-control > span {') && css.includes('text-transform: none;') && css.includes('.leadership-control > span::before {\n  content: none;')],
  ['shared pitch foundation owns approved grass material', pitchCss.includes("url('/assets/match-pitch-premium-real-natural-grass.webp')") && pitchCss.includes('background-size: 100% 100%')],
  ['approved grass and canonical svg split visual ownership correctly', pitchCss.includes('.match-pitch-svg') && pitchCss.includes("background-image: url('/assets/match-pitch-premium-real-natural-grass.webp')")],
  ['native tokens consume configured team colors through shared renderer', view.includes('--staff-token-primary') && view.includes('--staff-token-secondary') && sharedTokenCss.includes('--staff-token-primary-resolved')],
  ['native tokens own drag and focus presentation', css.includes('.player-token.is-dragging') && css.includes('.player-token:focus-visible .token-photo')],
  ['legacy Match Sheet no longer owns native pitch selectors globally', !hasUnscopedLegacy('football-pitch') && !hasUnscopedLegacy('player-token') && !hasUnscopedLegacy('token-photo') && !hasUnscopedLegacy('pitch-goal')],
  ['legacy Match Sheet no longer owns native lineup rows globally', !hasUnscopedLegacy('lineup-row')],
  ['native field keeps contextual reset in its header', view.indexOf('data-reset-formation') > view.indexOf('pitch-panel-head') && view.indexOf('data-reset-formation') < view.indexOf('data-football-pitch')],
  ['visual rebuild adds no important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Visual System Rebuild: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
