import fs from 'node:fs'

const legacy = fs.readFileSync('src/style.css','utf8')
const workspace = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')
const stats = fs.readFileSync('src/modules/match/ui/matchStatistics.css','utf8')
const main = fs.readFileSync('src/main.js','utf8')

const checks = [
  ['canonical workspace owner contains legacy workspace header', workspace.includes('.match-workspace-header')],
  ['canonical workspace owner contains workflow tabs', workspace.includes('.match-workspace-tabs')],
  ['canonical workspace owner contains shared match context geometry', workspace.includes('.match-context-page-head') && workspace.includes('.match-context-back')],
  ['canonical workspace owner neutralizes native compatibility geometry', workspace.includes('runtime compatibility remains; page geometry does not.') && workspace.includes('.match-native-surface .match-editor')],
  ['statistics owner exists', stats.includes('.match-statistics') && stats.includes('.match-stat-summary')],
  ['statistics owner contains sanctions presentation', stats.includes('.match-sanction-totals') && stats.includes('.match-sanction-breakdown')],
  ['legacy style no longer owns Match Workspace presentation', !/\.match-workspace(?:\s|[-:{])/.test(legacy)],
  ['legacy style no longer owns Match context geometry', !legacy.includes('.match-context-page-head') && !legacy.includes('.match-context-back')],
  ['legacy style no longer owns Match Statistics', !legacy.includes('.match-statistics') && !legacy.includes('.match-stat-card') && !legacy.includes('.match-sanction-total')],
  ['workspace owner is imported', main.includes("import './modules/match/workspace/matchWorkspace.css'")],
  ['statistics owner is imported', main.includes("import './modules/match/ui/matchStatistics.css'")],
  ['statistics owner loads before shared product/page layers', main.indexOf('matchStatistics.css') < main.indexOf("./design-system/productUi.css")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed++
}
console.log(`DS Legacy Cleanup Pass 21: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
