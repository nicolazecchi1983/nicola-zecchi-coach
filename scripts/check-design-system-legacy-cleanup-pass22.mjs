import fs from 'node:fs'

const legacy = fs.readFileSync('src/style.css','utf8')
const sheet = fs.readFileSync('src/modules/match/ui/matchSheet.css','utf8')
const main = fs.readFileSync('src/main.js','utf8')
const training = fs.readFileSync('src/design-system/training-editor.css','utf8')

const checks = [
  ['legacy V6.4 Match Sheet generations removed from style.css', !/V6\.4(?:\.\d)?\s*[—-]\s*Match Sheet|V6\.4\.\d/.test(legacy)],
  ['legacy style no longer owns opponent formations panel', !legacy.includes('.opponent-formations-panel')],
  ['legacy style no longer owns report lineup presentation', !legacy.includes('.report-lineup-layout')],
  ['legacy style no longer owns Match Sheet pitch goals', !legacy.includes('.pitch-goal')],
  ['Match Sheet owner contains migrated compatibility marker', sheet.includes('Legacy Match Sheet compatibility presentation migrated from style.css in 0.27.35')],
  ['native opponent presentation migrated out of Match Sheet compatibility owner', !sheet.includes('.opponent-formations-panel') && !sheet.includes('.opponent-football-pitch')],
  ['Match Sheet owner contains report paper compatibility styles', sheet.includes('.match-report-hero') && sheet.includes('.report-lineup-layout')],
  ['Match Sheet owner contains formation/pitch compatibility styles', sheet.includes('.pitch-goal') && sheet.includes('.formation-toolbar--pro')],
  ['Training watermark remains outside Match CSS and is owned by Training', training.includes('.ts-watermark') && !legacy.includes('.ts-watermark') && !sheet.includes('.ts-watermark>')],
  ['Match Sheet owner is imported', main.includes("import './modules/match/ui/matchSheet.css'")],
  ['canonical Match Squad remains separate owner', main.includes("import './modules/match/ui/matchSquad.css'")],
  ['canonical Opponent Study remains separate owner', main.includes("import './modules/match/ui/matchOpponentStudy.css'")],
  ['canonical native Opponent has dedicated owner', main.includes("import './modules/match/ui/matchOpponent.css'")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed++
}
console.log(`DS Legacy Cleanup Pass 22: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
