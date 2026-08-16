import fs from 'node:fs'

const app=fs.readFileSync('src/app/appController.js','utf8')
const adapters=fs.readFileSync('src/app/appViewAdapters.js','utf8')
const docs=fs.readFileSync('docs/ARCHITECTURE_DECOMPOSITION_PHASE_1.md','utf8')
const trainingPage=fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')

const movedViews=[
  'dashboardView','calendarView','trainingSheetEditorView','callupsView','squadView','analysisView','opponentStudyView',
  'matchReportWorkspaceView','postMatchView','boardView','teamSettingsView',
  'placeholderView','profileView','settingsView','staffManagementView',
  'trainingLibraryView','nativeOurTeamView','nativeOpponentView',
]

const checks=[
 ['appController consumes the adapter factory',app.includes("createAppViewAdapters")],
 ['adapter factory owns moved thin views',movedViews.every((name)=>adapters.includes(`function ${name}(`))],
 ['moved views are no longer declared in appController',movedViews.every((name)=>!new RegExp(`^function ${name}\\(`,'m').test(app))],
 ['view adapters do not wire DOM events',!adapters.includes('addEventListener(')],
 ['Training Sheet page renderer is pure UI',trainingPage.includes('renderTrainingSheetEditorPage')&&!trainingPage.includes('appState')&&!trainingPage.includes('addEventListener(')],
 ['view adapters do not import Supabase',!adapters.includes('supabase')],
 ['Match Library wiring has an explicit boundary',app.includes('function wireMatchLibraryEvents()')||app.includes('import { wireMatchLibraryEvents }')],
 ['Opponent Study wiring has an explicit boundary',app.includes('function wireOpponentStudyEvents()')||app.includes('import { wireOpponentStudyEvents }')],
 ['Match Workspace wiring has an explicit boundary',app.includes('function wireMatchWorkspaceEvents()')||app.includes('import { wireMatchWorkspaceEvents }')],
 ['global navigation wiring is separated',app.includes('function wireGlobalNavigationEvents()')||app.includes('import { wireGlobalShellEvents }')],
 ['profile/drawer wiring is separated',app.includes('function wireGlobalProfileAndDrawerEvents()')||app.includes('import { wireGlobalShellEvents }')],
 ['bindDynamic still orchestrates Match domain wiring',(app.includes('wireMatchLibraryEvents()')||app.includes('wireMatchLibraryEvents({'))&&(app.includes('wireOpponentStudyEvents()')||app.includes('wireOpponentStudyEvents({'))&&(app.includes('wireMatchWorkspaceEvents()')||app.includes('wireMatchWorkspaceEvents({'))],
 ['phase documentation records remaining event domains',docs.includes('Current bindDynamic domain map')&&docs.includes('Legacy Match Editor')&&docs.includes('Training Library filters / feedback')],
 ['no new source of truth is introduced by adapters',!adapters.includes('const appState =')&&!adapters.includes('localStorage.setItem')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`); if(ok)passed++}
console.log(`\nArchitecture Decomposition Phase 1: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
