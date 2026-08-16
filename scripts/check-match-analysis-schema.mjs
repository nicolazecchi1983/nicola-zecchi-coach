import fs from 'node:fs'

const model = fs.readFileSync('src/modules/match/matchAnalysisSchema.js','utf8')
const editor = fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const analysis = fs.readFileSync('src/modules/match/ui/matchAnalysisView.js','utf8')
const study = fs.readFileSync('src/modules/match/ui/matchOpponentStudyView.js','utf8')
const studyModel = fs.readFileSync('src/modules/match/matchOpponentStudyModel.js','utf8')
const legacyView = fs.readFileSync('src/modules/match/ui/legacyMatchCompatibilityView.js','utf8')
const opponentView = fs.readFileSync('src/modules/match/ui/matchOpponentView.js','utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const reportModel = fs.readFileSync('src/modules/match/matchReportModel.js','utf8')
const reportRenderer = fs.readFileSync('src/modules/match/matchReportRenderer.js','utf8')
const workspace = fs.readFileSync('src/modules/match/ui/matchWorkspaceView.js','utf8')
const workspaceCss = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')
const analysisCss = fs.readFileSync('src/modules/match/ui/matchAnalysis.css','utf8')
const matchLibraryCss = fs.readFileSync('src/modules/match/ui/matchLibrary.css','utf8')

const checks = [
  ['schema has four STAFF default macro areas', model.includes("key: 'possession'") && model.includes("key: 'non-possession'") && model.includes("key: 'transitions'") && model.includes("key: 'set-pieces'")],
  ['STAFF template provides editable starting subphases', model.includes('MATCH_ANALYSIS_SUGGESTIONS') && model.includes('createStaffAnalysisTemplateSchema') && editor.includes('Aggiungi una sottofase')],
  ['subphases can be custom, renamed and removed', editor.includes('Personalizzata') && editor.includes('data-analysis-subsection-title') && editor.includes('data-remove-analysis-subsection')],
  ['same schema editor is used by Analisi gara', analysis.includes('renderMatchAnalysisSchemaEditor')],
  ['same schema editor is used by Studio avversario', study.includes('renderMatchAnalysisSchemaEditor')],
  ['same schema editor is used by Avversario', opponentView.includes("name: 'opponent_analysis_schema'") && opponentView.includes('renderMatchAnalysisSchemaEditor')],
  ['opponent study persists technical schema in canonical event notes', studyModel.includes('technicalAnalysis') && studyModel.includes('MATCH_OPPONENT_STUDY_SCHEMA_VERSION = 2')],
  ['report model consumes dynamic schemas', reportModel.includes('opponentAnalysis') && reportModel.includes('matchAnalysis')],
  ['report renderer renders dynamic phases', reportRenderer.includes('renderAnalysisPhases')],
  ['captain and vice visible selects are canonical fields', squad.includes('name="captain" data-leadership-select="captain"') && squad.includes('name="vice_captain" data-leadership-select="vice_captain"')],
  ['captain and vice hidden duplicate fields are gone', !squad.includes('<input type="hidden" name="captain"') && !squad.includes('<input type="hidden" name="vice_captain"')],
  ['workspace no longer exposes Match ID', !workspace.includes('MATCH ID ·')],
  ['desktop Match navigation is a seven-column grid', workspaceCss.includes('grid-template-columns:repeat(7,minmax(0,1fr))!important')],
  ['Match Library uses neutral dark cards', matchLibraryCss.includes('.match-library-card {') && matchLibraryCss.includes('background: #0a1822;')],
  ['analysis page no longer uses white document slab', analysisCss.includes('.match-lifecycle-analysis') && analysisCss.includes('background:transparent!important')],
]
let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok) passed++
}
console.log(`\nM2.0 Configurable Match Analysis: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
