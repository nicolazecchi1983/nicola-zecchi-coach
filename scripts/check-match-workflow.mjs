import fs from 'node:fs'

const workflow = fs.readFileSync(new URL('../src/modules/match/matchWorkflowModel.js', import.meta.url), 'utf8')
const libraryView = fs.readFileSync(new URL('../src/modules/match/ui/matchLibraryView.js', import.meta.url), 'utf8')
const workspace = fs.readFileSync(new URL('../src/modules/match/ui/matchWorkspaceView.js', import.meta.url), 'utf8')
const calendarService = fs.readFileSync(new URL('../src/modules/match/matchCalendarService.js', import.meta.url), 'utf8')
const gateway = fs.readFileSync(new URL('../src/app/appDataGateway.js', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const matchLibraryEvents = fs.readFileSync(new URL('../src/modules/match/events/matchLibraryEvents.js', import.meta.url), 'utf8')
const access = fs.readFileSync(new URL('../src/core/accessControl.js', import.meta.url), 'utf8')

const labels = [
  'Studio avversario',
  'Convocazioni',
  'Nostra squadra',
  'Avversario',
  'Analisi gara',
  'Report',
  'Post gara',
]

const checks = [
  ['Workflow canonico contiene sette sezioni', labels.every((label) => workflow.includes(label))],
  ['Fase Match derivata automaticamente dal tempo', workflow.includes('getMatchWorkflowPhase') && workflow.includes("'pre-match'") && workflow.includes("'match-day'") && workflow.includes("'post-match'")],
  ['Crea partita supporta origine Calendario', libraryView.includes('Dal Calendario') && libraryView.includes('data-match-calendar-event')],
  ['Crea partita supporta nuova gara', libraryView.includes('Nuova partita') && libraryView.includes('data-match-new-fields')],
  ['Nuova gara crea evento Calendario', calendarService.includes('async createMatch') && matchLibraryEvents.includes('calendarService.createMatch(data)')],
  ['Partita Calendario mantiene lo stesso event ID', matchLibraryEvents.includes("id: calendarMatch.id") && matchLibraryEvents.includes("staff-active-match")],
  ['Casa/trasferta persiste dal payload Calendario', calendarService.includes('home_away: homeAway') && gateway.includes('homeAway: parsedNotes')],
  ['Workspace usa il modello workflow condiviso', workspace.includes('getMatchWorkflowSections') && workspace.includes('getMatchWorkflowPhase')],
  ['Nostra squadra e Avversario sono sezioni native', app.includes("'our-team': nativeOurTeamView") && app.includes("opponent: nativeOpponentView") && !app.includes("setView('match-sheet', 'Match Sheet Editor')")],
  ['Sezioni future hanno route controllate', app.includes("'opponent-study': opponentStudyView") && app.includes("'match-report-workspace': matchReportWorkspaceView") && app.includes("'post-match': postMatchView")],
  ['Nuove route rispettano access control', ['opponent-study', 'match-report-workspace', 'post-match'].every((key) => access.includes(`'${key}': ACCESS_CAPABILITIES.MATCH_LIBRARY_VIEW`))],
  ['Nessun lifecycle manuale Pubblica/Archivia nel workflow', !workflow.includes('archive') && !workflow.includes('publish')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}

if (failed) process.exit(1)
console.log(`\nMatch workflow contract: ${checks.length}/${checks.length} controlli superati.`)
