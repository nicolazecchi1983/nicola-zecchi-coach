import fs from 'node:fs'

const main=fs.readFileSync('src/main.js','utf8')
const tokens=fs.readFileSync('src/design-system/tokens.css','utf8')
const product=fs.readFileSync('src/design-system/productUi.css','utf8')
const polish=fs.readFileSync('src/design-system/polish.css','utf8')
const app=fs.readFileSync('src/app/appController.js','utf8')
const trainingPage=fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const library=fs.readFileSync('src/modules/training/ui/trainingLibraryView.js','utf8')
const matchShell=fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js','utf8')
const ui=fs.readFileSync('src/design-system/uiComponents.js','utf8')
const report=fs.readFileSync('src/modules/match/ui/matchReportWorkspaceView.js','utf8')
const post=fs.readFileSync('src/modules/match/ui/matchPostMatchView.js','utf8')
const legacyStyle=fs.readFileSync('src/style.css','utf8')

const checks=[
 ['Product UI layer is loaded after legacy/polish layers',main.indexOf("design-system/training-editor.css") < main.indexOf("design-system/productUi.css")],
 ['Product UI consumes canonical STAFF colors',product.includes('var(--staff-color-bg-panel)')&&product.includes('var(--staff-color-primary-hover)')],
 ['Product UI consumes canonical typography token',product.includes('var(--staff-font-page-title)')],
 ['Product page shell is shared by Training Sheet',trainingPage.includes('product-page-shell training-product-shell ts-manual-editor')],
 ['Product page shell is shared by Training Library',library.includes('product-page-shell training-library-view')],
 ['Product page shell is shared by Match shell',matchShell.includes("'product-page-shell'")],
 ['Training and Match use same product section nav',trainingPage.includes('ts-step-nav product-section-nav')&&ui.includes('match-context-navigation product-section-nav')],
 ['Training keeps six-column domain configuration',product.includes('--product-nav-columns:6')],
 ['Match keeps seven-column domain configuration',fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8').includes('--product-nav-columns:7')],
 ['Training active nav has no separate legacy blue ownership',!legacyStyle.includes('.ts-step-nav button.is-active{background:#0f7fca')],
 ['Old polish no longer owns Training stepper',!polish.includes('.ts-step-nav button')],
 ['Training Sheet step wrappers stay structural while inner blocks own surfaces',trainingPage.includes('class="ts-form-card ts-step') && !trainingPage.includes('ts-form-card product-surface ts-step')],
 ['Training Sheet summary uses canonical surface',trainingPage.includes('ts-live-column product-surface ts-step')],
 ['Report empty state uses canonical surface and empty state',report.includes('product-surface product-empty-state')],
 ['Post Gara sections use canonical surfaces',post.includes('post-match-section product-surface')&&post.includes('data-post-match-sections')],
 ['Report empty state no longer requires billboard height',product.includes('.match-workspace-shell .match-report-workspace-empty')&&product.includes('min-height:0!important')],
 ['No per-label Match tab sizing patch remains',!legacyStyle.includes('minmax(176px,1.16fr)')],
 ['Product UI does not introduce a second color token family',!product.includes('--ui-')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nProduct UI Foundation: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
