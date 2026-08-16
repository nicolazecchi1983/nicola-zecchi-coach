import fs from 'node:fs'
const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const checks=[
 ['operational match editor still uses accordions',view.includes('<details class="analysis-schema-phase"')],
 ['template manager deliberately avoids nested accordions',!view.includes('data-template-manager-toggle-phase')],
 ['template manager macroareas are always visible',view.includes('analysis-template-manager-phase-card-head')&&view.includes('analysis-template-manager-phase-body')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nTemplate Manager Interaction Strategy: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
