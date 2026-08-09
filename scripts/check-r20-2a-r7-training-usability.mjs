import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const r7 = css.slice(css.indexOf('R20.2A-R7'), css.indexOf('R20.2A-R8'))

const checks = [
  ['Aggregati mantiene compatibilità metadata', controller.includes('name="aggregated"') && controller.includes('name="aggregated_count"')],
  ['Aggregati espone quantità reali', controller.includes('aggregated_prova_count') && controller.includes('aggregated_youth_count')],
  ['Quantità aggregati entra nei Presenti', controller.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['Quantità viene persistita', controller.includes('aggregated_prova_count:') && controller.includes('aggregated_youth_count:')],
  ['Quantità viene ripristinata', controller.includes('aggregatedProvaCount') && controller.includes('aggregatedYouthCount')],
  ['Preview mostra fonti aggregati', controller.includes('PROVA') && controller.includes('SETTORE')],
  ['Ricerca usa prefisso', controller.includes('surnameKey.startsWith(query)') && controller.includes('word.startsWith(query)')],
  ['Anteprima usa stage condiviso', controller.includes('class="ts-preview-stage"')],
  ['Toolbar e foglio condividono lo stesso confine', r7.includes('.ts-preview-stage .ts-preview-toolbar') && r7.includes('.ts-preview-stage .ts-paper-frame')],
  ['Stage anteprima confinato', r7.includes('width: min(100%, 770px)')],
  ['R7 non aggiunge important', !r7.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R7 Training Usability: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
