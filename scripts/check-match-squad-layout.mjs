import fs from 'node:fs'
const read=(url)=>fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
const legacyView=read(new URL('../src/modules/match/ui/legacyMatchCompatibilityView.js',import.meta.url))
const legacy=read(new URL('../src/modules/match/events/legacyMatchEditorEvents.js',import.meta.url))
const squadView=read(new URL('../src/modules/match/ui/matchSquadView.js',import.meta.url))
const squadCss=read(new URL('../src/modules/match/ui/matchSquad.css',import.meta.url))
const pitchCss=read(new URL('../src/modules/match/ui/matchPitch.css',import.meta.url))
const report=read(new URL('../src/modules/match/matchReportModel.js',import.meta.url))
const stats=read(new URL('../src/modules/match/matchStatisticsModel.js',import.meta.url))
const lineup=read(new URL('../src/modules/match/matchLineupSelectionModel.js',import.meta.url))
const checks=[
 ['vista Squadra estratta dal componente principale',legacyView.includes('renderMatchSquadStep')&&squadView.includes('export function renderMatchSquadStep')],
 ['stili Squadra isolati dal foglio globale',squadCss.includes('.match-squad-step')&&pitchCss.includes('aspect-ratio: 68 / 105')],
 ['campo verticale mantiene metà canonica accanto alla lista titolari',squadCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
 ['command area canonica contiene il controllo pedine condiviso',squadView.includes('squad-command-strip')&&squadView.includes('tokenDisplayControlHtml')&&!squadView.includes('formation-toolbar--single-row')],
 ['undici selezionabile accanto al campo',squadView.includes('lineup-list--selection')&&squadView.includes('name="starter_${index}"')&&!squadView.includes('lineup-index')],
 ['panchina espone i nove slot editabili sotto campo e titolari',!squadView.includes('squad-side-column')&&squadView.includes('bench-block--editable')&&squadView.includes('MATCH_LINEUP_MAX_BENCH')&&squadView.includes('data-bench-select')&&squadView.includes('bench_number_${index}')],
 ['Distinta usa tutti e soli i convocati senza owner bench derivato',legacy.includes('getTrainingSheetRosterPlayers')&&legacy.includes('findMatchLineupDuplicatePlayers')&&!legacy.includes('deriveMatchLineupBench')&&!legacy.includes('updateDerivedBench')],
 ['limite distinta 20 deriva dal contratto Convocazioni',lineup.includes('MATCH_LINEUP_MAX_BENCH = MATCH_CALLUPS_MAX_PLAYERS - MATCH_LINEUP_STARTER_COUNT')&&legacy.includes('Distinta: ${total}/20')],
 ['capitano e vicecapitano assegnabili da menu titolari',squadView.includes('data-leadership-select="captain"')&&squadView.includes('data-leadership-select="vice_captain"')&&legacy.includes('assignLeadershipRole')&&legacy.includes('refreshLeadershipSelects')],
 ['report legge panchina e numero gara editabile',report.includes('/^bench_\\d+$/')&&report.includes('bench_number_${index}')],
 ['statistiche leggono panchina e numero gara editabile',stats.includes('/^bench_\\d+$/')&&stats.includes('bench_number_${index}')],
]
let failed=0;for(const[label,ok]of checks){console.log(`${ok?'PASS':'FAIL'}  ${label}`);if(!ok)failed++}
if(failed)process.exit(1)
console.log(`\nMatch squad layout contract: ${checks.length}/${checks.length} controlli superati.`)
