import fs from 'node:fs'

const normalizeEol = (value) => String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const shell = normalizeEol(fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8'))
const workflow = normalizeEol(fs.readFileSync('src/modules/match/matchWorkflowModel.js', 'utf8'))

const checks = [
  ['canonical Match shell keeps current workspace title and retires technical eyebrow from visible UI', shell.includes('match-workspace-shell__eyebrow\" hidden aria-hidden=\"true\">MATCH WORKSPACE</span>') && shell.includes('const currentWorkspaceTitleHtml = workspaceTitleHtml || titleHtml') && shell.includes('<h1>${currentWorkspaceTitleHtml}</h1>')],
  ['canonical Match shell can expose compact match identity metadata without a descriptive subtitle', shell.includes('matchMetaHtml') && shell.includes('match-workspace-shell__match-meta') && shell.includes('aria-label="Contesto partita"')],
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
