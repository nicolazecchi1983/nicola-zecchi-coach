import fs from 'node:fs'
import assert from 'node:assert/strict'

const tl = fs.readFileSync('src/modules/training/ui/trainingLibraryView.js', 'utf8')
const ml = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')
const mlEvents = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js', 'utf8')
const mlLegacy = fs.readFileSync('src/modules/match/ui/matchLibraryController.js', 'utf8')
const calendarView = fs.readFileSync('src/modules/calendar/ui/calendarView.js', 'utf8')
const calendarEvents = fs.readFileSync('src/modules/calendar/events/calendarEvents.js', 'utf8')
const appController = fs.readFileSync('src/app/appController.js', 'utf8')
const ts = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const tsEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')

const checks = [
  ['TL has no create button', !tl.includes('data-new-event') && !tl.includes('Nuova Training Sheet')],
  ['ML has no create button or internal create form', !ml.includes('data-toggle-match-create') && !ml.includes('data-match-create-form') && !ml.includes('data-match-create-submit')],
  ['ML runtime has no creation wiring', !mlEvents.includes('data-toggle-match-create') && !mlEvents.includes('data-match-create-form') && !mlEvents.includes('createMatchCalendarService') && !mlEvents.includes("stage: 'match-create'")],
  ['ML canonical search/filter runtime survives create retirement', mlEvents.includes("const searchInput = matchLibrary.querySelector('[data-match-library-search]')") && ['data-match-library-competition','data-match-library-location','data-match-library-outcome'].every((hook) => mlEvents.includes(hook)) && mlEvents.includes('matchLibrarySearchMode')],
  ['legacy ML controller no longer keeps a second create path', !mlLegacy.includes('data-toggle-match-create') && !mlLegacy.includes('data-match-create-form')],
  ['Calendar still owns event creation UI', calendarView.includes('data-new-event') && calendarView.includes('Nuovo evento')],
  ['Calendar still owns new-event wiring', calendarEvents.includes("querySelectorAll('[data-new-event]')")],
  ['composition root Match Library call is consultation-only',
    (() => {
      const call = appController.match(/wireMatchLibraryEvents\(\{[\s\S]*?\n    \}\)/)?.[0] || ''
      const retired = ['formatDateInputValue','appState','createMatchCalendarService','createCalendarEvent','updateCalendarEvent','loadCalendarEvents','getUserErrorMessage','getDataAccessUserMessage']
      const required = ['createMatchLibraryService','setActiveNavigation','setView','confirmUser']
      return Boolean(call) && retired.every((dependency) => !call.includes(dependency)) && required.every((dependency) => call.includes(dependency))
    })()],
  ['TS roster is one list with one status selector per rendered player', ts.includes('data-player-row') && ts.includes('data-player-status') && ts.includes('data-roster-list')],
  ['TS roster exposes all required states', ['present','absent','injured','differentiated'].every((value) => ts.includes(`<option value="${value}">`))],
  ['old three-disclosure roster is retired from active TS markup', !ts.includes('data-player-select="') && !ts.includes('<details class="ts-multiselect')],
  ['old roster runtime selectors are fully retired', !tsEvents.includes('[data-player-select]') && !tsEvents.includes('filterTrainingRosterSelector') && !tsEvents.includes('rosterDisclosures')],
  ['runtime derives legacy arrays from unified status selector', tsEvents.includes("querySelectorAll('[data-player-status]')") && tsEvents.includes("selectedPlayers('absent')") && tsEvents.includes("selectedPlayers('injured')") && tsEvents.includes("selectedPlayers('differentiated')")],
  ['saved historical roster arrays are still restored', tsEvents.includes("['absent', 'injured', 'differentiated'].forEach") && tsEvents.includes('normalizePlayerTokens(candidate.dataset.canonicalName)')],
  ['present count remains automatic and includes aggregated players', tsEvents.includes('squadTotal - unavailable.size + aggregatedCount')],
  ['load canonical fields are unchanged', ts.includes('name="intensity" type="hidden"') && ts.includes('name="volume" type="hidden"') && ts.includes('name="focus"')],
  ['load scale is explicit', ts.includes('Intensità prevista') && ts.includes('Volume previsto') && ts.includes('1 molto bassa') && ts.includes('5 molto alto')],
  ['load index is derived, not separately persisted', ts.includes('data-load-score-value') && tsEvents.includes('intensity * volume') && !tsEvents.includes('fd.get(\'load_score\')')],
  ['Training domain owns R36.3 presentation', polish.includes('R36.3 — ROSTER STATUS LIST + LOAD INDEX')],
  ['roster filter has explicit hidden presentation', polish.includes('.ts-roster-player[hidden]') && polish.includes('.ts-roster-department[hidden]') && polish.includes('display: none;')],
  ['R36.3 presentation adds no important escalation', !polish.split('R36.3 — ROSTER STATUS LIST + LOAD INDEX')[1].includes('!important')],
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

console.log(`R36.3 Creation Ownership + Training Roster/Load: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
