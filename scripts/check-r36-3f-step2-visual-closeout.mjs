import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const controls = read('src/design-system/controls.css')
const legacy = read('src/design-system/training-editor.css')
const css = read('src/modules/training/trainingPolish.css')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const events = read('src/modules/training/events/trainingEditorEvents.js')
const r36e = css.split('/* R36.3E — UTILITY CONTROLS CONVERGENCE */')[1] || ''

const checks = [
  ['legacy Training no longer owns roster search surfaces', !legacy.includes('.ts-player-search{') && !legacy.includes('.ts-player-search input{') && !legacy.includes('.ts-player-search button{')],
  ['temporary R36.3F nested-search exemption is retired', !controls.includes('R36.3F TRAINING ROSTER SEARCH SINGLE SURFACE')],
  ['Training wrapper no longer competes with the canonical input surface', css.includes('R36.3G — SEARCH SINGLE INPUT SURFACE') && /\.ts-manual-editor \.ts-player-search--roster\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s.test(css)],
  ['native webkit search decoration is retired beside custom clear action', css.includes('[data-player-search]::-webkit-search-cancel-button') && css.includes('-webkit-appearance: none;')],
  ['canonical input reserves space for the internal clear action', css.includes('[data-player-search] {') && css.includes('padding-right: 48px;') && css.includes('[data-clear-player-search] {') && css.includes('position: absolute;')],
  ['search and Aggregati remain 50/50 peers', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['Aggregati native disclosure remains closed by default', view.includes('data-aggregated-menu') && !/<details[^>]*data-aggregated-menu[^>]*\sopen(?:\s|>)/.test(view)],
  ['Aggregati exposes visual Gestisci and Chiudi states', view.includes('ts-roster-aggregated__action-closed') && view.includes('ts-roster-aggregated__action-open') && css.includes('[open] .ts-roster-aggregated__action-open')],
  ['open Aggregati panel has one divider surface', css.includes('border-top: 1px solid var(--staff-control-border);')],
  ['Aggregati source rows are flat rather than nested cards', /\.ts-manual-editor \.ts-roster-aggregated \.ts-aggregated-source-row\s*\{[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;/s.test(css)],
  ['Prova and Settore inputs remain canonical independent fields', view.includes('aggregated_prova_count') && view.includes('aggregated_youth_count')],
  ['full Settore giovanile summary label remains canonical', events.includes('Settore giovanile ${youthCount}')],
  ['present arithmetic remains unchanged', events.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['R36.3F adds no important escalation', !(controls.split('R36.3F TRAINING ROSTER SEARCH SINGLE SURFACE')[1] || '').includes('!important') && !r36e.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3F Step 02 Visual Closeout: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
