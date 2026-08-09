import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const tokens = fs.readFileSync('src/design-system/tokens.css','utf8')
const polish = fs.readFileSync('src/design-system/polish.css','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')

const checks = [
  ['Polish CSS dedicato presente', main.includes("import './design-system/polish.css'")],
  ['Token canonici STAFF presenti', tokens.includes('--staff-color-bg-app') && tokens.includes('--staff-content-max')],
  ['Topbar visualmente trasparente', polish.includes('--staff-color-bg-header') || polish.includes('background: var(--staff-color-bg-header)')],
  ['Sidebar gerarchia condivisa', polish.includes('.nav-item.is-active') && polish.includes('.nav-group-toggle')],
  ['Page hierarchy condivisa', polish.includes('.page-head h1') && polish.includes('var(--staff-font-page-title)')],
  ['Focus visibility condivisa', polish.includes('var(--staff-shadow-focus)')],
  ['Responsive core presente', polish.includes('@media (max-width: 760px)')],
  ['Match stepper normalizzato', polish.includes('.match-step-nav button')],
  ['Training stepper normalizzato', polish.includes('.ts-step-nav button')],
  ['Brand sidebar senza categoria', shell.includes('resolveSidebarTeamName(team)') && !shell.includes("team.category || 'STAFF'")],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nUI Polish Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
