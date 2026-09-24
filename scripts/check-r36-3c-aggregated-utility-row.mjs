import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const events = read('src/modules/training/events/trainingEditorEvents.js')
const css = read('src/modules/training/trainingPolish.css')
const r36c = css.split('/* R36.3C — AGGREGATI UTILITY ROW */')[1] || ''

const toolbar = view.indexOf('ts-roster-list-toolbar')
const aggregated = view.indexOf('ts-roster-aggregated', toolbar)
const list = view.indexOf('data-roster-list', toolbar)

const checks = [
  ['Aggregati is inside the Rosa utility row before the player list', toolbar >= 0 && toolbar < aggregated && aggregated < list],
  ['Aggregati exists exactly once in active Step 02 markup', (view.match(/class="ts-roster-aggregated"/g) || []).length === 1],
  ['Aggregati disclosure is closed in markup by default', view.includes('data-aggregated-menu') && !/<details[^>]*data-aggregated-menu[^>]*\sopen(?:\s|>)/.test(view)],
  ['Runtime closes Aggregati on init/restore regardless of saved quantity', events.includes('if (menu && !keepOpen) menu.open = false') && !events.includes('menu.open = keepOpen || total > 0')],
  ['Editing quantities does not collapse an already open disclosure', events.includes('syncAggregatedUi({ keepOpen: true })')],
  ['Closed summary exposes total count', view.includes('data-aggregated-total') && events.includes("totalNode.textContent = String(total)")],
  ['Empty state is explicit', view.includes('Nessun aggregato') && events.includes(": 'Nessun aggregato'")],
  ['Youth source label is never abbreviated in summary', events.includes('Settore giovanile ${youthCount}') && !events.includes('`Settore ${youthCount}`')],
  ['Source inputs remain independent and canonical', view.includes('aggregated_prova_count') && view.includes('aggregated_youth_count')],
  ['Legacy compatibility fields remain present', view.includes('name="aggregated" type="hidden"') && view.includes('name="aggregated_count" type="hidden"')],
  ['Present count still includes Aggregati through canonical arithmetic', events.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['Desktop utility row has equal Search + Aggregati columns and shared row height', css.includes('R36.3D — ROSTER UTILITY ROW ALIGNMENT') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));') && css.includes('align-items: stretch;') && css.includes('.ts-aggregated-menu:not([open]) > summary') && css.includes('flex: 1 1 auto;')],
  ['Mobile Aggregati panel stacks to one column', /@media \(max-width: 760px\)[\s\S]*?\.ts-manual-editor \.ts-roster-aggregated \.ts-aggregated-panel\s*\{[\s\S]*?grid-template-columns:\s*1fr;/.test(css)],
  ['R36.3C uses Training tokens and no important escalation', r36c.includes('var(--staff-control-border)') && r36c.includes('var(--staff-control-bg)') && !r36c.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3C Aggregati Utility Row: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
