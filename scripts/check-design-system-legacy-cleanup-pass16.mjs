import fs from 'node:fs'

const main = fs.readFileSync('src/main.js', 'utf8')
const appShell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')
const polish = fs.readFileSync('src/design-system/polish.css', 'utf8')

const legacyShellOwner = /^\s*\.(?:app-shell|sidebar(?:-brand|-nav)?|nav-item|nav-icon|logout-button|nav-group(?:-[\w-]+)?|workspace)\b/m

const checks = [
  ['App Shell remains loaded after polish', main.indexOf('polish.css') < main.indexOf('appShell.css')],
  ['Responsive remains the final mobile owner', main.indexOf('appShell.css') < main.indexOf('responsive.css')],
  ['Desktop app shell is canonically owned', appShell.includes('.app-shell {') && appShell.includes('grid-template-columns: 232px minmax(0, 1fr)')],
  ['Desktop sidebar is canonically owned', appShell.includes('.sidebar {') && appShell.includes('background: var(--staff-color-bg-sidebar)')],
  ['Primary nav items are canonically owned', appShell.includes('.nav-item {') && appShell.includes('.nav-item.is-active {')],
  ['Sidebar groups are canonically owned', appShell.includes('.nav-group-toggle {') && appShell.includes('.nav-group.is-collapsed .nav-group-items')],
  ['Compact desktop sidebar regime is retired', !appShell.includes('@media (max-width: 1100px) and (min-width: 761px)')],
  ['Responsive navigation owns phone + tablet drawer shell', responsive.includes('R2.7G — TABLET NAVIGATION SHELL CONTRACT') && responsive.includes('.sidebar {\n    display: none;') && responsive.includes('.mobile-drawer-shell')],
  ['Legacy style no longer owns shell/sidebar selectors', !legacyShellOwner.test(legacy)],
  ['Polish no longer owns shell/sidebar selectors', !legacyShellOwner.test(polish)],
  ['Canonical sidebar introduces no important escalation', !appShell.includes('!important')],
  ['Legacy mobile sidebar implementation is gone', !legacy.includes('.sidebar {')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS Legacy Cleanup Pass 16: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
