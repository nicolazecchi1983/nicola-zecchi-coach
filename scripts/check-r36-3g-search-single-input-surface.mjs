import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const controls = read('src/design-system/controls.css')
const css = read('src/modules/training/trainingPolish.css')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const r36g = css.split('/* R36.3G — SEARCH SINGLE INPUT SURFACE')[1] || ''

const checks = [
  ['wrapper is structural only', /\.ts-manual-editor \.ts-player-search--roster\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s.test(css)],
  ['wrapper no longer owns focus-within surface', !r36g.includes('.ts-player-search--roster:focus-within')],
  ['input is full-width canonical visual owner', r36g.includes('[data-player-search] {') && r36g.includes('width: 100%;') && r36g.includes('min-height: var(--staff-control-height);')],
  ['input reserves space for clear action', r36g.includes('padding-right: 48px;')],
  ['clear action is inside the input geometry', r36g.includes('[data-clear-player-search] {') && r36g.includes('position: absolute;') && r36g.includes('top: 50%;') && r36g.includes('right: 4px;')],
  ['clear action has no second border/background surface', /\[data-clear-player-search\]\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s.test(r36g)],
  ['native search cancel is hidden to avoid duplicate clear affordance', r36g.includes('::-webkit-search-cancel-button') && r36g.includes('-webkit-appearance: none;')],
  ['temporary wrapper-owned controls override is gone', !controls.includes('R36.3F TRAINING ROSTER SEARCH SINGLE SURFACE')],
  ['active markup still has one search input and one clear hook', (view.match(/data-player-search/g) || []).length >= 1 && (view.match(/data-clear-player-search/g) || []).length >= 1],
  ['Search and Aggregati remain 50/50 peers', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['Aggregati behavior remains untouched', view.includes('data-aggregated-menu') && view.includes('ts-roster-aggregated__action-open')],
  ['R36.3G adds no important escalation', !r36g.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3G Search Single Input Surface: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
