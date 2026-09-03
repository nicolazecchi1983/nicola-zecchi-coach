import fs from 'node:fs'

const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8').replace(/\r\n/g, '\n')
const stats = fs.readFileSync('src/modules/match/ui/matchStatistics.css', 'utf8').replace(/\r\n/g, '\n')
const statsView = fs.readFileSync('src/modules/match/ui/matchStatisticsView.js', 'utf8').replace(/\r\n/g, '\n')
const analysisView = fs.readFileSync('src/modules/match/ui/matchAnalysisView.js', 'utf8').replace(/\r\n/g, '\n')
const studyView = fs.readFileSync('src/modules/match/ui/matchOpponentStudyView.js', 'utf8').replace(/\r\n/g, '\n')
const main = fs.readFileSync('src/main.js', 'utf8').replace(/\r\n/g, '\n')

const marker = 'Post-R2.9S — Match Statistics mobile surface geometry is domain-owned.'
const start = stats.indexOf(marker)
const owned = start >= 0 ? stats.slice(start) : ''

const reportLateContract =
  /\.match-report-workspace-preview\s*\{\s*width:\s*100%\s*!important;\s*max-width:\s*none\s*!important;\s*min-width:\s*0\s*!important;\s*margin-inline:\s*0\s*!important;\s*box-sizing:\s*border-box;\s*\}/s

const checks = [
  ['runtime Statistics root is the standalone content-section owner',
    statsView.includes('class="content-section match-statistics"')],
  ['Analysis runtime class proves retired global selector was dead',
    analysisView.includes("className: 'analysis-view'") && !analysisView.includes("className: 'match-analysis-view'")],
  ['Opponent Study runtime class proves retired global selector was dead',
    studyView.includes("className: 'match-opponent-study'") && !studyView.includes("className: 'match-opponent-study-view'")],
  ['global responsive no longer contains dead match-analysis-view selector',
    !responsive.includes('.match-analysis-view')],
  ['global responsive no longer contains dead match-opponent-study-view selector',
    !responsive.includes('.match-opponent-study-view')],
  ['global responsive no longer owns match-statistics root geometry',
    !/(^|,|\s)\.match-statistics(?:\s|,|\{)/m.test(responsive)],
  ['global responsive preserves Match Report late width contract unchanged in intent',
    reportLateContract.test(responsive)],
  ['Statistics domain owner marker exists', start >= 0],
  ['Statistics domain owner is bounded to 760px',
    owned.includes('@media (max-width: 760px)')],
  ['Statistics domain owner preserves width contract',
    /\.match-statistics\s*\{\s*width:\s*100%\s*!important;\s*max-width:\s*none\s*!important;\s*min-width:\s*0\s*!important;\s*margin-inline:\s*0\s*!important;\s*box-sizing:\s*border-box;\s*\}/s.test(owned)],
  ['Statistics owner loads before final responsive layer',
    main.indexOf('matchStatistics.css') >= 0 &&
    main.indexOf('matchStatistics.css') < main.indexOf('responsive.css')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed++
}
console.log(`Post-R2.9S Match Statistics Mobile Owner Convergence: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
