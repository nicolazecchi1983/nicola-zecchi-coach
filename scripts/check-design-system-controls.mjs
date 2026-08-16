import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const controls = read('src/design-system/controls.css')
const main = read('src/main.js')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['controls layer exists and is substantial', controls.length > 5000],
  ['controls loaded after page shell', main.indexOf("./design-system/controls.css") > main.indexOf("./design-system/pageShell.css")],
  ['controls loaded before responsive final', main.indexOf("./design-system/controls.css") < main.indexOf("./design-system/responsive.css")],
  ['primary buttons use STAFF primary token', controls.includes('background: var(--staff-color-primary);')],
  ['secondary buttons consume canonical surface/border tokens', controls.includes('var(--staff-control-bg)') && controls.includes('var(--staff-control-border)')],
  ['form focus uses canonical focus shadow', controls.includes('box-shadow: var(--staff-shadow-focus);')],
  ['mobile controls preserve preferred touch target', controls.includes('min-height: var(--staff-touch-target);')],
  ['checkbox/radio use canonical accent', controls.includes('accent-color: var(--staff-color-primary);')],
  ['controls layer introduces no important overrides', !controls.includes('!important')],
  ['controls layer introduces no raw hex colors', !/#[0-9a-fA-F]{3,8}\b/.test(controls)],
  ['primary hover avoids decorative transform', controls.includes('transform: none;') && !controls.includes('translateY(')],
  ['release exposes DS1.3 gate', Boolean(pkg.scripts['check:design-system-controls'])],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nDS1.3 Buttons, Forms & Controls: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
