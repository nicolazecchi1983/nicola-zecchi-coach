import fs from 'node:fs'
const productUi=fs.readFileSync('src/design-system/productUi.css','utf8')

const main = fs.readFileSync('src/main.js','utf8')
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const canonicalCss = css.slice(css.indexOf('/* ---------- SHELL'))
const appShell = fs.readFileSync('src/design-system/appShell.css','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const audit = fs.readFileSync('docs/STAFF_UI_AUDIT_R20.md','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')

const checks = [
  ['Audit UI formalizzato', audit.includes('Frozen execution plan')],
  ['Roadmap separa Training e Match', audit.includes('R20.2A — Shell + Training') && audit.includes('R20.2B — Match Workspace')],
  ['Training CSS precede Product UI canonico', main.indexOf("training-editor.css") < main.indexOf("productUi.css")],
  ['Topbar permanente vive nel flusso della shell', appShell.includes('.topbar {') && appShell.includes('position: relative') && appShell.includes('height: 64px')],
  ['Training header ha gerarchia dedicata', css.includes('.ts-editor-titlebar') && css.includes('grid-template-columns: minmax(0, 1fr) minmax(500px, 680px)')],
  ['Sei step desktop governati dal Product UI condiviso', productUi.includes('repeat(var(--product-nav-columns, 6)') && productUi.includes('height:64px!important')],
  ['Workspace Training usa tutta larghezza disponibile', css.includes('.ts-workspace--steps') && css.includes('max-width: none')],
  ['Sessione usa griglia desktop compatta', css.includes('.ts-session-grid') && css.includes('minmax(280px, 1.25fr)')],
  ['Rosa usa quattro colonne desktop', css.includes('.ts-roster-grid--four') && css.includes('repeat(4')],
  ['Carico usa layout dedicato', css.includes('.ts-load-grid') && css.includes('1.2fr')],
  ['Fasi hanno azioni orizzontali dedicate', css.includes('.ts-phase-editor-actions') && css.includes('.ts-split-phase-button')],
  ['Pilastri usano quattro colonne desktop', css.includes('.ts-pillars') && css.includes('repeat(4')],
  ['Footer usa button system condiviso', trainingPage.includes('staff-button staff-button--secondary') && trainingPage.includes('data-ts-step-prev')],
  ['Apri TS usa primary condiviso', trainingPage.includes('staff-button staff-button--primary ts-open-button')],
  ['Reset editor resta danger ma fuori dalla gerarchia primaria', trainingPage.includes('ts-more-menu') && trainingPage.includes('ts-menu-danger') && trainingPage.includes('data-reset-training-sheet')],
  ['Nessun nuovo !important nel CSS R20.2A', !canonicalCss.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nR20.2A Shell + Training: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
