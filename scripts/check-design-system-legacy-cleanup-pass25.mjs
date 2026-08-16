import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const editor = fs.readFileSync('src/design-system/training-editor.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['global legacy marks Training flow migration', style.includes('A.13.3–A.13.4-R2 Training flow ownership migrated')],
  ['global legacy no longer owns ts-workspace steps', !style.includes('.ts-workspace--steps{display:block;max-width:1180px')],
  ['global legacy no longer owns ts-step footer', !style.includes('.ts-step-footer{position:static!important;display:flex!important')],
  ['global legacy no longer owns parallel work', !style.includes('.ts-parallel-work{margin-top:14px')],
  ['global legacy no longer owns archive button', !style.includes('.ts-archive-button {')],
  ['global legacy no longer owns Training paper brand logo', !style.includes('.ts-paper-brand-logo {')],
  ['training editor owns migrated flow residual', editor.includes('TRAINING FLOW / WORKFLOW RESIDUAL · migrated from legacy style.css in 0.27.38')],
  ['training editor retains step workflow contract', editor.includes('.ts-workspace--steps{display:block;max-width:1180px')],
  ['training editor retains parallel work contract', editor.includes('.ts-parallel-work{margin-top:14px')],
  ['training editor retains archive state contract', editor.includes('.ts-archive-button {')],
  ['training editor retains Training Sheet brand logo', editor.includes('.ts-paper-brand-logo {')],
  ['Training editor remains before canonical Training polish', main.indexOf("./design-system/training-editor.css") < main.indexOf("./modules/training/trainingPolish.css")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 25: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
