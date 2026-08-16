import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const nav = fs.readFileSync('src/app/appNavigation.js','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const globalShellEvents = fs.readFileSync('src/app/events/globalShellEvents.js','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')

const drawer = responsive.slice(responsive.indexOf('M1.3A — MOBILE NAVIGATION DRAWER'))

const checks = [
  ['Responsive layer is loaded last', main.trim().split('\n').filter(line => line.startsWith("import './")).at(-1)?.includes('responsive.css')],
  ['Dedicated mobile navigation renderer exists', nav.includes('export function renderMobileNavigation(')],
  ['Mobile shell renders drawer with identity context', shell.includes('renderMobileNavigation({ identity, team, renderTeamLogo, escapeHtml })')],
  ['Global mobile hamburger exists', shell.includes('data-mobile-drawer-open')],
  ['Desktop sidebar is hidden on mobile', responsive.includes('.sidebar {\n    display: none;')],
  ['Bottom navigation retired', drawer.includes('.mobile-navigation') && drawer.includes('display: none;')],
  ['Drawer has full text labels', nav.includes('mobile-drawer-item__label') && nav.includes('Training Library') && nav.includes('Rosa') && nav.includes('Impostazioni') && !nav.includes("['methodology', 'Metodologia'") && !nav.includes("['board', 'Board'")],
  ['Drawer is grouped by product meaning', ['Principale','Training','Match','Squadra','Sistema'].every(label => nav.includes(`label: '${label}'`))],
  ['Drawer respects safe area', drawer.includes('var(--staff-safe-top)') && drawer.includes('var(--staff-safe-bottom)')],
  ['Drawer has backdrop and vertical overflow', drawer.includes('.mobile-drawer-backdrop') && drawer.includes('overflow-y: auto')],
  ['Drawer controller has open/close/toggle', globalShellEvents.includes('openMobileDrawer') && globalShellEvents.includes('closeMobileDrawer') && globalShellEvents.includes('toggleMobileDrawer')],
  ['Navigation closes drawer after route change', globalShellEvents.includes('closeMobileDrawer()')],
  ['Escape closes drawer', globalShellEvents.includes("event.key === 'Escape'") && globalShellEvents.includes('closeMobileDrawer()')],
  ['Contract documents desktop sidebar + mobile drawer', contract.includes('mobile uses a left navigation drawer')],
  ['Shell navigation does not alter domain persistence', !nav.includes('supabase') && !shell.includes('supabase')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nM1.3A Mobile Drawer Navigation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
