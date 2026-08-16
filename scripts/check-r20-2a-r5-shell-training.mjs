import fs from 'node:fs'

const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const appShell = fs.readFileSync('src/design-system/appShell.css','utf8')
const pageShell = fs.readFileSync('src/design-system/pageShell.css','utf8')
const training = fs.readFileSync('src/design-system/training-editor.css','utf8')
const commandBar = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')

const checks = [
  ['Topbar ha una riga strutturale propria', shell.includes('class="topbar"') && appShell.includes('App Shell Owner')],
  ['Profilo non è più gestito come floating assoluto nella regola canonica', appShell.includes('.topbar {') && appShell.includes('position: relative')],
  ['Topbar mostra contesto STAFF', shell.includes('topbar-context-product') && shell.includes('STAFF')],
  ['Topbar può mostrare la stagione configurata', shell.includes('topbar-context-season') && shell.includes('team?.season')],
  ['Page content parte sotto la topbar', pageShell.includes('#viewRoot') && pageShell.includes('var(--staff-page-top)')],
  ['Apri TS e select condividono altezza canonica', commandBar.includes('.ts-open-sheet select') && commandBar.includes('.ts-open-button') && commandBar.includes('height: 44px')],
  ['Menu more condivide altezza toolbar', commandBar.includes('.ts-more-button') && commandBar.includes('min-height: 44px')],
  ['Aggregati usa selection card', trainingPage.includes('ts-selection-card ts-aggregated-select')],
  ['Rosa desktop usa quattro controlli equivalenti', training.includes('grid-template-columns: repeat(4, minmax(0, 1fr))')],
  ['Aggregati ha stessa altezza delle multiselect', training.includes('.ts-multiselect,') && training.includes('height: 64px')],
  ['Intensità e Volume sono due metric card', trainingPage.includes('ts-load-metric ts-load-intensity') && trainingPage.includes('ts-load-metric ts-load-volume')],
  ['Metriche hanno separazione visiva dedicata', training.includes('.ts-load-intensity::before') && training.includes('.ts-load-volume::before')],
  ['Reset resta nel menu eccezionale', trainingPage.includes('ts-more-menu-popover') && trainingPage.includes('ts-menu-danger')],
  ['Nessun !important aggiunto in R5', !training.slice(training.indexOf('R20.2A-R5')).includes('!important')],
]

let passed=0
for(const [label,ok] of checks){
  if(ok){console.log(`✓ ${label}`);passed++}
  else{console.error(`✗ ${label}`);process.exitCode=1}
}
console.log(`\nR20.2A-R5 Permanent Shell + Training: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
