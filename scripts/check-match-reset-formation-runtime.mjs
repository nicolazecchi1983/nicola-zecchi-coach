import fs from 'node:fs'

const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')

const resetBlockMatch = runtime.match(/const resetFormationPositions = \(\) => \{[\s\S]*?return true\n      \}/)
const resetBlock = resetBlockMatch?.[0] || ''
const clickHandlerIndex = runtime.indexOf("matchEditor.addEventListener('click', (event) => {")
const optionalAnalysisIndex = runtime.indexOf('bindMatchAnalysisSchemaEditors(matchEditor')

const checks = [
  ['reset button exists in own-team view', /data-reset-formation/.test(view) && /Azzera posizioni/.test(view)],
  ['reset is owned by delegated core Match click binding', /const resetButton = event\.target\.closest\('\[data-reset-formation\]'\)/.test(runtime)],
  ['reset prevents default button behavior', /resetButton[\s\S]*?event\.preventDefault\(\)/.test(runtime)],
  ['reset resolves current formation', /form\.elements\.formation\?\.value/.test(resetBlock)],
  ['custom formation has safe canonical fallback', /positionsFromCustomFormation\(customFormation\) \|\| getFormationLayout\(customFormation \|\| '4-4-2'\)/.test(resetBlock)],
  ['reset rewrites all eleven token coordinates', /layout\.forEach\(\(\[x, y\], index\) => setTokenPosition\(index, x, y, false\)\)/.test(resetBlock)],
  ['reset persists immediately after coordinate rewrite', /hasSavedTokenPositions = true[\s\S]*?renderReport\(\)[\s\S]*?save\(\)/.test(resetBlock)],
  ['reset core binding is registered before optional analysis widgets', clickHandlerIndex >= 0 && optionalAnalysisIndex >= 0 && clickHandlerIndex < optionalAnalysisIndex],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Reset Formation Runtime: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
