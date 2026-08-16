import fs from 'node:fs'

const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')

const checks = [
  ['published Training Sheet label is removed from editor header', !view.includes('<span>Training Sheet pubblicate</span>')],
  ['selector explains published-sheet context directly', view.includes('<option value="">Seleziona TS pubblicata</option>')],
  ['selector keeps an explicit accessible label', view.includes('aria-label="Seleziona Training Sheet pubblicata"')],
  ['Training polish no longer owns a redundant selector label rule', !polish.includes('.ts-manual-editor .ts-open-sheet > span')],
  ['mobile Training title is deliberately lighter than R2', polish.includes('--staff-mobile-page-title-size: clamp(1.52rem, 6.4vw, 1.86rem)')],
  ['R3 remains presentation-only', !view.includes('supabase') && !polish.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.3-R3 Training Header Density: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
