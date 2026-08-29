import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css', 'utf8')
const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const pageShell = fs.readFileSync('src/design-system/pageShell.css', 'utf8')
const productUi = fs.readFileSync('src/design-system/productUi.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const workspace = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css', 'utf8')
const printEngine = fs.readFileSync('src/shared/print/printEngine.js', 'utf8')

const checks = [
  ['token text owns geometric center', /\.match-token-toggle > span\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?text-align:\s*center/.test(css)],
  ['selected check is isolated from label flow', /\.match-token-toggle::before\s*\{[\s\S]*?grid-column:\s*1/.test(css) && /\.match-token-toggle::after\s*\{[\s\S]*?grid-column:\s*3/.test(css)],
  ['selected check preserves symmetric visual balance', /grid-template-columns:\s*14px minmax\(0,\s*1fr\) 14px/.test(css) && /:has\(input:checked\)::before\s*\{\s*content:\s*'✓'/.test(css)],
  ['selected check no longer adds right margin', !/:has\(input:checked\)::before\s*\{[\s\S]*?margin-right:\s*7px/.test(css)],
  ['mobile token options remain three equal columns', /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css)],
  ['mobile toggle still consumes full cell width', /@media \(max-width:\s*760px\)[\s\S]*?\.match-token-toggle\s*\{[\s\S]*?width:\s*100%/.test(css)],
  ['formation PDF uses a single list column', /\.lineup-tm-print \.list\{display:grid;grid-template-columns:minmax\(0,1fr\);gap:6px\}/.test(runtime)],
  ['formation PDF preserves starter order from 1 to 11', /Array\.from\(\{ length: 11 \}/.test(runtime) && /starters\.map/.test(runtime)],
  ['formation PDF preserves nine bench slots', /Array\.from\(\{ length: 9 \}/.test(runtime) && /bench\.map/.test(runtime)],
  ['formation PDF keeps A4 page contract', /@page\{size:A4;margin:10mm\}/.test(runtime)],
  ['formation PDF owns exact printable width only in print media', /@media print\{\.lineup-tm-print\{width:190mm;max-width:190mm/.test(runtime)],
  ['shared Print Engine is not changed by this release', !/R3\.4E/.test(printEngine)],
  ['Page Shell remains canonical outer-gutter owner', /#viewRoot\s*\{[\s\S]*?padding:\s*var\(--staff-page-top\)\s+var\(--staff-page-inline\)/.test(pageShell)],
  ['Product UI still adds no second page gutter', /\.product-page-shell\{[\s\S]*?padding:0/.test(productUi)],
  ['retired Match mobile bleed cannot return', !/--match-mobile-content-bleed/.test(responsive) && !/match-native-section \.match-native-legacy-host\s*\{[\s\S]*?margin-inline:\s*calc/.test(responsive)],
  ['Match Workspace width ownership remains domain-local', /\.match-workspace-shell/.test(workspace)],
  ['R3.4E introduces no important escalation in token component', !sliceReleaseBlock(css).includes('!important')],
]

function sliceReleaseBlock(source) {
  const marker = source.indexOf('.match-token-toggle > span')
  return marker < 0 ? source : source.slice(marker)
}

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`FAIL  ${label}`)
    process.exitCode = 1
  } else {
    console.log(`PASS  ${label}`)
    passed += 1
  }
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`R3.4E Match Squad Mobile Controls + Formation PDF: ${passed}/${checks.length}`)
