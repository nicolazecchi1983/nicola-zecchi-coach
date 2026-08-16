import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const analysis=fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js','utf8')

const checks=[
 ['Match Analysis physically extracted',app.includes("import { wireMatchAnalysisEvents }")&&!app.includes('function wireMatchAnalysisEvents()')],
 ['Schema editor binding preserved',analysis.includes('bindMatchAnalysisSchemaEditors(root, analysisTemplateOptions())')],
 ['Analysis local save preserved',analysis.includes("staff-match-analysis-v1:${matchId}")&&analysis.includes('Analisi salvata')],
 ['Report generation preserved',analysis.includes('data-generate-match-report')&&analysis.includes('buildMatchReportModel')&&analysis.includes('validateMatchReport')],
 ['Report publish via Calendar service preserved',analysis.includes('createMatchCalendarService')&&analysis.includes('calendarService.publish')],
 ['Report print preserved',analysis.includes('printMatchReport(')],
 ['Match section navigation preserved',analysis.includes('data-match-context-section')&&analysis.includes("setView(target[0], target[1])")],
 ['Return to Match Library preserved',analysis.includes('data-return-to-match-workspace')&&analysis.includes("setView('match-library', 'Match Library')")],
 ['CSV import preserved',analysis.includes('data-import-analysis')&&analysis.includes("supabase.from('match_analysis').insert(records)")],
 ['Analysis search preserved',analysis.includes('data-analysis-search')&&analysis.includes('.match-analysis-row')],
 ['Controller remains composition root',app.includes('wireMatchAnalysisEvents({')&&app.includes('loadAnalysisEntries,')&&app.includes('supabase,')],
 ['No repository imports added',!analysis.includes('repository')&&!analysis.includes("import ")],
]
let n=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 11: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
