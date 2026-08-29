import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const analysisView = fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js', 'utf8')

const checks = [
  ['opponent step owns explicit vertical rhythm', css.includes('.match-opponent-step {') && css.includes('gap: var(--match-section-gap)')],
  ['opponent root is layout-only, not a second page surface', /\.match-opponent-step\s*\{[\s\S]*?padding:\s*0[\s\S]*?border-radius:\s*0/.test(css) && !/@media \(max-width: 680px\)\s*\{[\s\S]*?\.match-opponent-step\s*\{[^}]*padding\s*:/.test(css)],
  ['command surface shares canonical max width', css.includes('.opponent-command-surface { width:100%; max-width:1420px; margin:0 auto;')],
  ['core shares canonical max width', css.includes('.opponent-core-layout {') && css.includes('max-width:1420px')],
  ['reading shares canonical max width', css.includes('.opponent-reading-surface { width:100%; max-width:1420px; margin:0 auto;')],
  ['appearance control uses its full half width', css.includes('grid-template-columns: auto 44px minmax(0, 1fr)')],
  ['appearance action is aligned to the far edge', css.includes('.opponent-appearance-disclosure { position: relative; min-width: 0; justify-self:end; }')],
  ['reading has one canonical visible title', view.includes('<h3>Lettura avversario</h3>') && !view.includes('Variazioni sistema') && !view.includes('<span class="opponent-kicker">LETTURA</span>')],
  ['system-change action remains in reading header', view.includes('opponent-reading-header') && view.includes('data-add-opponent-formation')],
  ['analysis editor supports intro suppression structurally', analysisView.includes('showIntro = true') && analysisView.includes('showIntro ? `<div class="analysis-schema-intro">')],
  ['opponent disables duplicate analysis intro without css hiding', view.includes('showIntro: false') && !css.includes('.analysis-schema-intro{display:none') && !css.includes('.analysis-schema-intro { display: none')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`Match Opponent Simplified Structure: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
