import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const navigation = fs.readFileSync(new URL('../src/app/appNavigation.js', import.meta.url), 'utf8')
const view = fs.readFileSync(new URL('../src/modules/match/ui/matchWorkspaceView.js', import.meta.url), 'utf8')
const workflow = fs.readFileSync(new URL('../src/modules/match/matchWorkflowModel.js', import.meta.url), 'utf8')
const access = fs.readFileSync(new URL('../src/core/accessControl.js', import.meta.url), 'utf8')
const callupsView = fs.readFileSync(new URL('../src/modules/match/ui/callupsView.js', import.meta.url), 'utf8')
const analysisView = fs.readFileSync(new URL('../src/modules/match/ui/matchAnalysisView.js', import.meta.url), 'utf8')
const uiComponents = fs.readFileSync(new URL('../src/design-system/uiComponents.js', import.meta.url), 'utf8')

const checks = [
  ['Match Library apre il workspace', app.includes('data-open-match-workspace') && app.includes("setView('match-workspace'" )],
  ['Workspace registrato nel router', app.includes("'match-workspace': matchWorkspaceView")],
  ['Workspace usa un match ID attivo', view.includes("staff-active-match") && view.includes('data-match-id')],
  ['Workflow Match v1 presente', ['Studio avversario', 'Convocazioni', 'Nostra squadra', 'Avversario', 'Analisi gara', 'Report', 'Post gara'].every((label) => workflow.includes(label))],
  ['Permesso workspace collegato alla Match Library', access.includes("'match-workspace': ACCESS_CAPABILITIES.MATCH_LIBRARY_VIEW")],
  ['Sidebar raggruppa Training e Match', navigation.includes("label: 'Training'") && navigation.includes("label: 'Match'")],
  ['Convocazioni disponibili nel workspace', app.includes('function callupsView()') && workflow.includes("key: 'callups'")],
  ['Avversario è una route nativa del Match Workspace', workflow.includes("key: 'opponent'") && app.includes("opponent: nativeOpponentView") && access.includes("opponent: ACCESS_CAPABILITIES.MATCH_SHEET_EDIT")],
  ['Nostra squadra è una route nativa del Match Workspace', workflow.includes("key: 'our-team'") && app.includes("'our-team': nativeOurTeamView") && access.includes("'our-team': ACCESS_CAPABILITIES.MATCH_SHEET_EDIT")],
  ['Match Sheet Editor non è più una route utente', !app.includes("'match-sheet': matchSheetEditorView") && !navigation.includes("['match-sheet', 'Match Sheet Editor']")],
  ['Sidebar Match mostra solo Match Library', navigation.includes("label: 'Match'") && navigation.includes("['match-library', 'Match Library', 'match-library']") && !navigation.includes("['match-sheet', 'Match Sheet', 'match-sheet']")],
  ['Convocazioni e Analisi non sono nella sidebar', !navigation.includes("['callups', 'Convocazioni', 'squad']") && !navigation.includes("['analysis', 'Analisi gara', 'analysis']")],
  ['Ritorno al workspace presente nelle sezioni partita', app.includes('matchContextBackButtonHtml()') && callupsView.includes('matchContextBackButtonHtml()') && analysisView.includes('matchContextBackButtonHtml()') && uiComponents.includes('data-return-to-match-workspace')],
  ['Ritorno al workspace usa un solo handler condiviso', app.includes("querySelectorAll('[data-return-to-match-workspace]')") && !app.includes('data-analysis-back')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed) process.exit(1)

console.log(`\nMatch workspace contract: ${checks.length}/${checks.length} controlli superati.`)
