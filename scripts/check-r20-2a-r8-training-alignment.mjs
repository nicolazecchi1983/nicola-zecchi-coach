import fs from 'node:fs'
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const r8 = css.slice(css.indexOf('R20.2A-R8'), css.indexOf('R20.2A-R9'))

const checks = [
  ['Topbar usa identità squadra reale', shell.includes('topbar-context-product') && shell.includes('resolveSidebarTeamName(team)')],
  ['Stagione resta accanto alla squadra', shell.includes('topbar-context-season') && shell.includes('team?.season')],
  ['Shell mantiene profilo separato', shell.includes('renderProfileMenu(identity)')],
  ['Squadra/stagione/profilo condividono baseline', r8.includes('.topbar-context,') && r8.includes('align-self: center')],
  ['Training Sheet pubblicate non sale sopra il titolo', r8.includes('.ts-editor-titlebar') && r8.includes('align-items: start')],
  ['Aggregati usa disclosure persistente', controller.includes('data-aggregated-menu') && controller.includes('data-aggregated-summary')],
  ['Aggregati non usa select nativo', !controller.includes('<select name="aggregated"')],
  ['Fonti Aggregati leggibili', controller.includes('Prova</span>') && controller.includes('Settore giovanile</span>')],
  ['Quantità separate nel pannello', controller.includes('aggregated_prova_count') && controller.includes('aggregated_youth_count')],
  ['Menu resta aperto con quantità', controller.includes('menu.open = keepOpen || total > 0')],
  ['Quantità collegate ai Presenti', controller.includes('provaCount + youthCount')],
  ['Anteprima toolbar allineata al foglio', r8.includes('padding-left: 32px') && r8.includes('padding-right: 32px')],
  ['R8 non introduce important', !r8.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R8 Training Alignment: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
