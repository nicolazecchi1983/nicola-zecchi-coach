import fs from 'node:fs'
import { resolveWorkspaceRestore } from '../src/app/appSessionRestore.js'

const kernel = fs.readFileSync('src/app/appKernel.js', 'utf8')
const engine = fs.readFileSync('src/app/appWorkspaceEngine.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')

const available = [
  'dashboard', 'calendar', 'match-library', 'match-workspace', 'callups',
  'our-team', 'opponent', 'analysis', 'match-statistics',
  'opponent-study', 'match-report-workspace', 'post-match', 'profile',
]
const allow = () => true
const match = { id: 'match-1', opponent: 'Comacchiese' }
const events = [{ id: 'match-1', type: 'match' }]

const reportRestore = resolveWorkspaceRestore({
  savedSection: 'match-report-workspace',
  activeMatch: match,
  calendarEvents: events,
  canAccessSection: allow,
  availableSections: available,
  firstAccessibleSection: 'dashboard',
})

const missingContext = resolveWorkspaceRestore({
  savedSection: 'match-report-workspace',
  activeMatch: null,
  calendarEvents: events,
  canAccessSection: allow,
  availableSections: available,
  firstAccessibleSection: 'dashboard',
})

const checks = [
  ['Report viene ripristinato con match valido', reportRestore.key === 'match-report-workspace'],
  ['Restore contestuale mantiene Match Library attiva in sidebar', reportRestore.navigationKey === 'match-library'],
  ['Contesto Match mancante fa fallback sicuro', missingContext.key === 'match-library'],
  ['Controller usa resolver centrale', controller.includes('resolveWorkspaceRestore({')],
  ['Restore considera tutte le route registrate, non solo APP_MENU', controller.includes('availableSections: moduleRegistry.keys()')],
  ['Workspace Engine persiste ogni apertura riuscita', engine.includes("storage?.setItem('nz-active-section', key)")],
  ['Kernel tiene traccia dell’utente già renderizzato', kernel.includes('renderedUserId')],
  ['Kernel evita rerender per stesso utente già montato', kernel.includes("renderedUserId === nextUserId && rootElement.querySelector('.workspace')")],
  ['Kernel serializza i render concorrenti', kernel.includes('dashboardRenderPromise')],
  ['Auth refresh non forza Dashboard', !kernel.includes('if (nextSession) showDashboard()')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`✗ ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${label}`)
    passed += 1
  }
}
console.log(`\nWorkspace Session Restore: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
