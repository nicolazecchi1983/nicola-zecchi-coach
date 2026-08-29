import fs from 'node:fs'

const css = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const runtime = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js', 'utf8')

const media = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((match) => match[1])
const responsiveMarker = 'DS2.3 — TRAINING POLISH MOBILE ADAPTATION'

const checks = [
  ['training polish has a dedicated domain owner', main.includes("./modules/training/trainingPolish.css")],
  ['training owner loads after calendar polish', main.indexOf("./modules/calendar/calendarPolish.css") < main.indexOf("./modules/training/trainingPolish.css")],
  ['training owner stays before responsive final', main.indexOf("./modules/training/trainingPolish.css") < main.indexOf("./design-system/responsive.css")],
  ['training header keeps published-sheet controls and draft context', view.includes('data-open-training-sheet') && view.includes('data-ts-draft-state')],
  ['session essentials use one quiet operational surface', css.includes('.ts-session-grid') && css.includes('var(--staff-color-bg-panel)') && css.includes('var(--staff-color-border-subtle)')],
  ['roster uses disclosure instead of always-visible player lists', view.includes('<details class="ts-multiselect') && css.includes('.ts-multiselect[open]')],
  ['match day remains a segmented operational control', view.includes('data-ts-md-selector') && css.includes('.ts-md-selector button.is-active')],
  ['phase cards remain justified editable objects', runtime.includes('class="ts-phase-editor"') && css.includes('.ts-phase-editor') && css.includes('var(--staff-color-bg-panel)')],
  ['principles use one predictable selected state instead of four decorative colors', css.includes('.ts-pillar input:checked + span') && css.includes('var(--staff-color-primary)')],
  ['preview remains the focal document surface', view.includes('data-ts-preview') && css.includes('var(--staff-content-readable)')],
  ['workflow footer stays reachable without changing step hooks', css.includes('position: sticky') && view.includes('data-ts-step-prev') && view.includes('data-ts-step-next')],
  ['responsive final retains shared Training mobile adaptation', responsive.includes(responsiveMarker) && responsive.includes('.ts-manual-editor .ts-md-selector') && responsive.includes('grid-template-columns: repeat(3, minmax(0, 1fr))')],
  ['domain-specific mobile surfaces may be owned by Training', css.includes('R2.6J — TRAINING MOBILE OWNERSHIP CLEANUP') && css.includes('.ts-manual-editor .ts-parallel-work')],
  ['mobile Training header is domain-owned rather than globally re-owned', css.includes('R2.6K — TRAINING MOBILE HEADER OWNERSHIP · CLUSTER 2') && css.includes('.ts-manual-editor .ts-editor-titlebar') && !responsive.slice(responsive.indexOf(responsiveMarker)).includes('.ts-manual-editor .ts-editor-titlebar')],
  ['mobile controls preserve canonical touch targets', responsive.includes('var(--staff-touch-target)')],
  ['training polish consumes Design System colors only', !/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(css)],
  ['training polish introduces no important overrides', !css.includes('!important')],
  ['training polish uses only canonical responsive tiers', media.every((bp) => ['980', '760', '390'].includes(bp))],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.3 Training Polish: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
