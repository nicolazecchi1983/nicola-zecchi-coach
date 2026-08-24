import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')

const layer = responsive.slice(responsive.indexOf('M1.3F — MATCH TEAM MOBILE WIDTH'))

const checks = [
  ['captain and vice use canonical dropdown hooks', view.includes('data-leadership-select="captain"') && view.includes('data-leadership-select="vice_captain"')],
  ['captain and vice have explicit labels', view.includes('<span>Capitano</span>') && view.includes('<span>Vicecapitano</span>')],
  ['gold captain presentation removed', !squadCss.includes('#4b3b0d') && !squadCss.includes('#9b7b20') && !squadCss.includes('#ffe99a')],
  ['native team work surface reclaims nested mobile padding', layer.includes('--match-mobile-content-bleed') && layer.includes('.match-native-section .match-native-legacy-host')],
  ['own-team pitch uses full mobile width from domain owner', squadCss.includes('@media (max-width: 760px)') && squadCss.includes('.match-squad-step .pitch-panel [data-football-pitch]') && !layer.includes('.match-squad-step .pitch-panel [data-football-pitch]')],
  ['opponent pitch responsive geometry is domain-owned', opponentCss.includes('@media (max-width: 980px)') && opponentCss.includes('.opponent-core-layout { grid-template-columns: 1fr; }')],
  ['own-team marker keeps canonical mobile size variable', layer.includes('--match-mobile-token-size')],
  ['opponent marker mobile sizing is domain-owned', opponentCss.includes('@media (max-width: 760px)') && opponentCss.includes('.match-opponent-step .opponent-token')],
  ['opponent appearance uses progressive disclosure instead of persistent mobile palette', opponentCss.includes('.opponent-appearance-disclosure') && opponentCss.includes('.opponent-appearance-popover')],
  ['opponent style fields remain canonical', contract.includes('existing persisted primary/secondary/pattern fields')],
  ['Match domain and persistence remain untouched', contract.includes('no Match persistence, route, permission, formation model or report schema is changed')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nM1.3F Match Team Mobile Width: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
