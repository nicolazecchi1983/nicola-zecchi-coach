import fs from 'node:fs'

const css = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const editor = fs.readFileSync('src/design-system/training-editor.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const runtime = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js', 'utf8')

const media = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((match) => match[1])
const checks = [
  ['training polish has a dedicated domain owner', main.includes("./modules/training/trainingPolish.css")],
  ['training owner loads after calendar polish', main.indexOf("./modules/calendar/calendarPolish.css") < main.indexOf("./modules/training/trainingPolish.css")],
  ['training owner stays before responsive final', main.indexOf("./modules/training/trainingPolish.css") < main.indexOf("./design-system/responsive.css")],
  ['training header is editor-only and keeps draft context', !view.includes('data-open-training-sheet') && !view.includes('data-open-training-sheet-button') && view.includes('data-ts-draft-state')],
  ['session essentials use one quiet operational surface', css.includes('.ts-session-grid') && css.includes('var(--staff-color-bg-panel)') && css.includes('var(--staff-color-border-subtle)')],
  ['roster uses one always-visible status list owned by Training', view.includes('data-roster-list') && view.includes('data-player-status') && css.includes('R36.3 — ROSTER STATUS LIST + LOAD INDEX') && !view.includes('<details class="ts-multiselect')],
  ['match day remains a segmented operational control', view.includes('data-ts-md-selector') && css.includes('.ts-md-selector button.is-active')],
  ['phase cards remain justified editable objects', runtime.includes('class="ts-phase-editor"') && css.includes('.ts-phase-editor') && css.includes('var(--staff-color-bg-panel)')],
  ['principles use one predictable selected state instead of four decorative colors', css.includes('.ts-pillar input:checked + span') && css.includes('var(--staff-color-primary)')],
  ['step content premium reuses canonical registry icons', view.includes("icon('squad')") && view.includes("icon('plus')") && view.includes("icon('analysis')") && view.includes("icon('sheet')")],
  ['step content premium icon grammar is Training-domain owned', css.includes('R2.2 - STEP CONTENT PREMIUM CONVERGENCE') && css.includes('.ts-step-content-icon svg')],
  ['Step 5 manual decisions use one quiet premium surface', css.includes('.ts-step[data-ts-step="5"] .ts-analysis-fields') && css.includes('border-radius:var(--staff-radius-large);') && css.includes('background:var(--staff-color-bg-panel);')],
  ['step content premium introduces no custom inline SVG markup', !view.includes('<svg class="ts-step-content-icon')],
  ['Step 6 keeps one premium compound summary surface', editor.includes('R2.3 - Training Summary premium refinement') && editor.includes('border-radius:var(--staff-radius-large) var(--staff-radius-large) 0 0;') && editor.includes('border-radius: 0 0 var(--staff-radius-large) var(--staff-radius-large);')],
  ['Step 6 summary actions remain compact and balanced', editor.includes('width:min(440px,42vw);') && editor.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr);')],
  ['Step 6 helper copy is visually subordinate', editor.includes('padding-top:var(--staff-space-2);') && editor.includes('border-top:1px solid var(--staff-color-border-subtle);')],
  ['Step 6 premium refinement adds no new important escalation', !editor.slice(editor.indexOf('R2.3 - Training Summary premium refinement'), editor.indexOf('/* R1.3J')).includes('!important')],
  ['preview remains the focal document surface', view.includes('data-ts-preview') && css.includes('var(--staff-content-readable)')],
  ['workflow footer stays reachable without changing step hooks', css.includes('position: sticky') && view.includes('data-ts-step-prev') && view.includes('data-ts-step-next')],
  ['Training domain owns remaining shared mobile adaptation', css.includes('R2.6Z — TRAINING MOBILE SESSION + PREVIEW OWNERSHIP · CLUSTER 10') && css.includes('.ts-manual-editor .ts-session-grid') && !responsive.includes('.ts-manual-editor .ts-session-grid')],
  ['mobile Step 3 geometry is Training-domain owned', css.includes('R2.6O — TRAINING MOBILE STEP 3 OWNERSHIP · CLUSTER 6') && css.includes('.ts-manual-editor .ts-md-selector') && !responsive.includes('.ts-manual-editor .ts-md-selector')],
  ['domain-specific mobile surfaces may be owned by Training', css.includes('R2.6J — TRAINING MOBILE OWNERSHIP CLEANUP') && css.includes('.ts-manual-editor .ts-parallel-work')],
  ['mobile Training header is domain-owned rather than globally re-owned', css.includes('R2.6K — TRAINING MOBILE HEADER OWNERSHIP · CLUSTER 2') && css.includes('.ts-manual-editor .ts-editor-titlebar') && !responsive.includes('.ts-manual-editor .ts-editor-titlebar')],
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
