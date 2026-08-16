import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const editor = fs.readFileSync('src/design-system/training-editor.css', 'utf8')
const roster = fs.readFileSync('src/modules/roster/roster.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['global legacy marks Training V6.2 migration', style.includes('TRAINING EDITOR V6.2–V6.2.5 — ownership migrated')],
  ['global legacy no longer owns ts-workspace base', !style.includes('.ts-workspace { display:grid; grid-template-columns:minmax(0, .95fr)')],
  ['global legacy no longer owns ts-paper base', !style.includes('.ts-paper { width:100%; min-height:760px')],
  ['global legacy no longer owns PDF confirmation overlay base', !style.includes('.ts-pdf-confirm-overlay{position:fixed;inset:0;z-index:9999')],
  ['training editor owns consolidated baseline', editor.includes('TRAINING ACTIVE BASELINE · consolidated from legacy style.css in 0.27.37')],
  ['training editor retains preview base contract', editor.includes('.ts-paper { width:100%; min-height:760px')],
  ['training editor retains print contract', editor.includes('[data-ts-preview], [data-ts-preview] * { visibility: visible !important; }')],
  ['training editor retains PDF confirmation overlay', editor.includes('.ts-pdf-confirm-overlay{position:fixed;inset:0;z-index:9999')],
  ['roster department layout belongs to roster owner', roster.includes('.squad-departments{display:grid;gap:28px}')],
  ['training editor does not own roster department layout', !editor.includes('.squad-departments{display:grid;gap:28px}')],
  ['training editor stylesheet remains loaded before Training polish', main.indexOf("./design-system/training-editor.css") < main.indexOf("./modules/training/trainingPolish.css")],
  ['responsive remains final Training presentation owner', main.indexOf("./modules/training/trainingPolish.css") < main.indexOf("./design-system/responsive.css")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 24: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
