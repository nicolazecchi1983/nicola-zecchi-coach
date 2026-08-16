import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const tokens = fs.readFileSync('src/design-system/tokens.css', 'utf8')
const primitives = fs.readFileSync('src/design-system/primitives.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const product = fs.readFileSync('src/design-system/productUi.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const requiredTokens = [
  '--staff-color-text-secondary', '--staff-color-text-faint',
  '--staff-color-primary-contrast', '--staff-color-danger-soft',
  '--staff-radius-small', '--staff-radius-medium', '--staff-radius-large',
  '--staff-touch-target-min: 44px', '--staff-touch-target: 48px',
  '--staff-font-family', '--staff-font-subsection-title', '--staff-font-kpi',
  '--staff-motion-fast', '--staff-motion-normal', '--staff-ease-standard',
  '--staff-content-readable', '--staff-content-standard',
  '--staff-breakpoint-compact-mobile: 390px', '--staff-breakpoint-mobile: 760px',
  '--staff-breakpoint-tablet: 980px', '--staff-breakpoint-wide: 1180px',
]

const checks = [
  ['Foundation tokens document canonical palette/spacing/type/responsive roles', requiredTokens.every((token) => tokens.includes(token))],
  ['Canonical spacing remains the 4/8/16/24/32/48 scale', ['4px','8px','16px','24px','32px','48px'].every((v,i) => tokens.includes(`--staff-space-${i+1}: ${v}`))],
  ['Compact controls respect the 44px accessibility floor', tokens.includes('--staff-control-height-compact: 44px')],
  ['Primary and danger primitive colors come from tokens', primitives.includes('var(--staff-color-primary-contrast)') && primitives.includes('var(--staff-color-danger-soft)') && primitives.includes('var(--staff-color-danger-border)') && primitives.includes('var(--staff-color-danger-text)')],
  ['Primitives contain no raw hex/rgb color literals', !/(#[0-9a-f]{3,8}\b|rgba?\()/i.test(primitives)],
  ['Primitive motion consumes canonical motion tokens', primitives.includes('var(--staff-motion-normal)') && primitives.includes('var(--staff-ease-standard)')],
  ['Primitive mobile tier converges on canonical 760px', primitives.includes('@media (max-width: 760px)') && !primitives.includes('max-width: 720px')],
  ['Responsive layer consumes touch tokens instead of owning duplicates', !responsive.includes('--staff-touch-target:') && responsive.includes('var(--staff-touch-target)')],
  ['Product UI consumes canonical secondary/faint text colors', product.includes('var(--staff-color-text-secondary)') && product.includes('var(--staff-color-text-faint)')],
  ['Product UI no longer hardcodes its three legacy text hex values', !product.includes('#526a7e') && !product.includes('#9fb3c0') && !product.includes('#fff')],
  ['No parallel --ui token family is introduced in foundation files', !tokens.includes('--ui-') && !primitives.includes('--ui-')],
  ['Foundation contract is part of the release gate', releaseGateIncludes(pkg, 'check:design-system-foundation-contract')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS1.1 Design System Foundation Contract: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
