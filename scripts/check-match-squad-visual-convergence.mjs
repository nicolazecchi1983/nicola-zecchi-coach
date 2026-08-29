import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const tokenCss = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css', 'utf8')
const tokenComponent = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.js', 'utf8')
const pitchCss = fs.readFileSync('src/modules/match/ui/matchPitch.css', 'utf8')
const pitchMarkup = fs.readFileSync('src/modules/match/ui/matchPitchMarkup.js', 'utf8')

const checks = [
  ['token display has a shared compact component anatomy', view.includes('tokenDisplayControlHtml') && tokenComponent.includes('match-token-display__label') && tokenComponent.includes('match-token-display__options')],
  ['primary command gives compact content display its own field column', /grid-template-columns:\s*minmax\(240px, 1fr\) minmax\(240px, 1fr\) minmax\(320px, 1\.08fr\);/.test(css)],
  ['token display keeps canonical field height without a nested full-size surface', tokenCss.includes('min-height: 54px;') && tokenCss.includes('height: 54px;') && tokenCss.includes('.match-token-toggle') && tokenCss.includes('height: 40px;')],
  ['command controls share one canonical border/background treatment', css.includes('border-color: var(--staff-color-border);') && css.includes('background: var(--staff-color-bg-control);')],
  ['content display moves as a field at tablet breakpoint', css.includes('.token-display-field { grid-column: 1 / -1; }')],
  ['starter identity receives remaining row width', /grid-template-columns:\s*64px\s+minmax\(0,\s*1fr\);/.test(css)],
  ['starter number remains a compact match input', view.includes('class="starter-number-input"') && css.includes('width: 64px;')],
  ['desktop lineup reserves readable width for player names and leadership', css.includes('grid-template-columns: 64px minmax(0, 1fr);') && css.includes('.lineup-list--selection .lineup-leadership {') && css.includes('grid-template-columns: minmax(0, 1fr);')],
  ['pitch uses approved grass material with canonical vector geometry', pitchCss.includes("url('/assets/match-pitch-premium-real-natural-grass.webp')") && pitchCss.includes('background-size: 100% 100%')],
  ['vector markings are canonical svg geometry', pitchMarkup.includes('class="match-pitch-svg"') && pitchCss.includes('.match-pitch-svg')],
  ['pitch geometry remains canonical', pitchCss.includes('aspect-ratio: 68 / 105')],
  ['visual convergence adds no important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Visual Convergence: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
