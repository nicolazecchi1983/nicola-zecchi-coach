import fs from 'node:fs'
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingEditorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const runtime = `${controller}\n${trainingEditorEvents}`
const css = fs.readFileSync('src/design-system/training-editor.css','utf8')
const canonicalCss = css.slice(css.indexOf('/* ---------- SHELL'))
const appShell = fs.readFileSync('src/design-system/appShell.css','utf8')
const trainingPage = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const commandBar = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const r9 = css

const checks = [
  ['Ricerca nasconde davvero i non match', runtime.includes("style.setProperty('display', 'none', 'important')") && runtime.includes("style.removeProperty('display')")],
  ['Ricerca sa/sal usa prefisso su cognome/parole', runtime.includes('surnameKey.startsWith(query)') && runtime.includes('word.startsWith(query)')],
  ['Disclosure Rosa funzionano ad accordion', runtime.includes('rosterDisclosures.forEach') && runtime.includes('other.open = false')],
  ['Aggregati chiude gli altri disclosure', runtime.includes('aggregatedDisclosure?.addEventListener') && runtime.includes('details.open = false')],
  ['Aggregati ha quantità Prova', trainingPage.includes('name="aggregated_prova_count"')],
  ['Aggregati ha quantità Settore', trainingPage.includes('name="aggregated_youth_count"')],
  ['Presenti somma Prova + Settore', runtime.includes('const aggregatedCount = provaCount + youthCount')],
  ['Legacy Aggregati resta compatibile', runtime.includes("legacyAggregatedType === 'PROVA'") && runtime.includes("legacyAggregatedType === 'SETTORE GIOVANILE'")],
  ['Preview distingue Prova e Settore', trainingPage.includes('aggregated_prova_count') && trainingPage.includes('aggregated_youth_count') && runtime.includes('<span>PROVA') && runtime.includes('<span>SETTORE')],
  ['Sidebar brand e topbar condividono 64px', appShell.includes('.sidebar-brand') && appShell.includes('height: 64px') && appShell.includes('.topbar {')],
  ['Toolbar Training mantiene un limite compatto canonico', commandBar.includes('max-width: 500px')],
  ['Apri TS resta compatto nel nuovo owner', commandBar.includes('width: 84px')],
  ['R9 non introduce important', !canonicalCss.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R9 Compact Training: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
