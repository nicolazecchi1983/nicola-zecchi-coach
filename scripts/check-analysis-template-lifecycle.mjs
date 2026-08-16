import fs from 'node:fs'
import { normalizeMatchOpponentStudy } from '../src/modules/match/matchOpponentStudyModel.js'
import { createAnalysisTemplateDefinition } from '../src/modules/match/matchAnalysisSchema.js'

const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const service=fs.readFileSync('src/modules/match/analysisTemplateService.js','utf8')
const model=fs.readFileSync('src/modules/match/matchOpponentStudyModel.js','utf8')

const reduced={version:2,phases:[
  {key:'possession',title:'Possesso',note:'gara',subsections:[]},
  {key:'transitions',title:'Transizioni',note:'',subsections:[]},
]}
const study=normalizeMatchOpponentStudy({technicalAnalysis:reduced})
const template=createAnalysisTemplateDefinition(reduced)

const checks=[
 ['opponent-study preserves reduced snapshot',study.technicalAnalysis.phases.length===2],
 ['deleted canonical area is not recreated by model',!study.technicalAnalysis.phases.some(p=>p.key==='non-possession')],
 ['model uses nullish presence rather than truthy fallback',model.includes('input.technicalAnalysis != null')],
 ['apply and template management are separate actions',view.includes('data-apply-analysis-template')&&view.includes('data-open-analysis-template-manager')],
 ['UI explains match snapshot scope',view.includes('singola partita')&&view.includes('Gestisci template')],
 ['STAFF master is used only as a starting definition',view.includes('createStaffAnalysisTemplateSchema')],
 ['template master has an isolated manager',view.includes('analysis-template-manager')&&view.includes('data-template-manager-save')],
 ['service exposes owner-checked master update',service.includes('updateDefinition')&&service.includes('Puoi modificare solo i tuoi template')],
 ['updating master strips match notes',service.includes('createAnalysisTemplateDefinition(schema)')&&template.phases[0].note===''],
 ['template definition keeps reduced structure',template.phases.length===2],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nAnalysis Template Lifecycle: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
