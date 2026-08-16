import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const tokens = fs.readFileSync('src/design-system/tokens.css','utf8')
const polish = fs.readFileSync('src/design-system/polish.css','utf8')
const pageShell = fs.readFileSync('src/design-system/pageShell.css','utf8')
const appShellCss = fs.readFileSync('src/design-system/appShell.css','utf8')
const productUi = fs.readFileSync('src/design-system/productUi.css','utf8')
const style = fs.readFileSync('src/style.css','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const app = fs.readFileSync('src/app/appController.js','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')

const checks = [
  ['Polish layer caricato dopo i moduli legacy', main.indexOf("matchOpponentStudy.css") < main.indexOf("design-system/polish.css")],
  ['Nessuna seconda famiglia token nei layer canonici', !polish.includes('--ui-') && !tokens.includes('--ui-')],
  ['Alias legacy --ui collegati ai token STAFF', style.includes('--ui-border:var(--staff-color-border)') && style.includes('--ui-accent:var(--staff-color-primary)')],
  ['Token STAFF estesi', tokens.includes('--staff-content-max') && tokens.includes('--staff-color-bg-sidebar')],
  ['Topbar strutturale usa il token header canonico', appShellCss.includes('App Shell Owner') && appShellCss.includes('background: var(--staff-color-bg-header)') && tokens.includes('--staff-color-bg-header: #080d13')],
  ['Sidebar nasconde categoria', appShellCss.includes('.sidebar-brand span') && appShellCss.includes('display: none')],
  ['Sidebar usa nome squadra risolto', shell.includes('resolveSidebarTeamName(team)')],
  ['Nome breve troppo corto usa nome squadra', shell.includes('shortName.length >= 5')],
  ['Button system impedisce testo multilinea', polish.includes('white-space: nowrap')],
  ['Form system centralizzato', polish.includes('#viewRoot input:not([type="checkbox"])') && polish.includes('#viewRoot select')],
  ['Focus accessibile centralizzato', polish.includes('var(--staff-shadow-focus)')],
  ['Page rhythm centralizzato nel Page Shell canonico', pageShell.includes('#viewRoot {') && pageShell.includes('max-width: var(--staff-content-max)') && pageShell.includes('var(--staff-page-inline)')],
  ['Match e Training product stepper convergono', productUi.includes('.product-section-nav button') && trainingPage.includes('ts-step-nav product-section-nav')],
  ['R20.1 non aggiunge !important', !polish.includes('!important')],
  ['Layer provvisorio R20 rimosso da style.css', !style.includes('R20 · UI POLISH 1.0 — FOUNDATION')],
]

let passed=0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode=1 }
}
console.log(`\nDesign System Core: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
