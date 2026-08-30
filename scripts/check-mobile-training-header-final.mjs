import fs from 'node:fs'
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8')
const commandBar = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const start = commandBar.indexOf('R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8')
const layer = commandBar.slice(start)
const headerStart = polish.indexOf('R2.6K — TRAINING MOBILE HEADER OWNERSHIP · CLUSTER 2')
const header = polish.slice(headerStart)
const checks = [
  ['canonical mobile command owner exists', start >= 0],
  ['Training domain owns mobile titlebar spacing', headerStart >= 0 && header.includes('.ts-manual-editor .ts-editor-titlebar') && header.includes('margin-bottom: var(--staff-space-3)')],
  ['command layer does not re-own Training titlebar', !layer.includes('.ts-editor-titlebar')],
  ['mobile command group uses elastic select + indivisible action cluster', layer.includes('grid-template-columns: minmax(0, 1fr) auto') && layer.includes('.ts-command-actions')],
  ['published TS selector owns first command cell', layer.includes('.ts-open-sheet') && layer.includes('grid-column: 1;') && layer.includes('grid-row: 1;')],
  ['action cluster owns second command cell', layer.includes('.ts-command-actions') && layer.includes('grid-column: 2;') && layer.includes('grid-row: 1;')],
  ['Open TS and More are inseparable inside action cluster', layer.includes('.ts-command-actions') && layer.includes('display: flex;') && layer.includes('gap: 6px') && layer.includes('.ts-more-menu')],
  ['primary controls preserve accessible 44px touch height', layer.includes('grid-template-rows: 44px 24px') && layer.includes('height: 44px')],
  ['draft badge is status-only below command row', layer.includes('.ts-draft-state--compact') && layer.includes('grid-column: 1 / -1;') && layer.includes('grid-row: 2;')],
  ['phase layout is not owned by command-bar layer', !layer.includes('.ts-phase-editor') && !layer.includes('[data-phase]')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nMobile Training Header Canonical: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
