import fs from 'node:fs'
import {
  MATCH_TEMPORAL_MOMENTS,
  MATCH_WORKFLOW_SECTIONS,
  MATCH_POST_UTILITIES,
  getMatchTemporalMomentForSection,
  getMatchWorkflowPhase,
  getMatchWorkflowSectionsForMoment,
} from '../src/modules/match/matchWorkflowModel.js'

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

const expectedMomentKeys = ['pre-match', 'match-day', 'post-match']
const preKeys = ['opponent-study', 'callups', 'our-team', 'opponent']
const postKeys = ['analysis', 'report', 'post-match']

const checks = [
  ['Workflow canonico contiene sette sezioni', MATCH_WORKFLOW_SECTIONS.length === 7 && labels.every((label, index) => MATCH_WORKFLOW_SECTIONS[index]?.label === label)],
  ['Workflow espone i tre momenti temporali canonici', MATCH_TEMPORAL_MOMENTS.map((item) => item.key).join('|') === expectedMomentKeys.join('|')],
  ['Ogni sezione canonica possiede il proprio momento senza una seconda mappa parallela',
    getMatchWorkflowSectionsForMoment('pre-match').map((item) => item.key).join('|') === preKeys.join('|')
    && getMatchWorkflowSectionsForMoment('post-match').map((item) => item.key).join('|') === postKeys.join('|')
    && MATCH_WORKFLOW_SECTIONS.every((item) => item.moment === 'pre-match' || item.moment === 'post-match')],
  ['Le sole route ausiliarie mantengono alias temporali senza nuova identità Match',
    getMatchTemporalMomentForSection('match-center') === 'match-day'
    && getMatchTemporalMomentForSection('match-statistics') === 'post-match'
    && getMatchTemporalMomentForSection('match-gps') === 'post-match'
    && getMatchTemporalMomentForSection('match-report-workspace') === 'post-match'
    && !MATCH_WORKFLOW_SECTIONS.some((item) => ['match-center', 'match-statistics', 'match-gps', 'match-report-workspace'].includes(item.key))],
  ['Le utility POST canoniche sono Statistiche e GPS', MATCH_POST_UTILITIES.map((item) => item.key).join('|') === 'statistics|gps'],
  ['Fase Match derivata automaticamente dal tempo',
    getMatchWorkflowPhase({ date: '2026-09-07', time: '15:30' }, new Date('2026-09-06T12:00:00')) === 'pre-match'
    && getMatchWorkflowPhase({ date: '2026-09-06', time: '15:30' }, new Date('2026-09-06T12:00:00')) === 'match-day'
    && getMatchWorkflowPhase({ date: '2026-09-05', time: '15:30' }, new Date('2026-09-06T12:00:00')) === 'post-match'],
    ['Match Library non espone selezione sorgente Calendario', !libraryView.includes('data-match-calendar-event') && !libraryView.includes('Dal Calendario')],
    ['Match Library non espone form Nuova partita', !libraryView.includes('data-match-new-fields') && !libraryView.includes('Nuova partita')],
    ['Servizio creazione partita resta disponibile al Calendario ma non alla Library', calendarService.includes('async createMatch') && !matchLibraryEvents.includes('calendarService.createMatch(data)')],
    ["Match Library apre l'evento canonico senza ricrearlo", matchLibraryEvents.includes("storage?.setItem('staff-active-match'") && matchLibraryEvents.includes('data-open-match-workspace') && !matchLibraryEvents.includes('calendarEventId')],
  ['Casa/trasferta persiste dal payload Calendario', calendarService.includes('home_away: homeAway') && gateway.includes('homeAway: parsedNotes')],
  ['Workspace usa il modello workflow condiviso', workspace.includes('getMatchWorkflowSections') && workspace.includes('getMatchWorkflowPhase')],
  ['Nostra squadra e Avversario sono sezioni native', app.includes("'our-team': nativeOurTeamView") && app.includes("opponent: nativeOpponentView") && !app.includes("setView('match-sheet', 'Match Sheet Editor')")],
  ['Sezioni future hanno route controllate', app.includes("'opponent-study': opponentStudyView") && app.includes("'match-report-workspace': matchReportWorkspaceView") && app.includes("'post-match': postMatchView")],
  ['Nuove route rispettano access control', ['opponent-study', 'match-report-workspace', 'post-match'].every((key) => access.includes(`'${key}': ACCESS_CAPABILITIES.MATCH_LIBRARY_VIEW`))],
  ['GPS usa una capability dedicata', access.includes("'match-gps': ACCESS_CAPABILITIES.MATCH_GPS_VIEW")],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed) process.exit(1)
console.log(`\nMatch workflow contract: ${checks.length}/${checks.length} controlli superati.`)
