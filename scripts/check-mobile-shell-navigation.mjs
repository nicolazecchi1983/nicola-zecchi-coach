import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const nav = fs.readFileSync('src/app/appNavigation.js','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')

const m12 = responsive.slice(responsive.indexOf('M1.2 — MOBILE SHELL & NAVIGATION CONTRACT'))

const checks = [
  ['Responsive layer is loaded last', main.trim().split('\n').filter(line => line.startsWith("import './")).at(-1)?.includes('responsive.css')],
  ['Dedicated mobile navigation renderer exists', nav.includes('export function renderMobileNavigation()')],
  ['Mobile shell renders dedicated navigation', shell.includes('${renderMobileNavigation()}')],
  ['Mobile primary navigation is 4 + Altro', nav.includes("['dashboard', 'Home'") && nav.includes("['calendar', 'Calendario'") && nav.includes("['training-sheet', 'Training'") && nav.includes("['match-library', 'Match'") && nav.includes('data-mobile-more-toggle')],
  ['Desktop sidebar is hidden on mobile', m12.includes('.sidebar {\n    display: none;')],
  ['Bottom nav uses five equal columns', m12.includes('grid-template-columns: repeat(5, minmax(0, 1fr))')],
  ['Bottom nav does not require horizontal scrolling', !m12.includes('overflow-x: auto')],
  ['Bottom nav respects safe area', m12.includes('var(--staff-safe-bottom)') && m12.includes('var(--staff-safe-left)') && m12.includes('var(--staff-safe-right)')],
  ['Page reserves bottom-navigation space', m12.includes('var(--staff-mobile-nav-bar-height)') && m12.includes('#viewRoot')],
  ['Altro sheet is bounded and scrollable vertically', m12.includes('.mobile-more-sheet') && m12.includes('max-height: min(62vh, 460px)') && m12.includes('overflow-y: auto')],
  ['Mobile navigation has open/close controller', controller.includes('openMobileMore') && controller.includes('closeMobileMore') && controller.includes('toggleMobileMore')],
  ['Navigation closes Altro after route change', controller.includes('closeMobileMore()')],
  ['Altro active state follows secondary routes', controller.includes('mobileMoreHasActiveSection')],
  ['Contract documents 4+1 pattern', contract.includes('four primary destinations plus one `Altro` entry')],
  ['M1.2 does not alter domain persistence', !nav.includes('supabase') && !shell.includes('supabase')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nM1.2 Mobile Shell & Navigation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
