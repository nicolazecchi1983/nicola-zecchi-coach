import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const editor = fs.readFileSync('src/design-system/training-editor.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['global legacy marks V6.3 Training migration', style.includes('Training ownership migrated to training-editor.css in 0.27.39')],
  ['global legacy no longer owns Training watermark', !style.includes('.ts-watermark')],
  ['global legacy no longer owns Training session grid', !style.includes('.ts-session-grid')],
  ['global legacy no longer owns Training load layout', !style.includes('.ts-match-day-block') && !style.includes('.ts-load-focus')],
  ['global legacy no longer owns Training phase meta layout', !style.includes('.ts-phase-meta-fields')],
  ['training editor owns V6.3 residual baseline', editor.includes('TRAINING V6.3 RESIDUAL BASELINE · migrated from legacy style.css in 0.27.39')],
  ['training editor retains watermark contract', editor.includes('.ts-watermark')],
  ['training editor retains session grid contract', editor.includes('.ts-session-grid')],
  ['training editor retains phase metadata contract', editor.includes('.ts-phase-meta-fields')],
  ['training editor retains load layout contract', editor.includes('.ts-match-day-block') && editor.includes('.ts-load-focus')],
  ['Training editor remains before Training polish', main.indexOf("./design-system/training-editor.css") < main.indexOf("./modules/training/trainingPolish.css")],
  ['responsive remains final CSS owner', main.trim().indexOf("./design-system/responsive.css") > main.indexOf("./modules/training/trainingCommandBar.css")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 26: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
