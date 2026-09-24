import fs from 'node:fs'

const read=(p)=>fs.readFileSync(p,'utf8').replace(/\r\n?/g,'\n')
const view=read('src/modules/match/ui/matchAnalysisSchemaView.js')
const analysisView=read('src/modules/match/ui/matchAnalysisView.js')
const css=read('src/modules/match/ui/matchAnalysis.css')
const opponentCss=read('src/modules/match/ui/matchOpponentStudy.css')
const h2=css.split('/* R36.3H2 — ANALYSIS TEMPLATE PROGRESSIVE DISCLOSURE */')[1]||''

const checks=[
 ['template selector remains directly available',view.includes('data-analysis-template-select')&&view.includes('Template STAFF')],
 ['apply action remains directly available',view.includes('data-apply-analysis-template>Applica alla partita</button>')],
 ['template manager remains available behind compact disclosure',view.includes('data-analysis-template-menu')&&view.includes('data-open-analysis-template-manager>Gestisci template</button>')],
 ['advanced trigger is compact and accessible',view.includes('aria-label="Azioni template"')&&view.includes('title="Azioni template"')],
 ['always-visible template scope helper is retired',!view.includes('analysis-template-scope')&&!view.includes('Questa pagina modifica solo la partita corrente')],
 ['PERSONALIZZABILE badge is retired from shared editor',!view.includes('>PERSONALIZZABILE<')&&!view.includes('staff-section-heading__badge">PERSONALIZZABILE')],
 ['analysis intro no longer advertises template management',!analysisView.includes('salvabili come template')&&analysisView.includes('Quattro macroaree di partenza per la lettura della gara.')],
 ['manager action hook is unchanged',view.includes('data-open-analysis-template-manager')&&view.includes("event.target.closest('[data-open-analysis-template-manager]')")],
 ['advanced disclosure closes before manager opens',view.includes("manage.closest('[data-analysis-template-menu]')?.removeAttribute('open')")],
 ['shared owner uses selector plus apply plus advanced three-column desktop row',h2.includes('grid-template-columns: minmax(0, 1fr) auto auto;')],
 ['advanced trigger preserves canonical control geometry',h2.includes('width: var(--staff-control-height);')&&h2.includes('height: var(--staff-control-height);')],
 ['advanced menu is a real anchored popover',h2.includes('position: absolute;')&&h2.includes('right: 0;')&&h2.includes('z-index: 20;')],
 ['mobile progressive disclosure remains compact',h2.includes('@media (max-width: 760px)')&&h2.includes('grid-template-columns: minmax(0, 1fr) auto;')],
 ['Opponent Study inherits shared advanced behavior',opponentCss.includes('R36.3H2 — shared template advanced menu adapter')&&opponentCss.includes('.analysis-template-advanced-menu [data-open-analysis-template-manager]')],
 ['H2 introduces no important escalation',!h2.includes('!important')],
]

let passed=0
for(const [label,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+label);if(ok)passed++}
console.log('R36.3H2 Template Progressive Disclosure: '+passed+'/'+checks.length)
if(passed!==checks.length)process.exit(1)
