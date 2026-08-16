import fs from 'node:fs'

const main = fs.readFileSync('src/main.js', 'utf8')
const appShell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')
const polish = fs.readFileSync('src/design-system/polish.css', 'utf8')
const training = fs.readFileSync('src/design-system/training-editor.css', 'utf8')

const forbidden = /\.topbar|\.topbar-context|\.mobile-topbar-brand|\.mobile-brand-square|\.profile-menu|\.profile-dropdown|\.user-avatar|\.avatar-initial/

const checks = [
  ['App Shell owner exists', main.includes("import './design-system/appShell.css'") && appShell.includes('App Shell Owner')],
  ['App Shell loads after Page Shell', main.indexOf('pageShell.css') < main.indexOf('appShell.css')],
  ['Responsive remains final owner', main.indexOf('appShell.css') < main.indexOf('responsive.css')],
  ['Desktop topbar is canonically owned', appShell.includes('.topbar {') && appShell.includes('height: 64px')],
  ['Profile menu is canonically owned', appShell.includes('.profile-menu-button') && appShell.includes('.profile-dropdown.is-open')],
  ['Mobile topbar remains responsive-owned', responsive.includes('.topbar {') && responsive.includes('--staff-mobile-topbar-height')],
  ['Legacy style no longer owns app chrome', !forbidden.test(legacy)],
  ['Polish no longer owns app chrome', !forbidden.test(polish)],
  ['Training domain no longer owns app chrome', !forbidden.test(training)],
  ['Canonical app shell has no important escalation', !appShell.includes('!important')],
  ['Canonical app shell uses only the documented legacy compact-desktop breakpoint', [...appShell.matchAll(/@media\s*\(([^)]*)\)(?:\s*and\s*\(([^)]*)\))?/g)].every(([, a, b]) => `${a} ${b || ''}`.includes('1100px') && `${a} ${b || ''}`.includes('761px'))],
  ['Canonical app shell consumes DS tokens', appShell.includes('var(--staff-color-bg-header)') && appShell.includes('var(--staff-color-border-subtle)')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS Legacy Cleanup Pass 7: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
