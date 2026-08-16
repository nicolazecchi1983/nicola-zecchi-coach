import fs from 'node:fs'
import { resolveWorkspaceRestore } from '../src/app/appSessionRestore.js'

const library = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js', 'utf8')
const legacyLibrary = fs.readFileSync('src/modules/match/ui/matchLibraryController.js', 'utf8')
const analysis = fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js', 'utf8')
const components = fs.readFileSync('src/design-system/uiComponents.js', 'utf8')

const available = ['dashboard', 'match-library', 'match-workspace', 'opponent-study']
const restore = resolveWorkspaceRestore({
  savedSection: 'match-workspace',
  activeMatch: { id: 'match-1' },
  calendarEvents: [{ id: 'match-1', type: 'match' }],
  canAccessSection: () => true,
  availableSections: available,
  firstAccessibleSection: 'dashboard',
})

const checks = [
  ['card click stores opponent-study as active section', library.includes("activateMatchContext({ id: openButton.dataset.openMatchWorkspace") && library.includes("}, 'opponent-study')")],
  ['card click opens Studio avversario directly', library.includes("await setView('opponent-study', 'Studio avversario')")],
  ['create/open flow also enters Studio avversario', (library.match(/setView\('opponent-study', 'Studio avversario'\)/g) || []).length >= 2],
  ['legacy library binder cannot reintroduce landing page', legacyLibrary.includes("setView('opponent-study', 'Studio avversario')") && !legacyLibrary.includes("setView('match-workspace', 'Match Workspace')")],
  ['section back action returns to Match Library', analysis.includes("setView('match-library', 'Match Library')")],
  ['back control copy names Match Library', components.includes("label: 'Torna alla Match Library'")],
  ['legacy match-workspace restore redirects to step 1', restore.key === 'opponent-study' && restore.navigationKey === 'match-library'],
  ['compatibility route remains available', available.includes('match-workspace')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Direct Entry: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
