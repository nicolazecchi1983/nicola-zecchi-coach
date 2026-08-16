import fs from 'node:fs'

const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')

const checks = [
  ['Training steps are structural wrappers, not Product UI surfaces', !view.includes('ts-form-card product-surface ts-step') && view.includes('class="ts-form-card ts-step')],
  ['step wrapper has no visual geometry', /\.ts-manual-editor \.ts-workspace--steps > \.ts-manual-form > \.ts-form-card\s*\{[^}]*margin:\s*0;[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;/s.test(polish)],
  ['draft state belongs to the Training command group', /<div class="ts-editor-actions">[\s\S]*data-ts-draft-state[\s\S]*<\/div>/.test(view)],
  ['mobile draft state sits below actions and cannot overlap', responsive.includes('DS2.3 — TRAINING COMMAND BAR · CANONICAL MOBILE OWNER') && responsive.includes('grid-row: 2;') && responsive.includes('transform: none;')],
  ['mobile Training title has a domain-specific size token', polish.includes('--staff-mobile-page-title-size:') && responsive.includes('var(--staff-mobile-page-title-size')],
  ['Match Day clear state is explicit, not an ambiguous dash', view.includes("${md || 'Nessuno'}") && !view.includes("${md || '—'}")],
  ['Match Day clear state comes after operational values', view.indexOf("['PREPARAZIONE','MD+1'") >= 0 && view.indexOf("'MD','']") >= 0],
  ['Match Day uses a nine-cell desktop grid', polish.includes('grid-template-columns: repeat(9, minmax(0, 1fr))')],
  ['Preparation label receives compact typography rather than special color', polish.includes('button[data-md="PREPARAZIONE"]') && polish.includes('var(--staff-font-label)')],
  ['clear Match Day is visually secondary', polish.includes('button[data-md=""]') && polish.includes('var(--staff-color-text-faint)')],
  ['R2 introduces no important in Training polish', !polish.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.3-R2 Training Integration: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
