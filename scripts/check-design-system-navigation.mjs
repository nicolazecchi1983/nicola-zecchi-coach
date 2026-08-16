import fs from 'node:fs'

const product = fs.readFileSync('src/design-system/productUi.css', 'utf8')
const polish = fs.readFileSync('src/design-system/polish.css', 'utf8')
const appShell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const training = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const ui = fs.readFileSync('src/design-system/uiComponents.js', 'utf8')

const checks = [
  ['Training e Match condividono la stessa navigation', training.includes('ts-step-nav product-section-nav') && ui.includes('match-context-navigation product-section-nav')],
  ['Stepper desktop compatto a 64px', product.includes('height:64px!important') && product.includes('min-height:64px!important')],
  ['Stepper attivo usa indicatore inferiore STAFF', product.includes('box-shadow:inset 0 -2px 0 var(--product-accent)!important')],
  ['Stepper inattivo resta visivamente quieto', product.includes('background:transparent!important')],
  ['Numero step inattivo usa testo faint', product.includes('color:var(--staff-color-text-faint)!important')],
  ['Navigazione mobile resta a due colonne', product.includes('grid-template-columns:repeat(var(--product-nav-mobile-columns,2)')],
  ['Navigazione mobile usa altezza 60px', product.includes('height:60px!important') && product.includes('min-height:60px!important')],
  ['Sidebar non usa gradiente decorativo', appShell.includes('background: var(--staff-color-bg-sidebar);') && !appShell.match(/\.sidebar\s*\{[^}]*linear-gradient/s)],
  ['Sidebar attiva usa superficie neutra e accento sottile', appShell.includes('background: var(--staff-color-bg-panel-raised);') && appShell.includes('box-shadow: inset 2px 0 0 var(--staff-color-primary);')],
  ['Categorie sidebar sono secondarie', appShell.includes('color: var(--staff-color-text-faint);')],
  ['Drawer mobile replica lo stesso linguaggio attivo', responsive.includes('background: var(--staff-color-bg-panel-raised);') && responsive.includes('box-shadow: inset 2px 0 0 var(--staff-color-primary);')],
  ['Navigation non introduce nuovi breakpoint', !product.includes('@media(max-width:720px)') && !product.includes('@media(max-width:800px)')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`DS1.5 Navigation & Stepper: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
