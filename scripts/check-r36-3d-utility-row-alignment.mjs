import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const css = read('src/modules/training/trainingPolish.css')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const events = read('src/modules/training/events/trainingEditorEvents.js')
const r36d = css.split('/* R36.3D — ROSTER UTILITY ROW ALIGNMENT */')[1] || ''

const checks = [
  ['desktop Search and Aggregati are equal-width peers', r36d.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['utility row stretches peer controls on the same vertical axis', r36d.includes('align-items: stretch;')],
  ['Aggregati outer item participates in row stretch', r36d.includes('display: flex;') && r36d.includes('align-self: stretch;')],
  ['Aggregati card stretches without fixed pixel height', r36d.includes('.ts-selection-card.ts-aggregated-select') && r36d.includes('align-items: stretch;') && !r36d.includes('min-height: 70px')],
  ['closed disclosure fills peer row while open state can grow naturally', r36d.includes('.ts-aggregated-menu:not([open]) > summary') && r36d.includes('flex: 1 1 auto;')],
  ['mobile still collapses utility row to one column', /@media \(max-width: 760px\)[\s\S]*?\.ts-manual-editor \.ts-roster-list-toolbar\s*\{[\s\S]*?grid-template-columns:\s*1fr;/.test(css)],
  ['Aggregati remains closed by default in markup', view.includes('data-aggregated-menu') && !/<details[^>]*data-aggregated-menu[^>]*\sopen(?:\s|>)/.test(view)],
  ['full Settore giovanile label remains canonical', events.includes('Settore giovanile ${youthCount}')],
  ['present arithmetic remains canonical', events.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['no important escalation in R36.3D owner', !r36d.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3D Utility Row Alignment: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
