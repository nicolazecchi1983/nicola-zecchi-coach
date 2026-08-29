import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js','utf8')
const globalShellEvents = fs.readFileSync('src/app/events/globalShellEvents.js','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')
const commandBar = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const trainingPolish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8')

const layer = responsive.slice(responsive.indexOf('M1.3B — DRAWER RELIABILITY'))
const trainingMobile = trainingPolish.slice(trainingPolish.indexOf('R2.6J — TRAINING MOBILE OWNERSHIP CLEANUP'))

const checks = [
  ['drawer labels are explicitly visible', layer.includes('.mobile-drawer .mobile-drawer-item.nav-item .mobile-drawer-item__label') && layer.includes('display: block;')],
  ['closed drawer becomes inert', globalShellEvents.includes('mobileDrawerShell.inert = true')],
  ['open drawer removes inert', globalShellEvents.includes('mobileDrawerShell.inert = false')],
  ['focus restored before aria-hidden', globalShellEvents.indexOf("mobileDrawerOpen.focus({ preventScroll: true })") < globalShellEvents.indexOf("mobileDrawerShell.setAttribute('aria-hidden', 'true')")],
  ['drawer opening focuses close control', globalShellEvents.includes("querySelector('.mobile-drawer-close')?.focus")],
  ['Training selector command cluster has a dedicated owner', commandBar.includes('grid-template-columns: minmax(0, 1fr) auto') && commandBar.includes('.ts-command-actions')],
  ['Open TS is bounded by the command-bar owner', commandBar.includes('.ts-open-button') && commandBar.includes('width: 84px')],
  ['Draft state remains a separate command status row', commandBar.includes('.ts-draft-state--compact') && commandBar.includes('grid-row: 2')],
  ['Parallel work uses STAFF dark surface', trainingMobile.includes('.ts-manual-editor .ts-parallel-work') && trainingMobile.includes('background: var(--staff-color-bg-panel-raised)')],
  ['Parallel subgroups use dark controls', trainingMobile.includes('background: var(--staff-color-bg-control)')],
  ['Parallel groups stack on mobile', trainingMobile.includes('.ts-parallel-work-grid') && trainingMobile.includes('grid-template-columns: 1fr')],
  ['Contract protects scope', contract.includes('does not redesign Training Library, Calendar, Match Post-gara or document generation')],
]

let passed=0
for (const [label, ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nM1.3B Drawer + Training compact: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
