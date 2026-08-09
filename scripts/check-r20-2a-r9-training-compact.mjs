import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const r9 = css.slice(css.indexOf('R20.2A-R9'))

const checks = [
  ['Ricerca nasconde davvero i non match', controller.includes("style.setProperty('display', 'none', 'important')") && controller.includes("style.removeProperty('display')")],
  ['Ricerca sa/sal usa prefisso su cognome/parole', controller.includes('surnameKey.startsWith(query)') && controller.includes('word.startsWith(query)')],
  ['Disclosure Rosa funzionano ad accordion', controller.includes('rosterDisclosures.forEach') && controller.includes('other.open = false')],
  ['Aggregati chiude gli altri disclosure', controller.includes('aggregatedDisclosure?.addEventListener') && controller.includes('details.open = false')],
  ['Aggregati ha quantità Prova', controller.includes('name="aggregated_prova_count"')],
  ['Aggregati ha quantità Settore', controller.includes('name="aggregated_youth_count"')],
  ['Presenti somma Prova + Settore', controller.includes('const aggregatedCount = provaCount + youthCount')],
  ['Legacy Aggregati resta compatibile', controller.includes("legacyAggregatedType === 'PROVA'") && controller.includes("legacyAggregatedType === 'SETTORE GIOVANILE'")],
  ['Preview distingue Prova e Settore', controller.includes('aggregated_prova_count') && controller.includes('aggregated_youth_count') && controller.includes('<span>PROVA') && controller.includes('<span>SETTORE')],
  ['Sidebar brand e topbar condividono 64px', r9.includes('.sidebar-brand') && r9.includes('height: 64px') && r9.includes('.topbar')],
  ['Toolbar Training ridotta a 450px', r9.includes('width: 450px') && r9.includes('max-width: 450px')],
  ['Apri TS ridotto a 88px', r9.includes('width: 88px')],
  ['R9 non introduce important', !r9.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R9 Compact Training: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
