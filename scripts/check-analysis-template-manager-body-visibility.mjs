import fs from 'node:fs'
const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const style=fs.readFileSync('src/modules/match/ui/analysisTemplateManager.css','utf8')
const checks=[
 ['manager phase body is always rendered',view.includes('analysis-template-manager-phase-body')],
 ['manager body does not use hidden',!view.includes('data-template-manager-phase-body hidden')],
 ['manager has no body.hidden mutation',!view.includes('body.hidden =')],
 ['manager phase body is forced visible locally',style.includes('.analysis-template-manager-phase-body')&&style.includes('display: grid')],
 ['global hidden rules are irrelevant to manager phases',!view.includes('data-template-manager-toggle-phase')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nTemplate Manager Body Visibility: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
