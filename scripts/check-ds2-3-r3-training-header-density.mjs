import fs from 'node:fs'

const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')

const checks = [
  ['published Training Sheet label is removed from editor header', !view.includes('<span>Training Sheet pubblicate</span>')],
  ['embedded published-sheet selector is retired', !view.includes('Seleziona TS pubblicata') && !view.includes('data-open-training-sheet')],
  ['embedded Apri TS action is retired', !view.includes('data-open-training-sheet-button') && !view.includes('ts-open-button')],
  ['Training polish no longer owns a redundant selector label rule', !polish.includes('.ts-manual-editor .ts-open-sheet > span')],
  ['mobile Training title no longer overrides the shared page-title scale', !polish.includes('--staff-mobile-page-title-size:')],
  ['R3 remains presentation-only', !view.includes('supabase') && !polish.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.3-R3 Training Header Density: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
