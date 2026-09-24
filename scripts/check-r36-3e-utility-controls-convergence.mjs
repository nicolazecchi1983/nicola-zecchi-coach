import fs from 'node:fs'

const css = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8').replace(/\r\n?/g, '\n')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8').replace(/\r\n?/g, '\n')
const controls = fs.readFileSync('src/design-system/controls.css', 'utf8').replace(/\r\n?/g, '\n')
const legacy = fs.readFileSync('src/design-system/training-editor.css', 'utf8').replace(/\r\n?/g, '\n')
const r36e = css.split('/* R36.3G — SEARCH SINGLE INPUT SURFACE')[1] || ''

const checks = [
  ['R36.3D 50/50 utility geometry remains canonical', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));') && css.includes('align-items: stretch;')],
  ['Search wrapper is structural and unpainted', r36e.includes('Wrapper is structural only') && r36e.includes('border: 0;') && r36e.includes('background: transparent;') && r36e.includes('box-shadow: none;')],
  ['Search input keeps canonical control height while wrapper stays structural', r36e.includes('min-height: var(--staff-control-height);') && r36e.includes('[data-player-search] {') && r36e.includes('padding-right: 48px;')],
  ['Search input is the only visible control surface', r36e.includes('[data-player-search] {') && !r36e.includes('[data-player-search] {\n  flex: 1 1 auto;') && r36e.includes('padding-right: 48px;')],
  ['Clear action is positioned inside the input surface', r36e.includes('[data-clear-player-search] {') && r36e.includes('position: absolute;') && r36e.includes('right: 4px;') && r36e.includes('border: 0;')],
  ['Clear action preserves compact 40px geometry', r36e.includes('[data-clear-player-search] {') && r36e.includes('width: 40px;') && r36e.includes('min-width: 40px;') && r36e.includes('height: 40px;') && r36e.includes('min-height: 40px;')],
  ['Focus visibility returns to the canonical input owner', !r36e.includes('.ts-player-search--roster:focus-within') && !r36e.includes('[data-player-search]:focus,')],
  ['Search hooks remain unchanged', view.includes('data-player-search') && view.includes('data-clear-player-search')],
  ['Aggregati disclosure markup remains untouched', view.includes('data-aggregated-menu') && view.includes('data-aggregated-total') && view.includes('data-aggregated-summary')],
  ['R36.3E adds no important escalation', !r36e.includes('!important')],
  ['R36.3F controls neutralization override is retired', !controls.includes('R36.3F TRAINING ROSTER SEARCH SINGLE SURFACE')],
  ['Legacy Training search visual owner is retired', !legacy.includes('.ts-player-search{') && !legacy.includes('.ts-player-search input{') && !legacy.includes('.ts-player-search button{')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3E Utility Controls Convergence: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
