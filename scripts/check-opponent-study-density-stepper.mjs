import fs from 'node:fs'

const view=fs.readFileSync('src/modules/match/ui/matchOpponentStudyView.js','utf8')
const studyCss=fs.readFileSync('src/modules/match/ui/matchOpponentStudy.css','utf8')
const resourceCss=fs.readFileSync('src/design-system/resourceComponents.css','utf8')
const sharedCss=fs.readFileSync('src/style.css','utf8')
const productCss=fs.readFileSync('src/design-system/productUi.css','utf8')
const matchCss=fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')

const checks=[
 ['materials heading is concise',view.includes('Materiali pre-partita')&&!view.includes('Tutto il materiale pre-partita in un unico spazio operativo.')],
 ['materials converge to two functional cards',view.includes("titleHtml: 'Report'")&&view.includes("titleHtml: 'Materiali'")&&view.includes('match-study-materials-grid--two')],
 ['section headers are structurally symmetric',view.includes('resourceSectionHeaderHtml({')&&view.includes('reportHeaderAction')&&view.includes('materialsHeaderActions')],
 ['blue numbered index is shared and readable',resourceCss.includes('.staff-resource-index')&&resourceCss.includes('background:var(--staff-color-primary)')&&resourceCss.includes('color:var(--staff-color-text)')],
 ['rare destructive actions move to overflow',view.includes('overflowActionMenuHtml')&&resourceCss.includes('.staff-overflow-menu__popover')],
 ['domain CSS no longer owns resource rows',!studyCss.includes('.match-study-resource{')&&!studyCss.includes('.match-study-resource-actions{')],
 ['technical subtitle is removed',!view.includes('Quattro macroaree di partenza. Apri, modifica o salva il tuo template personale.')],
 ['technical reading outer surface is neutral',studyCss.includes('STAFF R2.2 — Technical Reading Density canonical owner')&&studyCss.includes('.match-opponent-study .match-study-analysis-panel{')&&studyCss.includes('background:transparent')],
 ['template toolbar is a compact command row',studyCss.includes('grid-template-columns:minmax(260px,1fr) auto auto')&&studyCss.includes('[data-analysis-template-select]')&&studyCss.includes('min-height:44px')],
 ['technical helper noise is visually retired',studyCss.includes('.analysis-template-toolbar>p:not(.form-message)')&&studyCss.includes('.analysis-template-toolbar>small')&&studyCss.includes('display:none')],
 ['technical density remains domain-local and avoids important escalation',!studyCss.includes('R2.2 — Technical Reading Density canonical owner')?false:!studyCss.substring(studyCss.indexOf('R2.2 — Technical Reading Density canonical owner')).includes('!important')],
 ['link source is human-readable while href stays canonical',view.includes('linkSourceLabel')&&view.includes('metaHtml: `<span title="${escapeHtml(link.url)}">')&&view.includes('href: escapeHtml(link.url)')],
 ['material actions keep compact accessible floor',resourceCss.includes('min-height:44px')&&resourceCss.includes('.staff-resource-action')],
 ['old material important escalation is retired',!studyCss.includes('padding:14px!important')&&!studyCss.includes('padding:12px!important')&&!resourceCss.includes('!important')],
 ['report upload behavior is unchanged',view.includes("'data-study-toggle-form': 'report'")&&view.includes('data-study-upload-form="report"')],
 ['asset upload behavior is unchanged',view.includes("'data-study-toggle-form': 'asset'")&&view.includes('data-study-upload-form="asset"')],
 ['link behavior is unchanged',view.includes("'data-study-toggle-form': 'link'")&&view.includes('data-study-link-form')],
 ['compact resource is shared and content-driven',resourceCss.includes('.staff-resource-section')&&resourceCss.includes('.staff-resource-row')&&!studyCss.includes('min-height:190px')],
 ['materials outer wrapper is visually neutral',studyCss.includes('.match-study-materials{')&&studyCss.includes('padding:0')&&studyCss.includes('border:0')&&studyCss.includes('background:transparent')],
 ['resources use shared icon-content-actions anatomy',resourceCss.includes('grid-template-columns:36px minmax(0,1fr) auto')&&resourceCss.includes('.staff-resource-row__icon')&&resourceCss.includes('.staff-resource-row__actions')],
 ['desktop stepper uses equal columns with no label-specific width',matchCss.includes('--product-nav-columns:7')&&productCss.includes('repeat(var(--product-nav-columns, 6),minmax(0,1fr))')&&!sharedCss.includes('minmax(176px,1.16fr)')],
 ['stepper text remains inside buttons with controlled wrapping',productCss.includes('.product-section-nav button span')&&productCss.includes('white-space:normal!important')&&productCss.includes('overflow:hidden!important')],
 ['stepper buttons clip their own box instead of bleeding into neighbors',productCss.includes('overflow:hidden!important')],
 ['mobile two-column navigation comes from shared Product UI contract',matchCss.includes('--product-nav-mobile-columns:2')&&productCss.includes('var(--product-nav-mobile-columns,2)')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nOpponent Study Density + Stepper: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
