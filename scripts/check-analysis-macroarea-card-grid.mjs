import fs from 'node:fs'

const style = fs.readFileSync('src/modules/match/ui/matchAnalysis.css', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchAnalysisSchemaView.js', 'utf8')

const checks = [
  ['macroareas use a two-column desktop grid', style.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important')],
  ['macroarea cards keep the canonical details element', view.includes('<details class="analysis-schema-phase"')],
  ['closed macroarea cards have deliberate large hit area', style.includes('min-height:104px') && style.includes('padding:18px 20px')],
  ['macroarea title has stronger hierarchy', style.includes('font-size:1.12rem')],
  ['open macroarea spans full editor width', style.includes('.analysis-schema-phase[open]') && style.includes('grid-column:1/-1')],
  ['open macroarea receives a visible accent state', style.includes('box-shadow:inset 4px 0 0 #2dc5ff')],
  ['desktop hover is domain-scoped to macroarea cards', style.includes('.analysis-schema-phase:hover')],
  ['mobile collapses macroareas to one column', style.includes('@media(max-width:760px)') && style.includes('grid-template-columns:1fr!important')],
  ['mobile open macroarea does not force desktop column span', style.includes('grid-column:auto')],
  ['existing subsection count remains visible', view.includes('${phase.subsections.length} sottofasi')],
  ['existing disclosure remains available', view.includes('analysis-schema-phase-meta')],
  ['macroarea add action remains unchanged', view.includes('data-add-analysis-phase')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`✗ ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${label}`)
    passed += 1
  }
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`\nAnalysis Macroarea Card Grid: ${passed}/${checks.length}`)
