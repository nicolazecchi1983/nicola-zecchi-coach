import { readFile, stat } from 'node:fs/promises'

const failures = []
const componentPath = 'src/design-system/uiComponents.js'

try { await stat(componentPath) } catch { failures.push(`UI Components mancante: ${componentPath}`) }

const components = await readFile(componentPath, 'utf8')
const controller = await readFile('src/app/appController.js', 'utf8')
const squad = await readFile('src/modules/match/ui/matchSquadView.js', 'utf8')
const callups = await readFile('src/modules/match/ui/callupsView.js', 'utf8')
const analysis = await readFile('src/modules/match/ui/matchAnalysisView.js', 'utf8')
const statistics = await readFile('src/modules/match/ui/matchStatisticsView.js', 'utf8')

for (const contract of ['buttonHtml', 'matchContextBackButtonHtml', 'editorFooterHtml']) {
  if (!components.includes(`export function ${contract}`)) failures.push(`Contratto UI mancante: ${contract}`)
}

if (!controller.includes("from '../design-system/uiComponents.js'")) failures.push('App Controller non usa i componenti UI')
if (!controller.includes('editorFooterHtml({')) failures.push('Footer Match Sheet non migrato al componente condiviso')
if (!controller.includes('matchContextBackButtonHtml()')) failures.push('Ritorno al workspace non migrato al componente condiviso')
if (!squad.includes('buttonHtml({')) failures.push('Toolbar Squadra non usa il Button condiviso')

for (const [name, source] of [['Convocazioni', callups], ['Analisi gara', analysis], ['Statistiche', statistics]]) {
  if (!source.includes('matchContextBackButtonHtml()')) failures.push(`${name}: ritorno al workspace non condiviso`)
  if (source.includes('class="ghost-button match-context-back"')) failures.push(`${name}: markup legacy del ritorno ancora presente`)
}

if (failures.length) {
  console.error('\nUI COMPONENTS CHECK: FAILED\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('UI COMPONENTS CHECK: OK (Button, ritorno workspace e footer condivisi)')
