import fs from 'node:fs'

const pitch = fs.readFileSync('src/modules/match/ui/matchPitch.css', 'utf8')
const markup = fs.readFileSync('src/modules/match/ui/matchPitchMarkup.js', 'utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const asset = 'public/assets/match-pitch-premium-real-natural-grass.webp'

const checks = [
  ['1 approved grass material exists', fs.existsSync(asset) && fs.statSync(asset).size > 350000],
  ['2 own team uses canonical pitch', squad.includes('class="staff-match-pitch" data-football-pitch')],
  ['3 opponent uses canonical pitch', opponent.includes('opponent-football-pitch staff-match-pitch')],
  ['4 grass-only asset is the single raster surface', pitch.includes("url('/assets/match-pitch-premium-real-natural-grass.webp')") && !pitch.includes("url('/assets/match-pitch-premium-real-natural.webp')")],
  ['5 geometry is an SVG with physical 68x105 viewBox', markup.includes('viewBox="0 0 68 105"') && pitch.includes('aspect-ratio: 68 / 105')],
  ['6 centre circle is mathematically circular', markup.includes('class="pitch-centre-circle" cx="34" cy="52.5" r="9.15"')],
  ['7 penalty geometry uses regulation dimensions', markup.includes('width="40.32" height="16.5"') && markup.includes('width="18.32" height="5.5"')],
  ['8 own-team and opponent consumers cannot repaint pitch', !/\[data-football-pitch\]\s*\{[^}]*background:/s.test(squadCss) && !/\.opponent-football-pitch\s*\{[^}]*background:/s.test(opponentCss)],
  ['9 goals remain shallow and vector-owned', markup.includes('width="7.32" height="1.55"') && markup.includes('match-pitch-goal')],
  ['10 interaction hooks remain untouched', squad.includes('data-football-pitch') && opponent.includes('data-opponent-pitch')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\n10 CONTROLLI MATCH PITCH: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
