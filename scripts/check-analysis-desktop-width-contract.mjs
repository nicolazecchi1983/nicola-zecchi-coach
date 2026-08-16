import fs from 'node:fs'
const shared=fs.readFileSync('src/modules/match/ui/matchAnalysis.css','utf8')
const study=fs.readFileSync('src/modules/match/ui/matchOpponentStudy.css','utf8')
const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')

const checks=[
 ['shared analysis editor owns full available width',shared.includes('[data-analysis-schema-editor]')&&shared.includes('width:100%!important')&&shared.includes('max-width:none!important')],
 ['opponent-study analysis form is one desktop column',study.includes('.match-study-analysis-panel .match-study-notes-form')&&study.includes('grid-template-columns:minmax(0,1fr)!important')],
 ['opponent-study editor spans the complete wide panel',study.includes('.match-study-analysis-panel .analysis-schema-editor')&&study.includes('grid-column:1/-1')],
 ['match analysis editor stretches in lifecycle form',shared.includes('.match-lifecycle-analysis > [data-analysis-schema-editor]')],
 ['opponent native editor stretches in shared legacy host',shared.includes('.match-native-legacy-host [data-analysis-schema-editor]')],
 ['study editor stretches through shared width contract',shared.includes('.match-study-analysis-panel [data-analysis-schema-editor]')],
 ['mobile breakpoint is not overridden with a fixed width',!study.includes('width:700px')&&!shared.includes('width:700px')],
 ['template helper copy contains no Pizello example',!view.toLocaleLowerCase('it-IT').includes('pizello')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nAnalysis Desktop Width Contract: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
