import { readFile, stat } from 'node:fs/promises'

const failures = []
const componentPath = 'src/design-system/uiComponents.js'

try { await stat(componentPath) } catch { failures.push(`UI Components mancante: ${componentPath}`) }

const components = await readFile(componentPath, 'utf8')
const legacyCompatibility = await readFile('src/modules/match/ui/legacyMatchCompatibilityView.js', 'utf8')
const squad = await readFile('src/modules/match/ui/matchSquadView.js', 'utf8')
const callups = await readFile('src/modules/match/ui/callupsView.js', 'utf8')
const analysis = await readFile('src/modules/match/ui/matchAnalysisView.js', 'utf8')
const statistics = await readFile('src/modules/match/ui/matchStatisticsView.js', 'utf8')
const matchWorkspaceShell = await readFile('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8')

for (const contract of ['buttonHtml', 'matchContextBackButtonHtml', 'editorFooterHtml']) {
  if (!components.includes(`export function ${contract}`)) failures.push(`Contratto UI mancante: ${contract}`)
}

if (!legacyCompatibility.includes("from '../../../design-system/uiComponents.js'")) failures.push('Legacy Match compatibility non usa i componenti UI')
if (!legacyCompatibility.includes('editorFooterHtml({')) failures.push('Footer Match Sheet non migrato al componente condiviso')
if (!legacyCompatibility.includes('matchContextBackButtonHtml()')) failures.push('Ritorno al workspace non migrato al componente condiviso')
if (!squad.includes('buttonHtml({')) failures.push('Toolbar Squadra non usa il Button condiviso')

for (const [name, source] of [['Convocazioni', callups], ['Analisi gara', analysis]]) {
  if (!source.includes('matchWorkspaceShellHtml')) failures.push(`${name}: Match Workspace Shell non condiviso`)
  if (source.includes('class="ghost-button match-context-back"')) failures.push(`${name}: markup legacy del ritorno ancora presente`)
}
if (!matchWorkspaceShell.includes('matchContextBackButtonHtml()')) failures.push('Match Workspace Shell: ritorno al workspace mancante')
if (!statistics.includes('matchWorkspaceShellHtml')) failures.push('Statistiche: Match Workspace Shell non condiviso')
if (statistics.includes('matchContextBackButtonHtml()')) failures.push('Statistiche: ritorno duplicato fuori dal Match Workspace Shell')
if (statistics.includes('class="ghost-button match-context-back"')) failures.push('Statistiche: markup legacy del ritorno ancora presente')

if (failures.length) {
  console.error('\nUI COMPONENTS CHECK: FAILED\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('UI COMPONENTS CHECK: OK (Button, ritorno workspace e footer condivisi)')