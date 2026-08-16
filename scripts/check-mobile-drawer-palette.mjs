import fs from 'node:fs'

const nav = fs.readFileSync('src/app/appNavigation.js','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const globalShellEvents = fs.readFileSync('src/app/events/globalShellEvents.js','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const tokens = fs.readFileSync('src/design-system/tokens.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')

const checks = [
  ['drawer grouped labels exist', ['Principale','Training','Match','Squadra','Sistema'].every(x => nav.includes(x))],
  ['all core mobile destinations have text', ['Dashboard','Calendario','Training Sheet','Training Library','Match Library','Rosa','Impostazioni'].every(x => nav.includes(x))],
  ['drawer header has STAFF product identity', nav.includes('<strong>STAFF</strong>')],
  ['drawer footer has user identity', nav.includes('mobile-drawer-profile__copy')],
  ['hamburger exists in global topbar', shell.includes('mobile-menu-trigger')],
  ['route selection closes drawer', globalShellEvents.includes('closeMobileDrawer()')],
  ['bottom nav is disabled by final layer', responsive.slice(responsive.indexOf('M1.3A — MOBILE NAVIGATION DRAWER')).includes('.mobile-navigation')],
  ['brand-neutral app background', tokens.includes('--staff-color-bg-app: #070b10;')],
  ['brand-neutral sidebar background', tokens.includes('--staff-color-bg-sidebar: #05080c;')],
  ['primary accent remains product cyan', tokens.includes('--staff-color-primary: #19aef0;')],
  ['warning is orange not yellow/gold', tokens.includes('--staff-color-warning: #ff9f43;')],
  ['contract forbids team colors driving chrome', contract.includes('team crest/logo colors must never drive navigation')],
  ['contract removes yellow/gold from global palette', contract.includes('no yellow/gold is part of the global STAFF UI palette')],
  ['drawer active state uses STAFF cyan', responsive.includes('box-shadow: inset 2px 0 0 var(--staff-color-primary)')],
]
let passed=0
for (const [label, ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok) passed++
}
console.log(`\nM1.3A Drawer + Palette: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
