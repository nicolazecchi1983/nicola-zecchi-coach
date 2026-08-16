import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const model = fs.readFileSync('src/modules/match/matchReportWorkspaceModel.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchReportWorkspaceView.js', 'utf8')
const calendar = fs.readFileSync('src/modules/match/matchCalendarService.js', 'utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js', 'utf8')
const matchWorkspaceEvents = fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js','utf8')

const checks = [
  ['Report Workspace usa evento Calendario attivo', adapters.includes('appState.calendarEvents.find') && adapters.includes('readSavedMatchReportMeta(eventModel)')],
  ['Report legge snapshot canonico match_report', model.includes('match_report') && model.includes('readSavedMatchReport')],
  ['Report non dipende dal draft locale', !model.includes('localStorage') && !view.includes('localStorage')],
  ['Publish Calendario salva match_report', calendar.includes('notesPayload.match_report = matchData')],
  ['Workspace usa renderer Match Report condiviso', adapters.includes('createMatchReportRenderer({ escapeHtml })')],
  ['Workspace ricostruisce modello condiviso', adapters.includes('buildMatchReportModel({ data: reportMeta.report, team: getTeamProfile() })')],
  ['Workspace permette stampa PDF', matchWorkspaceEvents.includes('data-match-report-workspace-print') && matchWorkspaceEvents.includes('printMatchReport(')],
  ['Report mancante rimanda ad Analisi gara', matchWorkspaceEvents.includes('data-match-report-open-analysis') && matchWorkspaceEvents.includes("setView('analysis', 'Analisi gara')")],
  ['Navigazione Match mantiene sezione report', view.includes("activeSection: 'report'") && view.includes('matchWorkspaceShellHtml')],
  ['Nessuna seconda persistenza Report introdotta', !controller.includes("staff-match-report-workspace")],
]

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`✗ ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${label}`)
    passed += 1
  }
}
console.log(`
Match Report Workspace: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
