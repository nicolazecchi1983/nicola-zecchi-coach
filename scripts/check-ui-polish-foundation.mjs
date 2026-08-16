import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const tokens = fs.readFileSync('src/design-system/tokens.css','utf8')
const polish = fs.readFileSync('src/design-system/polish.css','utf8')
const appShell = fs.readFileSync('src/design-system/appShell.css','utf8')
const productUi = fs.readFileSync('src/design-system/productUi.css','utf8')
const app = fs.readFileSync('src/app/appController.js','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')

const checks = [
  ['Polish CSS dedicato presente', main.includes("import './design-system/polish.css'")],
  ['Token canonici STAFF presenti', tokens.includes('--staff-color-bg-app') && tokens.includes('--staff-content-max')],
  ['Topbar posseduta dall App Shell canonica', appShell.includes('.topbar {') && appShell.includes('background: var(--staff-color-bg-header)')],
  ['Sidebar gerarchia condivisa', appShell.includes('.nav-item.is-active') && appShell.includes('.nav-group-toggle')],
  ['Page hierarchy condivisa', polish.includes('.page-head h1') && polish.includes('var(--staff-font-page-title)')],
  ['Focus visibility condivisa', polish.includes('var(--staff-shadow-focus)')],
  ['Responsive core presente', polish.includes('@media (max-width: 760px)')],
  ['Match stepper normalizzato', polish.includes('.match-step-nav button')],
  ['Training stepper normalizzato dal Product UI layer', productUi.includes('.product-section-nav button') && trainingPage.includes('ts-step-nav product-section-nav')],
  ['Brand sidebar senza categoria', shell.includes('resolveSidebarTeamName(team)') && !shell.includes("team.category || 'STAFF'")],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nUI Polish Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
