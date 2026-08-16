import fs from 'node:fs'

const view=fs.readFileSync('src/modules/match/ui/matchOpponentStudyView.js','utf8')
const studyCss=fs.readFileSync('src/modules/match/ui/matchOpponentStudy.css','utf8')
const sharedCss=fs.readFileSync('src/style.css','utf8')
const productCss=fs.readFileSync('src/design-system/productUi.css','utf8')
const matchCss=fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')

const checks=[
 ['materials heading is concise',view.includes('Report, video e link')&&!view.includes('Raccogli tutto ciò che serve prima della gara')],
 ['materials preserve three functional cards',view.includes('Report Match Analyst')&&view.includes('Video e documenti')&&view.includes('Link esterni')],
 ['report upload behavior is unchanged',view.includes('data-study-toggle-form="report"')&&view.includes('data-study-upload-form="report"')],
 ['asset upload behavior is unchanged',view.includes('data-study-toggle-form="asset"')&&view.includes('data-study-upload-form="asset"')],
 ['link behavior is unchanged',view.includes('data-study-toggle-form="link"')&&view.includes('data-study-link-form')],
 ['desktop material cards are materially shorter',studyCss.includes('min-height:190px')],
 ['material outer spacing is reduced',studyCss.includes('margin-bottom:18px')&&studyCss.includes('padding:16px 18px')],
 ['material card gaps are reduced',studyCss.includes('.match-study-materials-grid')&&studyCss.includes('gap:12px')],
 ['desktop stepper uses equal columns with no label-specific width',matchCss.includes('--product-nav-columns:7')&&productCss.includes('repeat(var(--product-nav-columns, 6),minmax(0,1fr))')&&!sharedCss.includes('minmax(176px,1.16fr)')],
 ['stepper text remains inside buttons with controlled wrapping',productCss.includes('.product-section-nav button span')&&productCss.includes('white-space:normal!important')&&productCss.includes('overflow:hidden!important')],
 ['stepper buttons clip their own box instead of bleeding into neighbors',productCss.includes('overflow:hidden!important')],
 ['mobile two-column navigation comes from shared Product UI contract',matchCss.includes('--product-nav-mobile-columns:2')&&productCss.includes('var(--product-nav-mobile-columns,2)')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nOpponent Study Density + Stepper: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
