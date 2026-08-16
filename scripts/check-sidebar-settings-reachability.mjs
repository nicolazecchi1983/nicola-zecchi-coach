import fs from 'node:fs'

const nav = fs.readFileSync('src/app/appNavigation.js', 'utf8')
const shell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const checks = [
  ['desktop settings entry exists', /\['settings',\s*'Impostazioni',\s*'settings'\]/.test(nav)],
  ['sidebar is a flex column', /\.sidebar\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/.test(shell)],
  ['nav owns remaining height', /\.sidebar-nav\s*\{[\s\S]*?flex:\s*1\s+1\s+auto;/.test(shell)],
  ['nav can shrink', /\.sidebar-nav\s*\{[\s\S]*?min-height:\s*0;/.test(shell)],
  ['nav scrolls vertically', /\.sidebar-nav\s*\{[\s\S]*?overflow-y:\s*auto;/.test(shell)],
  ['horizontal overflow suppressed', /\.sidebar-nav\s*\{[\s\S]*?overflow-x:\s*hidden;/.test(shell)],
]
for (const [label, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${label}`)
const failed = checks.filter(([, ok]) => !ok)
console.log(`\nSidebar Settings Reachability: ${checks.length - failed.length}/${checks.length}`)
if (failed.length) process.exit(1)
