import fs from 'node:fs'
import { renderCallupsView } from '../src/modules/match/ui/callupsView.js'
import { renderNativeMatchSectionView } from '../src/modules/match/ui/matchNativeSectionView.js'
import { renderMatchAnalysisView } from '../src/modules/match/ui/matchAnalysisView.js'
import { renderMatchReportWorkspaceView } from '../src/modules/match/ui/matchReportWorkspaceView.js'
import { renderMatchPostMatchView } from '../src/modules/match/ui/matchPostMatchView.js'
import { renderMatchOpponentStudyView } from '../src/modules/match/ui/matchOpponentStudyView.js'

const esc=(value='')=>String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
const match={id:'match-1',opponent:'CASTENASO',date:'2026-08-15'}
const teamName='Mezzolara'

const pages=[
 ['opponent-study',renderMatchOpponentStudyView({activeMatch:match,study:{notes:{},assets:[],links:[],technicalAnalysis:{version:2,phases:[]}},escapeHtml:esc,teamName})],
 ['callups',renderCallupsView({players:[],activeMatch:match,escapeHtml:esc,teamName})],
 ['our-team',renderNativeMatchSectionView({section:'our-team',activeMatch:match,team:{name:teamName},escapeHtml:esc,legacyEditorHtml:'<div data-test-native>TEAM</div>'})],
 ['opponent',renderNativeMatchSectionView({section:'opponent',activeMatch:match,team:{name:teamName},escapeHtml:esc,legacyEditorHtml:'<div data-test-native>OPPONENT</div>'})],
 ['analysis',renderMatchAnalysisView({activeMatch:match,savedAnalysis:{analysis_schema:{version:2,phases:[]}},analysisEntries:[],escapeHtml:esc,canImport:false,icon:()=>'',teamName})],
 ['report',renderMatchReportWorkspaceView({activeMatch:match,reportPaper:'',savedAtLabel:'',teamName,escapeHtml:esc})],
 ['post-match',renderMatchPostMatchView({activeMatch:match,postMatch:{materials:[]},reportAvailable:false,canEdit:true,teamName,escapeHtml:esc})],
]

const checks=[]
for(const [key,html] of pages){
  checks.push([`${key}: usa MatchWorkspaceShell`,html.includes('match-workspace-shell')])
  checks.push([`${key}: ha una sola navigation`,(html.match(/match-context-navigation product-section-nav/g)||[]).length===1])
  checks.push([`${key}: ha un solo content root`,(html.match(/data-match-workspace-content/g)||[]).length===1])
  checks.push([`${key}: conserva ritorno partita`,html.includes('data-return-to-match-workspace')])
}

const css=fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')
const productCss=fs.readFileSync('src/design-system/productUi.css','utf8')
const nativeView=fs.readFileSync('src/modules/match/ui/matchNativeSectionView.js','utf8')
const views=[
 'matchOpponentStudyView.js','callupsView.js','matchNativeSectionView.js',
 'matchAnalysisView.js','matchReportWorkspaceView.js','matchPostMatchView.js',
].map((name)=>fs.readFileSync(`src/modules/match/ui/${name}`,'utf8'))

checks.push(['tutte le viste importano lo shell di dominio',views.every((text)=>text.includes("from '../workspace/matchWorkspaceShell.js'"))])
checks.push(['nessuna vista replica direttamente la navigation',views.every((text)=>!text.includes('matchContextNavigationHtml('))])
checks.push(['nessuna vista replica direttamente il back button',views.every((text)=>!text.includes('matchContextBackButtonHtml('))])
checks.push(['Mezzolara/Avversario sono avvolte in surface canonica',nativeView.includes('workspace-surface product-surface match-native-surface')])
checks.push(['legacy host resta solo come compatibility implementation, non geometry owner',css.includes('strip legacy page geometry')&&css.includes('.match-native-surface .match-editor')])
checks.push(['shell CSS governa desktop/tablet/mobile',productCss.includes('@media(max-width:1180px)')&&productCss.includes('@media(max-width:760px)')])

let passed=0
for(const [label,ok] of checks){
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok)passed++
}
console.log(`\nMatch Workspace Foundation: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
