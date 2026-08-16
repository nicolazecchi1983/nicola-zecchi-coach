import fs from 'node:fs'
import {
  createAnalysisTemplateDefinition,
  createStaffAnalysisTemplateSchema,
} from '../src/modules/match/matchAnalysisSchema.js'

const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const service=fs.readFileSync('src/modules/match/analysisTemplateService.js','utf8')
const style=fs.readFileSync('src/modules/match/ui/analysisTemplateManager.css','utf8')
const overlays=fs.readFileSync('src/design-system/overlays.css','utf8')

const staff=createStaffAnalysisTemplateSchema()
const reduced=createAnalysisTemplateDefinition({
  version:2,
  phases:staff.phases.filter((phase)=>phase.key!=='transitions'),
})

const checks=[
 ['match editor no longer edits master inline',!view.includes('data-update-analysis-template')&&!view.includes('data-save-analysis-template')],
 ['match editor has explicit template manager action',view.includes('data-open-analysis-template-manager')],
 ['manager supports new save duplicate delete',view.includes('data-template-manager-new')&&view.includes('data-template-manager-save')&&view.includes('data-template-manager-duplicate')&&view.includes('data-template-manager-delete')],
 ['manager edits macro areas independently',view.includes('data-template-manager-phase-title')&&view.includes('data-template-manager-remove-phase')&&view.includes('data-template-manager-add-phase')],
 ['manager edits subsections independently',view.includes('data-template-manager-subsection-title')&&view.includes('data-template-manager-remove-subsection')&&view.includes('data-template-manager-add-subsection')],
 ['manager update preserves reduced master structure',reduced.phases.length===3&&!reduced.phases.some((phase)=>phase.key==='transitions')],
 ['service updateDefinition persists name and structure',service.includes('updateDefinition')&&service.includes('name: safeName')&&service.includes('createAnalysisTemplateDefinition(schema)')],
 ['service update checks owner and duplicate names',service.includes('Puoi modificare solo i tuoi template')&&service.includes('Esiste già un template con questo nome')],
 ['manager copy naming is collision aware',view.includes('uniqueCopyName')],
 ['manager refreshes apply-selector cache after mutations',view.includes('onTemplatesChanged(templates)')],
 ['manager makes master/snapshot distinction explicit',view.includes('TEMPLATE MASTER')&&view.includes('singola partita')],
 ['manager has dedicated responsive surface',overlays.includes('.analysis-template-manager-backdrop')&&style.includes('@media (max-width: 760px)')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nAnalysis Template Manager: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
