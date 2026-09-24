import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const events = read('src/modules/training/events/trainingEditorEvents.js')
const css = read('src/modules/training/trainingPolish.css')
const legacy = read('src/design-system/training-editor.css')
const responsive = read('src/design-system/responsive.css')
const h1 = css.split('/* R36.3H1 — STEP 02 PRESENT SUMMARY + CANONICAL CLOSE */')[1] || ''

const checks = [
  ['Presenti is rendered as a stat, not a number input', view.includes('ts-present-count--stat') && view.includes('data-present-count-display') && !view.includes('name="present" type="number"')],
  ['Canonical present field remains in the form', (view.match(/name="present" type="hidden"/g) || []).length === 1],
  ['Redundant automatic helper copy is retired', !view.includes('Calcolati automaticamente dalla Rosa')],
  ['Visible Presenti stat is synced from canonical updatePresentCount', events.includes("const presentDisplay = manualEditor.querySelector('[data-present-count-display]')") && events.includes('presentDisplay.textContent = String(present)')],
  ['Present arithmetic remains canonical', events.includes('squadTotal - unavailable.size + aggregatedCount') && events.includes('form.elements.present.value = String(present)')],
  ['Availability counters remain unchanged', view.includes('data-roster-status-count="absent"') && view.includes('data-roster-status-count="injured"') && view.includes('data-roster-status-count="differentiated"')],
  ['Search clear uses canonical close icon', view.includes('data-clear-player-search aria-label="Pulisci ricerca">${icon(\'close\')}</button>')],
  ['Text clear glyph is retired from active search', !view.includes('data-clear-player-search aria-label="Pulisci ricerca">×</button>')],
  ['Clear interaction hook remains unchanged', (view.match(/data-clear-player-search/g) || []).length === 1],
  ['Canonical close icon receives intrinsic centered geometry', h1.includes('[data-clear-player-search] svg') && h1.includes('width: 16px;') && h1.includes('height: 16px;') && h1.includes('line-height: 0;')],
  ['Presenti visual owner is Training-domain only', h1.includes('.ts-present-count.ts-present-count--stat') && !legacy.includes('.ts-present-count{') && !legacy.includes('.ts-present-count {') && !responsive.includes('.ts-manual-editor .ts-present-count {')],
  ['Presenti stat uses no bordered control surface', !h1.includes('border: 1px') && !h1.includes('background: var(--staff-control-bg)')],
  ['R36.3H1 adds no important escalation', !h1.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3H1 Step 02 Summary + Close: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
