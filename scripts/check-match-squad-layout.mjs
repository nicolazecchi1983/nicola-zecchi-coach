import fs from 'node:fs'

const legacyView = fs.readFileSync(new URL('../src/modules/match/ui/legacyMatchCompatibilityView.js', import.meta.url), 'utf8')
const legacy = fs.readFileSync(new URL('../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url), 'utf8')
const squadView = fs.readFileSync(new URL('../src/modules/match/ui/matchSquadView.js', import.meta.url), 'utf8')
const squadCss = fs.readFileSync(new URL('../src/modules/match/ui/matchSquad.css', import.meta.url), 'utf8')
const pitchCss = fs.readFileSync(new URL('../src/modules/match/ui/matchPitch.css', import.meta.url), 'utf8')
const report = fs.readFileSync(new URL('../src/modules/match/matchReportModel.js', import.meta.url), 'utf8')
const stats = fs.readFileSync(new URL('../src/modules/match/matchStatisticsModel.js', import.meta.url), 'utf8')

const checks = [
  ['vista Squadra estratta dal componente principale', legacyView.includes('renderMatchSquadStep') && squadView.includes('export function renderMatchSquadStep')],
  ['stili Squadra isolati dal foglio globale', squadCss.includes('.match-squad-step') && pitchCss.includes('aspect-ratio: 68 / 105')],
  ['campo verticale mantiene metà canonica accanto alla lista titolari', squadCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr));')],
  ['command area canonica contiene il controllo pedine condiviso', squadView.includes('squad-command-strip') && squadView.includes('tokenDisplayControlHtml') && !squadView.includes('formation-toolbar--single-row')],
  ['undici selezionabile accanto al campo', squadView.includes('lineup-list--selection') && squadView.includes('name="starter_${index}"') && !squadView.includes('lineup-index')],
  ['panchina a 9 slot fissi autonoma sotto campo e titolari', !squadView.includes('squad-side-column') && squadView.includes('bench-block--full-width') && squadView.includes('data-bench-slots') && squadView.includes('Array.from({ length: 9 }') && squadView.includes('<h3>A disposizione</h3>') && !squadView.includes('PANCHINA AUTOMATICA')],
  ['selezione panchina non modifica la Rosa', legacy.includes('getTrainingSheetRosterPlayers()') && legacy.includes('form.elements[`bench_${index}`]') && !squadView.includes('bench_excluded')],
  ['limite distinta 20 applicato strutturalmente', legacy.includes('Array.from({ length: 9 }, (_, index) => form.elements[`bench_${index}`])') && legacy.includes('Distinta: ${total}/20') && !legacy.includes('finalSave.disabled = total > 20')],
  ['capitano e vicecapitano assegnabili da menu titolari', squadView.includes('data-leadership-select="captain"') && squadView.includes('data-leadership-select="vice_captain"') && legacy.includes('assignLeadershipRole') && legacy.includes('refreshLeadershipSelects')],
  ['report legge panchina dinamica', report.includes('/^bench_\\d+$/')],
  ['statistiche leggono panchina dinamica', stats.includes('/^bench_\\d+$/')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed) process.exit(1)
console.log(`\nMatch squad layout contract: ${checks.length}/${checks.length} controlli superati.`)
