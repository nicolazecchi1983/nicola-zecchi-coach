import fs from 'node:fs'
import {
  MATCH_ANALYSIS_SCHEMA_VERSION,
  MATCH_ANALYSIS_SET_PIECE_SITUATIONS,
  createMatchAnalysisSchema,
  parseMatchAnalysisSchema,
  serializeMatchAnalysisSchema,
} from '../src/modules/match/matchAnalysisSchema.js'

const editor=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const opponentController=fs.readFileSync('src/modules/match/ui/matchOpponentStudyController.js','utf8')
const app=fs.readFileSync('src/app/appController.js','utf8')
const matchAnalysisEvents = fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js','utf8')

const reduced=createMatchAnalysisSchema({
  version:MATCH_ANALYSIS_SCHEMA_VERSION,
  phases:[
    {key:'possession',title:'Possesso',note:'',subsections:[]},
    {key:'transitions',title:'Transizioni',note:'',subsections:[]},
  ],
})
const reparsed=parseMatchAnalysisSchema(serializeMatchAnalysisSchema(reduced))
const empty=createMatchAnalysisSchema({version:MATCH_ANALYSIS_SCHEMA_VERSION,phases:[]})
const emptyReparsed=parseMatchAnalysisSchema(serializeMatchAnalysisSchema(empty))
const legacyV2Reduced=parseMatchAnalysisSchema({version:2,phases:[
  {key:'possession',title:'Possesso',note:'',subsections:[]},
]})
const legacyV2EmptySetPieces=createMatchAnalysisSchema({version:2,phases:[{
  key:'set-pieces',title:'Palle inattive',note:'',
  subsections:MATCH_ANALYSIS_SET_PIECE_SITUATIONS.map((title,index)=>({id:`set-pieces-${index+1}`,title,note:''})),
}]})
const legacyV2PopulatedSetPieces=createMatchAnalysisSchema({version:2,phases:[{
  key:'set-pieces',title:'Palle inattive',note:'',
  subsections:MATCH_ANALYSIS_SET_PIECE_SITUATIONS.map((title,index)=>({id:`set-pieces-${index+1}`,title,note:index===0?'nota storica':''})),
}]})

const checks=[
 ['reduced v2 schema stays reduced',reparsed.phases.length===2],
 ['deleted canonical phase is not silently recreated',!reparsed.phases.some(p=>p.key==='non-possession')],
 ['explicit empty current schema remains empty',empty.phases.length===0&&emptyReparsed.phases.length===0],
 ['legacy v2 reduced schema remains reduced',legacyV2Reduced.phases.length===1&&legacyV2Reduced.phases[0].key==='possession'],
 ['legacy v2 empty canonical set pieces upgrade safely',legacyV2EmptySetPieces.phases[0].subsections.length===12&&legacyV2EmptySetPieces.phases[0].subsections.filter(x=>x.direction==='for').length===6&&legacyV2EmptySetPieces.phases[0].subsections.filter(x=>x.direction==='against').length===6],
 ['legacy v2 populated set pieces remain unclassified',legacyV2PopulatedSetPieces.phases[0].subsections.length===6&&legacyV2PopulatedSetPieces.phases[0].subsections[0].note==='nota storica'&&legacyV2PopulatedSetPieces.phases[0].subsections.every(x=>!x.direction)],
 ['structural mutations emit explicit snapshot event',editor.includes('analysis-schema-structure-change')&&editor.includes("reason: 'remove-phase'")],
 ['template application emits structural snapshot event',editor.includes("reason: 'apply-template'")],
 ['structure renames are structural changes',editor.includes("reason: 'rename-structure'")],
 ['opponent study autosaves structural snapshot',opponentController.includes("addEventListener('analysis-schema-structure-change'")&&opponentController.includes('saveTechnicalAnalysis')],
 ['match analysis autosaves structural snapshot', matchAnalysisEvents.includes("analysis-schema-structure-change") && matchAnalysisEvents.includes('saveAnalysis()')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nAnalysis Template Snapshot: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
