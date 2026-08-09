import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const checks = [
  ['Ricerca è prefix-only', controller.includes('const match = !query || prefixMatch') && !controller.includes('haystack.includes(query)')],
  ['Cognome usa startsWith', controller.includes('surnameKey.startsWith(query)')],
  ['Nome usa startsWith sulle parole', controller.includes('word.startsWith(query)')],
  ['X esterna svuota', controller.includes("if (searchInput) searchInput.value = ''")],
  ['X esterna chiude il details', controller.includes('if (selector) selector.open = false')],
  ['X nativa search è gestita', controller.includes("manualEditor.addEventListener('search'")],
  ['X nativa ripristina filtro e chiude', controller.includes("if (!searchInput || searchInput.value) return") && controller.includes('filterTrainingRosterSelector(selector)')],
]
let passed=0
for(const [label,ok] of checks){if(ok){console.log(`✓ ${label}`);passed++}else{console.error(`✗ ${label}`);process.exitCode=1}}
console.log(`\nR20.2A-R11 Search Close: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
