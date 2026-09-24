import fs from 'node:fs'

const read=(p)=>fs.readFileSync(p,'utf8').replace(/\r\n?/g,'\n')
const view=read('src/modules/match/ui/matchAnalysisSchemaView.js')
const css=read('src/modules/match/ui/matchAnalysis.css')
const analysisView=read('src/modules/match/ui/matchAnalysisView.js')
const studyView=read('src/modules/match/ui/matchOpponentStudyView.js')
const opponentView=read('src/modules/match/ui/matchOpponentView.js')
const h3=css.split('/* R36.3H3 — ANALYSIS TEMPLATE HEADER MENU */')[1]||''

const checks=[
 ['persistent template toolbar is absent from active markup',!view.includes('analysis-template-toolbar')&&!view.includes('templateToolbarHtml()')],
 ['template controls live inside compact title menu',view.includes('function templateActionsHtml()')&&view.includes('data-analysis-template-menu')&&view.includes('aria-label="Azioni template"')],
 ['title-level SectionHeading receives template menu',view.includes('metaHtml: templateActionsHtml()')],
 ['fallback intro receives the same template menu',/analysis-schema-intro[\s\S]*templateActionsHtml\(\)/.test(view)],
 ['no-intro consumer keeps compact menu access without toolbar',view.includes('analysis-template-menu-row--standalone')&&view.includes("showIntro ? ''")],
 ['template selector hook is preserved',view.includes('data-analysis-template-select')&&view.includes('Template STAFF')],
 ['apply hook is preserved',view.includes('data-apply-analysis-template>Applica alla partita</button>')],
 ['manager hook is preserved',view.includes('data-open-analysis-template-manager>Gestisci template</button>')],
 ['menu closes after apply and before manager',view.includes("apply.closest('[data-analysis-template-menu]')?.removeAttribute('open')")&&view.includes("manage.closest('[data-analysis-template-menu]')?.removeAttribute('open')")],
 ['header surface keeps only ellipsis while controls stay in popover',h3.includes('.analysis-template-menu > summary')&&h3.includes('.analysis-template-menu__popover')&&h3.includes('position: absolute;')],
 ['popover keeps accessible canonical control sizing',h3.includes('width: var(--staff-control-height);')&&h3.includes('min-height: var(--staff-control-height);')],
 ['menu is shared by Analisi gara and Studio avversario',analysisView.includes('renderMatchAnalysisSchemaEditor')&&studyView.includes('renderMatchAnalysisSchemaEditor')],
 ['Avversario shared consumer remains functional',opponentView.includes('renderMatchAnalysisSchemaEditor')&&opponentView.includes("name: 'opponent_analysis_schema'")],
 ['H3 adds no important escalation',!h3.includes('!important')],
]

let passed=0
for(const [label,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+label);if(ok)passed++}
console.log('R36.3H3 Template Header Menu: '+passed+'/'+checks.length)
if(passed!==checks.length)process.exit(1)
