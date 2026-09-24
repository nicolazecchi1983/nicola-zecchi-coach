import fs from 'node:fs'
import assert from 'node:assert/strict'

const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const runtime = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js','utf8')

const checks = [
  ['TS renderer non riceve piu calendarEvents per navigare lo storico', !view.includes('calendarEvents = []') && !adapters.includes('calendarEvents: appState.calendarEvents,')],
  ['TS non costruisce editableSheets', !view.includes('editableSheets')],
  ['TS non espone selector sedute pubblicate', !view.includes('open_training_sheet') && !view.includes('data-open-training-sheet')],
  ['TS non espone Apri TS embedded', !view.includes('data-open-training-sheet-button') && !view.includes('ts-open-button')],
  ['runtime non possiede piu browser controls', !runtime.includes('openSheetSelect') && !runtime.includes('openSheetButton')],
  ['loader per event identity resta canonico', runtime.includes('const loadTrainingSheetByEventId = async (eventId) =>')],
  ['apertura Calendar/Library usa ancora pending event identity', runtime.includes('await loadTrainingSheetByEventId(pendingOpenEventId)')],
  ['event identity locale resta preservata', runtime.includes("nz-training-sheet-open-event-id")],
  ['draft state resta nel Training header', view.includes('data-ts-draft-state')],
  ['menu eccezionale resta disponibile', view.includes('ts-more-menu') && view.includes('data-reset-training-sheet')],
]

let passed = 0
for (const [label, ok] of checks) {
  try {
    assert.equal(Boolean(ok), true)
    console.log('PASS', label)
    passed += 1
  } catch {
    console.error('FAIL', label)
  }
}
console.log(`R36.1A Training Editor Single Session: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
