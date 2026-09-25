import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')

const app = read('src/app/appController.js')
const calendar = read('src/modules/calendar/events/calendarRuntimeActions.js')
const training = read('src/modules/training/events/trainingEditorEvents.js')
const trainingLibrary = read('src/modules/training/events/trainingLibraryEvents.js')
const matchLibrary = read('src/modules/match/events/matchLibraryEvents.js')
const matchWorkspace = read('src/modules/match/events/matchWorkspaceEvents.js')
const matchCenter = read('src/modules/match/events/matchCenterEvents.js')
const workflow = read('src/modules/match/matchWorkflowModel.js')
const session = read('src/app/appSessionRestore.js')

const checks = [
  [
    'Calendar remains Match creation owner',
    calendar.includes('createMatchCalendarService')
      && calendar.includes('createMatch: (row) => matchCalendarService.createMatch(row)')
  ],
  [
    'Training route prepares fresh Calendar context',
    app.includes("'training-sheet': ensureCalendarEvents")
  ],
  [
    'Training publish refreshes Calendar without invalidating successful publish',
    training.includes('await loadCalendarEvents()')
      && training.includes('TRAINING_POST_PUBLISH_CALENDAR_REFRESH_FAILED')
      && training.includes('Training Sheet pubblicata in STAFF, Calendario e Training Library')
  ],
  [
    'Training reopen resolves the linked Calendar event',
    training.includes('const loadTrainingSheetByEventId = async (eventId)')
      && training.includes('appState.calendarEvents.find((item) => String(item.id) === String(eventId))')
  ],
  [
    'Training reopen has direct-event fallback for stale Calendar cache',
    training.includes('await getCalendarEvent(eventId)')
      && training.includes('Training Sheet non trovata nel Calendario.')
  ],
  [
    'Training active editor context survives navigation/reload',
    training.includes("localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)")
      && training.includes("const pendingOpenEventId = localStorage.getItem('nz-training-sheet-open-event-id')")
      && training.includes('await loadTrainingSheetByEventId(pendingOpenEventId)')
  ],
  [
    'Training Library remains free of creation wiring',
    !trainingLibrary.includes('createCalendarEvent')
      && !trainingLibrary.includes('createMatchCalendarService')
      && !trainingLibrary.includes('data-new-event')
  ],
  [
    'Match Library establishes active Match context before PRE entry',
    matchLibrary.includes("storage?.setItem('staff-active-match', JSON.stringify({")
      && matchLibrary.includes("activateMatchContext({ id: openButton.dataset.openMatchWorkspace")
      && matchLibrary.includes("await setView('opponent-study', 'Studio avversario')")
  ],
  [
    'Composition root reads the same active Match context key',
    app.includes("localStorage.getItem('staff-active-match')")
  ],
  [
    'Match temporal model preserves PRE / MATCH DAY / POST ownership',
    workflow.includes("key: 'pre-match'")
      && workflow.includes("label: 'PRE-PARTITA'")
      && workflow.includes("label: 'PARTITA'")
      && workflow.includes("key: 'post-match'")
      && workflow.includes("label: 'POST-PARTITA'")
      && workflow.includes("'match-center': 'match-day'")
  ],
  [
    'Match Workspace composes Match Center and POST runtime',
    matchWorkspace.includes('wireMatchCenterEvents({')
      && matchWorkspace.includes('wirePostMatchSectionsEvents({ form: postMatchForm })')
  ],
  [
    'Match Center persists through Calendar event ownership',
    matchCenter.includes('updateEvent: updateCalendarEvent')
      && matchCenter.includes('reloadEvents: loadCalendarEvents')
  ],
  [
    'POST save persists then stays inside canonical POST workspace',
    matchWorkspace.includes('createMatchPostMatchService({')
      && matchWorkspace.includes('updateEvent: updateCalendarEvent')
      && matchWorkspace.includes('reloadEvents: loadCalendarEvents')
      && matchWorkspace.includes("await setView('post-match', 'Post gara')")
  ],
  [
    'Session restore protects Match context and retires legacy workspace entry',
    session.includes("requested === 'match-workspace'")
      && session.includes("reason: 'legacy-match-workspace-redirect'")
      && session.includes("'opponent-study'")
      && session.includes("'post-match'")
  ],
]

let passed = 0

for (const [label, condition] of checks) {
  try {
    assert.equal(Boolean(condition), true)
    console.log('PASS', label)
    passed += 1
  } catch {
    console.error('FAIL', label)
  }
}

console.log(`R37 End-to-End Workflow Integrity: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
