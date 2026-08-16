import fs from 'node:fs'
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingEditorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const runtime = `${controller}\n${trainingEditorEvents}`
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const canonicalCss = css.slice(css.indexOf('/* ---------- SHELL'))
const appShell = fs.readFileSync('src/design-system/appShell.css','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const r8 = css

const checks = [
  ['Topbar usa identità squadra reale', shell.includes('topbar-context-product') && shell.includes('resolveSidebarTeamName(team)')],
  ['Stagione resta accanto alla squadra', shell.includes('topbar-context-season') && shell.includes('team?.season')],
  ['Shell mantiene profilo separato', shell.includes('renderProfileMenu(identity)')],
  ['Squadra/stagione/profilo condividono baseline', appShell.includes('.topbar-context {') && appShell.includes('align-items: center') && appShell.includes('.topbar .profile-menu-wrapper')],
  ['Training Sheet pubblicate non sale sopra il titolo', r8.includes('.ts-editor-titlebar') && r8.includes('align-items: start')],
  ['Aggregati usa disclosure persistente', trainingPage.includes('data-aggregated-menu') && trainingPage.includes('data-aggregated-summary')],
  ['Aggregati non usa select nativo', !trainingPage.includes('<select name="aggregated"')],
  ['Fonti Aggregati leggibili', trainingPage.includes('Prova</span>') && trainingPage.includes('Settore giovanile</span>')],
  ['Quantità separate nel pannello', trainingPage.includes('aggregated_prova_count') && trainingPage.includes('aggregated_youth_count')],
  ['Menu resta aperto con quantità', runtime.includes('menu.open = keepOpen || total > 0')],
  ['Quantità collegate ai Presenti', runtime.includes('provaCount + youthCount')],
  ['Anteprima toolbar allineata al foglio', r8.includes('.ts-preview-stage .ts-preview-toolbar') && r8.includes('width: 100%')],
  ['R8 non introduce important', !canonicalCss.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R8 Training Alignment: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
