import fs from 'node:fs'

const training = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const product = fs.readFileSync('src/design-system/productUi.css', 'utf8')

const checks = [
  ['Training step wrapper is visually neutral', training.includes('.ts-manual-editor .ts-workspace--steps > .ts-manual-form > .ts-form-card')],
  ['Training step wrapper removes padding', /\.ts-manual-editor \.ts-workspace--steps > \.ts-manual-form > \.ts-form-card\s*\{[^}]*padding:\s*0;/s.test(training)],
  ['Training step wrapper removes border', /\.ts-manual-editor \.ts-workspace--steps > \.ts-manual-form > \.ts-form-card\s*\{[^}]*border:\s*0;/s.test(training)],
  ['Training step wrapper is transparent', /\.ts-manual-editor \.ts-workspace--steps > \.ts-manual-form > \.ts-form-card\s*\{[^}]*background:\s*transparent;/s.test(training)],
  ['Session content keeps its own surface', training.includes('.ts-manual-editor .ts-session-grid') && training.includes('background: var(--staff-color-bg-panel);')],
  ['Product UI no longer forces Training card background', !/\.training-product-shell \.ts-form-card\s*\{[^}]*background:[^}]*!important/s.test(product)],
  ['Product UI no longer forces Training card border', !/\.training-product-shell \.ts-form-card\s*\{[^}]*border-color:[^}]*!important/s.test(product)],
  ['No new important in DS2.3 R1 owner rule', !/\.ts-manual-editor \.ts-workspace--steps > \.ts-manual-form > \.ts-form-card\s*\{[^}]*!important/s.test(training)],
]
let passed=0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nDS2.3-R1 Training Step Surface: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
