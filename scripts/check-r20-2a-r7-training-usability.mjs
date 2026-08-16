import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingEditorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const runtime = `${controller}\n${trainingEditorEvents}`
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const r7 = css.slice(css.indexOf('R20.2A-R7'), css.indexOf('R20.2A-R8'))

const checks = [
  ['Aggregati mantiene compatibilità metadata', trainingPage.includes('name="aggregated"') && trainingPage.includes('name="aggregated_count"')],
  ['Aggregati espone quantità reali', trainingPage.includes('aggregated_prova_count') && trainingPage.includes('aggregated_youth_count')],
  ['Quantità aggregati entra nei Presenti', runtime.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['Quantità viene persistita', runtime.includes('aggregated_prova_count:') && runtime.includes('aggregated_youth_count:')],
  ['Quantità viene ripristinata', runtime.includes('aggregatedProvaCount') && runtime.includes('aggregatedYouthCount')],
  ['Preview mostra fonti aggregati', runtime.includes('PROVA') && runtime.includes('SETTORE')],
  ['Ricerca usa prefisso', runtime.includes('surnameKey.startsWith(query)') && runtime.includes('word.startsWith(query)')],
  ['Anteprima usa stage condiviso', trainingPage.includes('class="ts-preview-stage"')],
  ['Toolbar e foglio condividono lo stesso confine', r7.includes('.ts-preview-stage .ts-preview-toolbar') && r7.includes('.ts-preview-stage .ts-paper-frame')],
  ['Stage anteprima confinato', r7.includes('width: min(100%, 770px)')],
  ['R7 non aggiunge important', !r7.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R7 Training Usability: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
