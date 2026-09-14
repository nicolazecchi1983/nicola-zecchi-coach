import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const analysis=fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js','utf8')
const workspaceEvents=fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js','utf8')

const checks=[
 ['Match Analysis physically extracted',app.includes("import { wireMatchAnalysisEvents }")&&!app.includes('function wireMatchAnalysisEvents()')],
 ['Schema editor binding preserved',analysis.includes('bindMatchAnalysisSchemaEditors(root, analysisTemplateOptions())')],
 ['Analysis local save preserved',analysis.includes("staff-match-analysis-v1:${matchId}")&&analysis.includes('Analisi salvata')],
 ['Report generation preserved',analysis.includes('data-generate-match-report')&&analysis.includes('buildMatchReportModel')&&analysis.includes('validateMatchReport')],
 ['Report publish via Calendar service preserved',analysis.includes('createMatchCalendarService')&&analysis.includes('calendarService.publish')],
 ['Report print preserved',analysis.includes('printMatchReport(')],
 ['Match navigation retired from Analysis owner',!analysis.includes('data-match-context-section')&&!analysis.includes('setActiveNavigation')],
 ['Shared Match Workspace owns section navigation',workspaceEvents.includes("data-workspace-action")&&workspaceEvents.includes("await setView('our-team', 'Nostra squadra')")&&workspaceEvents.includes("await setView('analysis', 'Analisi gara')")],
 ['Contextual Match return moved to shared Match Workspace owner',workspaceEvents.includes('data-return-to-match-workspace')&&workspaceEvents.includes('staff-match-entry-origin')&&workspaceEvents.includes('destination[0]')&&workspaceEvents.includes('destination[1]')&&!analysis.includes('staff-match-entry-origin')],
 ['CSV import preserved',analysis.includes('data-import-analysis')&&analysis.includes("supabase.from('match_analysis').insert(records)")],
 ['Analysis search preserved',analysis.includes('data-analysis-search')&&analysis.includes('.match-analysis-row')],
 ['Controller remains composition root',app.includes('wireMatchAnalysisEvents({')&&app.includes('wireMatchWorkspaceEvents({')&&app.includes('loadAnalysisEntries,')&&app.includes('supabase,')],
 ['No repository imports added',!analysis.includes('repository')&&!analysis.includes("import ")],
]
let n=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 11: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
