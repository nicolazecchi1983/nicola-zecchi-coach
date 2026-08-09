import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const squadView = fs.readFileSync(new URL('../src/modules/match/ui/matchSquadView.js', import.meta.url), 'utf8')
const squadCss = fs.readFileSync(new URL('../src/modules/match/ui/matchSquad.css', import.meta.url), 'utf8')
const report = fs.readFileSync(new URL('../src/modules/match/matchReportModel.js', import.meta.url), 'utf8')
const stats = fs.readFileSync(new URL('../src/modules/match/matchStatisticsModel.js', import.meta.url), 'utf8')

const checks = [
  ['vista Squadra estratta dal componente principale', app.includes('renderMatchSquadStep') && squadView.includes('export function renderMatchSquadStep')],
  ['stili Squadra isolati dal foglio globale', squadCss.includes('.match-squad-step') && squadCss.includes('aspect-ratio: 68 / 105')],
  ['campo verticale più ampio della lista titolari', squadCss.includes('grid-template-columns: minmax(560px, 1.08fr) minmax(500px, .92fr)')],
  ['toolbar unica su una riga', squadView.includes('formation-toolbar--single-row') && squadView.includes('Contenuto pedine')],
  ['undici selezionabile accanto al campo', squadView.includes('lineup-list--selection') && squadView.includes('Seleziona un giocatore per ogni pedina')],
  ['panchina automatica presente nella colonna destra', squadView.includes('squad-side-column') && squadView.includes('data-auto-bench') && squadView.includes('PANCHINA AUTOMATICA')],
  ['esclusione panchina senza modifica Rosa', app.includes('data-remove-bench-player') && squadView.includes('bench_excluded')],
  ['limite distinta 20 applicato', app.includes('finalSave.disabled = total > 20') && app.includes('Distinta: ${total}/20')],
  ['capitano e vicecapitano assegnabili con badge trascinabili', squadView.includes('data-leadership-badge="captain"') && squadView.includes('data-leadership-badge="vice_captain"') && app.includes('assignLeadershipRole')],
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
