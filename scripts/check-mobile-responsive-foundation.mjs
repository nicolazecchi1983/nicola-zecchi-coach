import fs from 'node:fs'

const tokens = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md', 'utf8')

const checks = [
  ['Responsive foundation is loaded', main.includes("./design-system/responsive.css")],
  ['Canonical tablet breakpoint exists', tokens.includes('@media (max-width: 980px)')],
  ['Canonical mobile breakpoint exists', tokens.includes('@media (max-width: 760px)')],
  ['Canonical compact-mobile breakpoint exists', tokens.includes('@media (max-width: 390px)')],
  ['Canonical touch target is 48px', tokens.includes('--staff-touch-target: 48px')],
  ['Minimum touch target is documented', tokens.includes('--staff-touch-target-min: 44px')],
  ['Safe-area variables are centralized', tokens.includes('--staff-safe-bottom: env(safe-area-inset-bottom, 0px)')],
  ['Dynamic viewport fallback exists', tokens.includes('--staff-viewport-height: 100vh') && tokens.includes('100dvh')],
  ['Shared responsive actions primitive exists', tokens.includes('.staff-responsive-actions')],
  ['Shared responsive page primitive exists', tokens.includes('.staff-responsive-page')],
  ['Contract forbids horizontal-scroll-as-default', contract.includes('Horizontal scrolling is an explicit interaction choice')],
  ['Contract protects domain and persistence', contract.includes('must not alter domain logic')],
  ['PWA is gated after mobile readiness', contract.includes('PWA work starts only after')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}

// Inventory is informational: legacy breakpoints are technical debt, not a M1.1 failure.
const cssFiles = ['src/style.css', 'src/design-system/polish.css', 'src/design-system/training-editor.css']
const legacyBreakpoints = new Set()
for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8')
  for (const match of css.matchAll(/@media\s*\((?:max|min)-width:\s*([0-9]+)px\)/g)) legacyBreakpoints.add(Number(match[1]))
}
console.log(`\nLegacy breakpoint inventory: ${[...legacyBreakpoints].sort((a,b)=>a-b).join(', ')}`)
console.log(`M1.1 Mobile Responsive Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
