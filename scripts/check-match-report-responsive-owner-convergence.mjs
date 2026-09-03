import fs from 'node:fs'

const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8').replace(/\r\n/g, '\n')
const report = fs.readFileSync('src/modules/match/ui/matchReportWorkspace.css', 'utf8').replace(/\r\n/g, '\n')
const view = fs.readFileSync('src/modules/match/ui/matchReportWorkspaceView.js', 'utf8').replace(/\r\n/g, '\n')
const shell = fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8').replace(/\r\n/g, '\n')
const main = fs.readFileSync('src/main.js', 'utf8').replace(/\r\n/g, '\n')

const marker = 'Post-R2.9S — Match Report mobile workspace geometry is domain-owned.'
const markerIndex = report.indexOf(marker)
const owned = markerIndex >= 0 ? report.slice(markerIndex) : ''

const checks = [
  ['runtime Report uses canonical Match Workspace shell',
    view.includes('matchWorkspaceShellHtml') && view.includes("className: 'match-report-workspace'")],
  ['runtime preview selector is real',
    view.includes('class="match-report-workspace-preview"')],
  ['canonical Match Workspace shell remains structural owner',
    shell.includes("'match-workspace-shell'") && shell.includes('match-workspace-shell__content')],
  ['global responsive no longer owns workspace preview selector',
    !responsive.includes('.match-report-workspace-preview')],
  ['global responsive still owns dialog preview padding',
    /\.match-report-dialog-body\s*\{\s*padding-inline:\s*0\s*!important;\s*\}/s.test(responsive)],
  ['global responsive still owns dialog paper mobile geometry',
    /\.match-report-dialog-body \.match-report-paper\s*\{\s*width:\s*100%\s*!important;\s*max-width:\s*none\s*!important;\s*min-width:\s*0\s*!important;\s*padding:\s*20px 16px\s*!important;\s*box-shadow:\s*none\s*!important;\s*\}/s.test(responsive)],
  ['shared report bench compact rule remains global',
    /\.match-report-paper \.report-bench-strip\s*\{\s*grid-template-columns:\s*1fr\s*!important;/s.test(responsive)],
  ['domain owner marker exists', markerIndex >= 0],
  ['domain owner keeps canonical 760 breakpoint',
    owned.includes('@media(max-width:760px)')],
  ['domain owner owns workspace viewport geometry',
    /\.match-report-workspace-preview\s*\{\s*width:\s*100%\s*!important;\s*max-width:\s*none\s*!important;\s*min-width:\s*0\s*!important;\s*margin-inline:\s*0\s*!important;\s*box-sizing:\s*border-box;\s*padding:\s*12px;\s*padding-inline:\s*0\s*!important;\s*\}/s.test(owned)],
  ['domain owner owns workspace paper mobile geometry',
    /\.match-report-workspace-preview \.match-report-paper\s*\{\s*width:\s*100%\s*!important;\s*max-width:\s*none\s*!important;\s*min-width:\s*0\s*!important;\s*padding:\s*20px 16px\s*!important;\s*box-shadow:\s*none\s*!important;\s*\}/s.test(owned)],
  ['Match Report owner loads before final responsive layer',
    main.indexOf('matchReportWorkspace.css') >= 0 &&
    main.indexOf('matchReportWorkspace.css') < main.indexOf('responsive.css')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed++
}
console.log(`Post-R2.9S Match Report Responsive Owner Convergence: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
