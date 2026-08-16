import fs from 'node:fs'

const view=fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js','utf8')
const style=fs.readFileSync('src/modules/match/ui/analysisTemplateManager.css','utf8')
const overlays=fs.readFileSync('src/design-system/overlays.css','utf8')

const checks=[
 ['template manager has no phase accordion toggle',!view.includes('data-template-manager-toggle-phase')],
 ['template manager has no accordion open-state helper',!view.includes('setTemplateManagerPhaseOpen')&&!view.includes('toggleTemplateManagerPhase')],
 ['all manager macroareas render as always-visible cards',view.includes('analysis-template-manager-phase-card-head')&&view.includes('analysis-template-manager-phase-body')],
 ['manager macroarea body contains editable name',view.includes('data-template-manager-phase-title')],
 ['manager macroarea body contains delete action',view.includes('data-template-manager-remove-phase')],
 ['manager macroarea body contains editable subsections',view.includes('data-template-manager-subsection-title')],
 ['manager remains separate from match analysis accordions',view.includes('<details class="analysis-schema-phase"')],
 ['modal uses flex-column architecture',style.includes('.analysis-template-manager {')&&style.includes('flex-direction: column')],
 ['manager has exactly one vertical scrolling body',style.includes('.analysis-template-manager-body')&&style.includes('overflow-y: auto')&&style.includes('min-height: 0')],
 ['desktop subsections use compact two-column layout',style.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')],
 ['mobile manager fills dynamic viewport',style.includes('height: 100dvh')&&style.includes('max-height: 100dvh')],
 ['mobile subsections collapse to one column',style.includes('grid-template-columns: 1fr')],
 ['mobile footer accounts for safe-area',overlays.includes('env(safe-area-inset-bottom)')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nTemplate Manager Simple Layout: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
