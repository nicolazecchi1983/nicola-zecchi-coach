import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const surfaces = fs.readFileSync('src/design-system/surfaces.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const product = fs.readFileSync('src/design-system/productUi.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const tests = [
  ['surface layer is loaded', main.includes("import './design-system/surfaces.css'")],
  ['surface layer loads after controls', main.indexOf("controls.css") < main.indexOf("surfaces.css")],
  ['surface layer loads before final responsive', main.indexOf("surfaces.css") < main.indexOf("responsive.css")],
  ['canonical surface primitive exists', surfaces.includes('.staff-surface') && surfaces.includes('--staff-surface-bg')],
  ['canonical section primitive exists', surfaces.includes('.staff-section')],
  ['legacy shared cards converge', surfaces.includes('.player-card') && surfaces.includes('.settings-card') && surfaces.includes('.library-sheet-card')],
  ['dashboard nested summary is visually quieter', surfaces.includes('.training-summary div') && surfaces.includes('background: transparent')],
  ['empty states do not add another heavy fill', surfaces.includes('.product-empty-state') && surfaces.includes('.placeholder-panel')],
  ['product surface border uses subtle foundation token', product.includes('--product-border:var(--staff-color-border-subtle);')],
  ['surface layer introduces no raw hex colors', !/#[0-9a-f]{3,8}\b/i.test(surfaces)],
  ['surface layer introduces no important overrides', !/!important/.test(surfaces)],
  ['DS1.4 check belongs to aggregate release gate', releaseGateIncludes(pkg, 'check:design-system-surfaces')],
]

let passed = 0
for (const [name, ok] of tests) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (ok) passed += 1
}
console.log(`\nDS1.4 Surfaces, Cards & Section Hierarchy: ${passed}/${tests.length}`)
if (passed !== tests.length) process.exit(1)
