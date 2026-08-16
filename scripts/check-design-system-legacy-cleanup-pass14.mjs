import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const analysis = fs.readFileSync('src/modules/match/ui/matchAnalysis.css', 'utf8')
const manager = fs.readFileSync('src/modules/match/ui/analysisTemplateManager.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const forbiddenLegacy = [
  '.analysis-toolbar',
  '.match-analysis-row',
  '.match-lifecycle-analysis',
  '.analysis-schema-editor',
  '.analysis-template-toolbar',
  '[data-analysis-schema-editor]',
]

const checks = [
  ['Match Analysis has a dedicated canonical owner', analysis.includes('Match Analysis canonical owner')],
  ['main imports Match Analysis owner', main.includes("import './modules/match/ui/matchAnalysis.css'")],
  ['Match Analysis owner loads before Template Manager specialization', main.indexOf('matchAnalysis.css') < main.indexOf('analysisTemplateManager.css')],
  ['legacy style no longer owns analysis page/schema selectors', forbiddenLegacy.every((selector) => !style.includes(selector))],
  ['analysis page toolbar is owned by Match Analysis', analysis.includes('.analysis-toolbar') && analysis.includes('.match-analysis-row')],
  ['analysis lifecycle is owned by Match Analysis', analysis.includes('.match-lifecycle-analysis') && analysis.includes('.analysis-observations-archive')],
  ['configurable schema editor is owned by Match Analysis', analysis.includes('.analysis-schema-editor') && analysis.includes('.analysis-schema-phase-summary')],
  ['template apply toolbar is owned by Match Analysis', analysis.includes('.analysis-template-toolbar') && analysis.includes('.analysis-template-toolbar--apply-only')],
  ['shared analysis width contract is owned by Match Analysis', analysis.includes('[data-analysis-schema-editor]') && analysis.includes('max-width:none!important')],
  ['mobile analysis rules remain with the domain owner', analysis.includes('@media(max-width:760px)') && analysis.includes('.analysis-schema-phase-tools')],
  ['Template Manager remains a separate overlay owner', manager.includes('.analysis-template-manager') && manager.includes('.analysis-template-manager-toolbar')],
  ['legacy monolith is below 4000 lines after pass 14', style.split(/\r?\n/).length < 4000],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nDS Legacy Cleanup Pass 14: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
