import fs from 'node:fs'

const read=(p)=>fs.readFileSync(p,'utf8').replace(/\r\n?/g,'\n')
const view=read('src/modules/training/ui/trainingSheetEditorPageView.js')
const css=read('src/modules/training/trainingPolish.css')
const analysisView=read('src/modules/match/ui/matchAnalysisView.js')
const j=css.split('/* R36.3J — STEP 04 PHASE WORKSPACE CONVERGENCE */')[1]||''

const checks=[
 ['Step 04 owns one phase workspace',view.includes('<div class="ts-phases-workspace">')&&view.includes('data-ts-phases')&&view.includes('data-add-phase')],
 ['phase workspace owns canonical Training section width',j.includes('width: min(100%, var(--training-section-max));')&&j.includes('margin-inline: auto;')],
 ['phase editor expands only inside the workspace',j.includes('.ts-phases-workspace > .ts-phases-editor')&&j.includes('width: 100%;')&&j.includes('max-width: none;')],
 ['add phase action shares the same workspace axis',j.includes('.ts-phases-workspace > .ts-add-phase')&&j.includes('margin-left: 0;')],
 ['add phase behavioral hook is unchanged',(view.match(/data-add-phase/g)||[]).length===1],
 ['summary uses plural Differenziati',/Differenziati[\s\S]{0,120}data-roster-status-count="differentiated"/.test(view)],
 ['individual player option remains singular Differenziato',view.includes('<option value="differentiated">Differenziato</option>')||view.includes('value="differentiated">Differenziato')],
 ['status model key remains differentiated',view.includes('data-roster-status-count="differentiated"')],
 ['mobile phase workspace remains full width',j.includes('@media (max-width: 760px)')&&j.includes('width: 100%;')],
 ['Analisi gara intro description is retired',analysisView.includes("description: ''")&&!analysisView.includes('Quattro macroaree di partenza per la lettura della gara.')],
 ['J adds no important escalation',!j.includes('!important')],
]

let passed=0
for(const [label,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+label);if(ok)passed++}
console.log('R36.3J Step 02 + Step 04 Visual Cleanup: '+passed+'/'+checks.length)
if(passed!==checks.length)process.exit(1)
