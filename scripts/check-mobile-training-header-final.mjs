import fs from 'node:fs'
const css = fs.readFileSync('src/design-system/responsive.css','utf8')
const start = css.indexOf('DS2.3 — TRAINING COMMAND BAR · CANONICAL MOBILE OWNER')
const layer = css.slice(start)
const checks = [
  ['canonical mobile command owner exists', start >= 0],
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
