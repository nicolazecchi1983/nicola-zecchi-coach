import fs from 'node:fs'
import {
  MATCH_ANALYSIS_SCHEMA_VERSION,
  MATCH_ANALYSIS_SET_PIECE_SITUATIONS,
  createAnalysisTemplateDefinition,
  createMatchAnalysisSchema,
  createStaffAnalysisTemplateSchema,
} from '../src/modules/match/matchAnalysisSchema.js'

const editor=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const service=fs.readFileSync('src/modules/match/analysisTemplateService.js','utf8')
const repo=fs.readFileSync('src/infrastructure/repositories/analysisTemplateRepository.js','utf8')
const app=fs.readFileSync('src/app/appController.js','utf8')
const sql=fs.readFileSync('supabase/20260810_analysis_templates_foundation.sql','utf8')
const style=fs.readFileSync('src/modules/match/ui/matchAnalysis.css','utf8')

const staff=createStaffAnalysisTemplateSchema()
const possession=staff.phases.find((phase)=>phase.key==='possession')
const nonPossession=staff.phases.find((phase)=>phase.key==='non-possession')
const transitions=staff.phases.find((phase)=>phase.key==='transitions')
const setPieces=staff.phases.find((phase)=>phase.key==='set-pieces')
const setPiecesFor=setPieces.subsections.filter((item)=>item.direction==='for')
const setPiecesAgainst=setPieces.subsections.filter((item)=>item.direction==='against')
const staffTemplate=createAnalysisTemplateDefinition(staff)
const staffTemplateSetPieces=staffTemplate.phases.find((phase)=>phase.key==='set-pieces')

const withNotes=createMatchAnalysisSchema({
  version:MATCH_ANALYSIS_SCHEMA_VERSION,
  phases:[{
    key:'custom-test',title:'Mio blocco',note:'nota partita',
    subsections:[{id:'x',title:'Mia voce',note:'contenuto gara'}],
  }],
})
const template=createAnalysisTemplateDefinition(withNotes)

const checks=[
 ['schema v3 is active',MATCH_ANALYSIS_SCHEMA_VERSION===3],
 ['STAFF template has four macro areas',staff.phases.length===4],
 ['possession defaults are complete',possession.subsections.map(x=>x.title).join('|').includes('Costruzione da rimessa del portiere|Costruzione bassa|Costruzione alta|Sviluppo|Rifinitura|Finalizzazione')],
 ['non-possession defaults are complete',nonPossession.subsections.map(x=>x.title).join('|').includes('Prima pressione|Blocco medio|Blocco basso|Difesa area di rigore|Difesa uomo a uomo')],
 ['transitions remain configurable defaults',transitions.subsections.length>=2],
 ['set pieces have six situations for and six against',setPiecesFor.length===6&&setPiecesAgainst.length===6],
 ['set pieces directions share the same canonical situations',JSON.stringify(setPiecesFor.map(x=>x.title))===JSON.stringify(MATCH_ANALYSIS_SET_PIECE_SITUATIONS)&&JSON.stringify(setPiecesAgainst.map(x=>x.title))===JSON.stringify(MATCH_ANALYSIS_SET_PIECE_SITUATIONS)],
 ['template preserves set-piece direction metadata',staffTemplateSetPieces.subsections.every((item)=>item.direction==='for'||item.direction==='against')],
 ['editor groups set pieces without domain forks',editor.includes('analysis-set-piece-groups')&&editor.includes('INATTIVE')&&editor.includes('MATCH_ANALYSIS_SET_PIECE_DIRECTIONS')],
 ['custom macro areas survive normalization',withNotes.phases[0].key==='custom-test'&&withNotes.phases[0].title==='Mio blocco'],
 ['template strips match-specific notes',template.phases[0].note===''&&template.phases[0].subsections[0].note===''],
 ['editor uses nested details accordions',editor.includes('<details class="analysis-schema-phase"')&&editor.includes('<details class="analysis-schema-subsection"')],
 ['macro areas can be added renamed and removed',editor.includes('data-add-analysis-phase')&&editor.includes('data-analysis-phase-title')&&editor.includes('data-remove-analysis-phase')],
 ['match editor applies templates while master editing lives in manager',editor.includes('data-apply-analysis-template')&&editor.includes('data-open-analysis-template-manager')&&editor.includes('data-template-manager-save')],
 ['template persistence has dedicated service and repository',service.includes('createAnalysisTemplateService')&&repo.includes("from('analysis_templates')")],
 ['templates are user-owned with RLS',sql.includes('owner_user_id = auth.uid()')&&sql.includes('enable row level security')],
 ['controller injects shared template service',app.includes('createAnalysisTemplateService')&&app.includes('analysisTemplateOptions()')],
 ['UI has two-column macroarea card grid with full-width open editor',style.includes('.analysis-schema-phases')&&style.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important')&&style.includes('.analysis-schema-phase[open]')&&style.includes('grid-column:1/-1')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nAnalysis Template Engine: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
