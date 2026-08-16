import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const legacy = fs.readFileSync('src/style.css', 'utf8')
const dashboard = fs.readFileSync('src/modules/dashboard/dashboardPolish.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const forbiddenLegacy = [
  '.dashboard-professional { display:grid',
  '.dashboard-primary-grid { display:grid',
  '.dashboard-feature-card,.dashboard-week-card',
  'Tutti i sette giorni visibili: contenuto essenziale',
  'Dashboard: fino a tre partite, gerarchia chiara',
  '.dashboard-week-card .ghost-button {',
  '.dashboard-match-item > button {\n  width: 100%;\n  padding: 15px 16px',
]

const checks = [
  ['legacy dashboard visual owner removed from style.css', forbiddenLegacy.every((needle) => !legacy.includes(needle))],
  ['dashboard canonical owner keeps primary structure', dashboard.includes('.dashboard-primary-grid') && dashboard.includes('grid-template-columns: minmax(0, 1.15fr)')],
  ['dashboard canonical owner owns overflow safety', dashboard.includes('.dashboard-match-item h2,') && dashboard.includes('overflow-wrap: anywhere')],
  ['dashboard canonical owner owns match-list structural reset', dashboard.includes('.dashboard-next-match') && dashboard.includes('.dashboard-match-item {')],
  ['dashboard mobile canonical owner is adaptive agenda', dashboard.includes('@media (max-width: 760px)') && dashboard.includes('grid-template-columns: 58px minmax(0, 1fr)')],
  ['legacy compressed seven-column mobile agenda removed', !legacy.includes('.dashboard-day > header span { font-size: .52rem; }')],
  ['legacy dashboard selectors removed from global width safety list', !legacy.includes('.dashboard-professional,') && !legacy.includes('.dashboard-primary-grid,') && !legacy.includes('.dashboard-feature-card,')],
  ['obsolete dashboard-layout classes removed because current view no longer uses them', !legacy.includes('.dashboard-layout {') && !legacy.includes('.dashboard-layout--compact')],
  ['dashboard empty state moved to canonical owner', dashboard.includes('.dashboard-empty-state {') && !legacy.includes('.dashboard-empty-state {')],
  ['pass2 check is included in release gate', releaseGateIncludes(pkg, 'check:design-system-legacy-cleanup-pass2')],
]
let passed=0
for (const [label, ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nDS Legacy Cleanup Pass 2: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
