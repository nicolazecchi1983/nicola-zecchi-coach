import fs from 'node:fs'
const css = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const start = css.indexOf('R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8')
const command = css.slice(start)
const checks = [
  ['canonical command row exists', start >= 0],
  ['selector receives residual width beside a compact action cluster', command.includes('grid-template-columns: minmax(0, 1fr) auto') && command.includes('.ts-command-actions')],
  ['selector can shrink correctly', command.includes('.ts-open-sheet select') && command.includes('min-width: 0')],
  ['Open action is bounded', command.includes('.ts-open-button') && command.includes('max-width: 44px')],
  ['More action is bounded', command.includes('.ts-more-menu') && command.includes('min-width: 44px')],
  ['draft status is separated from actions', command.includes('grid-template-rows: 44px 24px') && command.includes('grid-row: 2')],
  ['compact mobile keeps the same structural grid', command.includes('@media (max-width: 390px)') && !command.includes('grid-template-columns: minmax(0, 1fr) 74px')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nMobile Training Command Row Canonical: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
