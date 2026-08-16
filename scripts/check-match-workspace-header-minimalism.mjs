import fs from 'node:fs'

const shell = fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8')
const workflow = fs.readFileSync('src/modules/match/matchWorkflowModel.js', 'utf8')

const checks = [
  ['canonical Match shell keeps eyebrow and title', shell.includes('match-workspace-shell__eyebrow') && shell.includes('<h1>${titleHtml}</h1>')],
  ['canonical Match shell does not render descriptive subtitle', !shell.includes('<p>${descriptionHtml}</p>') && !shell.includes('descriptionHtml =')],
  ['Match navigation remains immediately after header', shell.indexOf('matchContextNavigationHtml(activeSection') > shell.indexOf('</div>\n    ${matchContextBackButtonHtml()}')],
  ['workflow may keep descriptions as domain metadata without rendering them in header', workflow.includes('description:')],
  ['header minimalism is domain-wide because all sections share the same shell', shell.includes('Canonical structural shell for every Match Workspace section')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Workspace Header Minimalism: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
