import fs from 'node:fs'

const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8')
const marker = 'R2.6J — TRAINING MOBILE OWNERSHIP CLEANUP'
const domain = polish.slice(polish.indexOf(marker))
const m13cStart = responsive.indexOf('M1.3C — TRAINING MOBILE COMMAND ROW + PHASE WIDTH')
const m13fStart = responsive.indexOf('M1.3F — MATCH TEAM MOBILE WIDTH')
const m13c = responsive.slice(m13cStart, m13fStart)

const checks = [
 ['R2.6J Training owner exists', polish.includes(marker)],
 ['global responsive no longer owns parallel-work presentation', !responsive.includes('.ts-manual-editor .ts-parallel-work')],
 ['Training domain owns parallel-work raised surface', domain.includes('.ts-manual-editor .ts-parallel-work') && domain.includes('background: var(--staff-color-bg-panel-raised)')],
 ['Training domain owns stacked mobile parallel grid', domain.includes('.ts-parallel-work-grid') && domain.includes('grid-template-columns: 1fr')],
 ['Training domain owns compact parallel heading', domain.includes('@media (max-width: 390px)') && domain.includes('.ts-parallel-work-head')],
 ['superseded M1.3C two-column phase meta rule is retired', !m13c.includes('.ts-phase-meta-fields')],
 ['redundant 430px Training phase-meta media block is retired', !responsive.includes('@media (max-width: 430px) {\n  .ts-manual-editor .ts-phase-meta-fields')],
 ['DS2.3 remains canonical mobile phase-meta owner', responsive.includes('DS2.3 — TRAINING POLISH MOBILE ADAPTATION') && responsive.includes('.ts-manual-editor .ts-phase-meta-fields {\n    grid-template-columns: 1fr;')],
 ['no important escalation in migrated domain layer', !domain.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){ console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nR2.6J Training Mobile Ownership Cleanup: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
