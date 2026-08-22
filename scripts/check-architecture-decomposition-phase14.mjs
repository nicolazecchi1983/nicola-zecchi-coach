import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const heavy = fs.readFileSync('src/app/appHeavyFeatureEvents.js', 'utf8')
const training = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js', 'utf8')
const docs = fs.readFileSync('docs/ARCHITECTURE_DECOMPOSITION_PHASE_14.md', 'utf8')

const checks = [
  ['Training Editor physically extracted', heavy.includes("import('../modules/training/events/trainingEditorEvents.js')")],
  ['Controller composes Training Editor wiring', app.includes('heavyBinders.wireTrainingEditorEvents({')],
  ['Inline Training Editor function removed', !app.includes('function wireTrainingEditorEvents()')],
  ['Training module owns manual editor root', training.includes("querySelector('[data-ts-manual-editor]')")],
  ['Training module owns six-step navigation', training.includes('Sezione ${nextStep} di 6') && training.includes('[data-ts-step-button]')],
  ['Training module owns phase split behavior', training.includes('data-toggle-phase-split') && training.includes('data-parallel-work')],
  ['Training module owns editor autosave', training.includes('nz-training-sheet-editor-v6-2') && training.includes('scheduleSave')],
  ['Training module owns publish/calendar integration', training.includes('publishTrainingSheet') && training.includes('resolveTrainingCalendarPublishTarget')],
  ['Training module owns published sheet restore', training.includes('loadTrainingSheetByEventId') && training.includes('nz-training-sheet-open-event-id')],
  ['App state remains injected', training.includes('appState') && !training.includes("from '../../../app/appStateStore")],
  ['Supabase remains injected', training.includes('supabase') && !training.includes("from '../../../supabase")],
  ['No repository shortcut introduced', !training.match(/from .*Repository/i)],
  ['Controller remains composition root', docs.includes('appController.js` remains the composition root')],
  ['Legacy Match Editor remains next high-risk boundary', docs.includes('Legacy Match Editor remains the final high-risk nested event boundary')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nArchitecture Decomposition Phase 14: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
