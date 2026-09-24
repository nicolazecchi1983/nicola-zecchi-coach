import fs from 'node:fs'
const css = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const start = css.indexOf('R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8')
const command = css.slice(start)
const checks = [
  ['canonical command row exists', start >= 0],
  ['compact command group uses one action column', command.includes('grid-template-columns: auto') && command.includes('.ts-command-actions')],
  ['retired published-sheet selector is absent', !command.includes('.ts-open-sheet')],
  ['retired Open action is absent', !command.includes('.ts-open-button')],
  ['More action is bounded', command.includes('.ts-more-menu') && command.includes('min-width: 44px')],
  ['draft status is owned by header metadata, not command row', !command.includes('.ts-draft-state--compact') && !command.includes('grid-template-rows: 44px 24px')],
  ['mobile keeps the compact action/status grid', command.includes('@media (max-width: 760px)') && command.includes('grid-template-columns: auto') && !command.includes('@media (max-width: 390px)')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nMobile Training Command Row Canonical: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
