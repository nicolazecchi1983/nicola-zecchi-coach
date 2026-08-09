import fs from 'node:fs'

const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const style = fs.readFileSync('src/style.css','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')

const r6 = css.slice(css.indexOf('R20.2A-R6'))

const checks = [
  ['Disclosure roster non ha altezza fissa', r6.includes('.ts-multiselect {\n  height: auto;')],
  ['Disclosure roster può espandersi', r6.includes('.ts-multiselect[open]') && r6.includes('overflow: visible')],
  ['Summary mantiene baseline chiusa', r6.includes('height: 62px') && r6.includes('min-height: 62px')],
  ['Assenti/Infortunati/Differenziato restano details interattivi', controller.includes('data-player-select="') && controller.includes('<details class="ts-multiselect')],
  ['Toolbar TS resa più compatta', r6.includes('minmax(500px, 600px)')],
  ['Apri TS ridotto a 96px', r6.includes('width: 96px')],
  ['Controlli toolbar condividono 44px', r6.includes('height: 44px') && r6.includes('min-height: 44px')],
  ['Anteprima toolbar usa tutta larghezza disponibile', r6.includes('.ts-preview-toolbar') && r6.includes('width: 100%') && r6.includes('max-width: 100%')],
  ['Legacy preview button non è più bloccato da important', !style.includes('.ts-preview-toolbar button{width:auto!important')],
  ['R6 non introduce important', !r6.includes('!important')],
]

let passed=0
for (const [label,ok] of checks) {
  if(ok){console.log(`✓ ${label}`);passed++}
  else{console.error(`✗ ${label}`);process.exitCode=1}
}
console.log(`\nR20.2A-R6 Function First: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
