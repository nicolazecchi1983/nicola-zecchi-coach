import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const style = fs.readFileSync('src/style.css', 'utf8')
const teamSettings = fs.readFileSync('src/modules/settings/teamSettings.css', 'utf8')
const report = fs.readFileSync('src/modules/match/ui/matchReportWorkspace.css', 'utf8')
const postMatch = fs.readFileSync('src/modules/match/ui/matchPostMatch.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['legacy marks Facilities migration', style.includes('Team Facilities ownership migrated to src/modules/settings/teamSettings.css in 0.27.41')],
  ['legacy no longer owns Facilities selectors', !style.includes('.team-facilities-field') && !style.includes('.team-facility-row')],
  ['Team Settings owns Facilities presentation', teamSettings.includes('Team Facilities canonical owner') && teamSettings.includes('.team-facilities-field')],
  ['legacy marks Match Report migration', style.includes('Match Report Workspace ownership migrated to src/modules/match/ui/matchReportWorkspace.css in 0.27.41')],
  ['legacy no longer owns Match Report workspace', !style.includes('.match-report-workspace-toolbar') && !style.includes('.match-report-workspace-preview')],
  ['Match Report owner preserves responsive contract', report.includes('.match-report-workspace-toolbar') && report.includes('@media(max-width:760px)')],
  ['legacy marks Post gara migration', style.includes('Post gara ownership migrated to src/modules/match/ui/matchPostMatch.css in 0.27.41')],
  ['legacy no longer owns Post gara', !style.includes('.match-post-match-view') && !style.includes('.post-match-status-row')],
  ['Post gara owner preserves accordion sections and responsive contract', postMatch.includes('.post-match-section') && postMatch.includes('@media(max-width:760px)')],
  ['Match presentation owners load before Match Workspace canonical polish', main.indexOf("./modules/match/ui/matchReportWorkspace.css") < main.indexOf("./modules/match/workspace/matchWorkspace.css") && main.indexOf("./modules/match/ui/matchPostMatch.css") < main.indexOf("./modules/match/workspace/matchWorkspace.css")],
  ['Facilities remains in settings domain', !report.includes('team-facilit') && !postMatch.includes('team-facilit')],
  ['Pass 28 is in aggregate gate', releaseGateIncludes(packageJson, 'check:design-system-legacy-cleanup-pass28')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 28: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
