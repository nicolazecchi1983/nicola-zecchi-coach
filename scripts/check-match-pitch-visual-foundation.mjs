import fs from 'node:fs'
const main = fs.readFileSync('src/main.js','utf8')
const shared = fs.readFileSync('src/modules/match/ui/matchPitch.css','utf8')
const markup = fs.readFileSync('src/modules/match/ui/matchPitchMarkup.js','utf8')
const squadView = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const oppView = fs.readFileSync('src/modules/match/ui/matchOpponentView.js','utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const oppCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css','utf8')
const checks = [
 ['shared pitch css imported', main.includes("import './modules/match/ui/matchPitch.css'")],
 ['own team consumes only canonical pitch', squadView.includes('class="staff-match-pitch" data-football-pitch')],
 ['opponent consumes canonical pitch', oppView.includes('opponent-football-pitch staff-match-pitch')],
 ['approved grass-only material is canonical surface', shared.includes("url('/assets/match-pitch-premium-real-natural-grass.webp')")],
 ['grass material fills canonical ratio', shared.includes('background-size: 100% 100%') && shared.includes('aspect-ratio: 68 / 105')],
 ['vector geometry is active and singular', markup.includes('class="match-pitch-svg"') && shared.includes('.match-pitch-svg')],
 ['centre circle uses physical radius 9.15', markup.includes('class="pitch-centre-circle" cx="34" cy="52.5" r="9.15"')],
 ['squad does not own pitch background', !/\[data-football-pitch\]\s*\{[^}]*background:/s.test(squadCss)],
 ['opponent does not own pitch background', !/\.opponent-football-pitch\s*\{[^}]*background:/s.test(oppCss)],
]
for (const [label,ok] of checks) console.log(`${ok?'✓':'✗'} ${label}`)
const failed=checks.filter(([,ok])=>!ok)
console.log(`\nMatch Pitch Visual Foundation: ${checks.length-failed.length}/${checks.length}`)
if(failed.length) process.exit(1)
