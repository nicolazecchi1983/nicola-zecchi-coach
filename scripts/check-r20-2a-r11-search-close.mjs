import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingEditorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const runtime = `${controller}\n${trainingEditorEvents}`
const checks = [
  ['Ricerca è prefix-only', runtime.includes('const match = !query || prefixMatch') && !runtime.includes('haystack.includes(query)')],
  ['Cognome usa startsWith', runtime.includes('surnameKey.startsWith(query)')],
  ['Nome usa startsWith sulle parole', runtime.includes('word.startsWith(query)')],
  ['X esterna svuota', runtime.includes("if (searchInput) searchInput.value = ''")],
  ['X esterna chiude il details', runtime.includes('if (selector) selector.open = false')],
  ['X nativa search è gestita', runtime.includes("manualEditor.addEventListener('search'")],
  ['X nativa ripristina filtro e chiude', runtime.includes("if (!searchInput || searchInput.value) return") && runtime.includes('filterTrainingRosterSelector(selector)')],
]
let passed=0
for(const [label,ok] of checks){if(ok){console.log(`✓ ${label}`);passed++}else{console.error(`✗ ${label}`);process.exitCode=1}}
console.log(`\nR20.2A-R11 Search Close: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
