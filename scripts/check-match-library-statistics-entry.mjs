import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')
const events = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const access = fs.readFileSync('src/core/accessControl.js', 'utf8')
const restore = fs.readFileSync('src/app/appSessionRestore.js', 'utf8')
const statsView = fs.readFileSync('src/modules/match/ui/matchStatisticsView.js', 'utf8')

const checks = [
  ['Match Library espone azione Statistiche sulla card', view.includes('data-open-match-statistics=') && view.includes('>Statistiche</button>')],
  ['Statistiche riusa lo stesso contesto opponent/date della card', view.includes('data-match-opponent=') && view.includes('data-match-date=')],
  ['Contesto partita attivato da helper unico', events.includes('const activateMatchContext = (match, sectionKey) =>')],
  ['Helper mantiene staff-active-match come fonte di verità', events.includes("storage?.setItem('staff-active-match'") && events.includes('id: match.id')],
  ['Sidebar resta Match Library durante apertura contestuale', events.includes("setActiveNavigation('match-library')")],
  ['Apri partita continua a entrare in Studio avversario', events.includes("activateMatchContext({ id: openButton.dataset.openMatchWorkspace") && events.includes("setView('opponent-study', 'Studio avversario')")],
  ['Statistiche entra nella route canonica', events.includes("activateMatchContext({ id: statisticsButton.dataset.openMatchStatistics") && events.includes("setView('match-statistics', 'Statistiche partita')")],
  ['Route statistiche resta registrata nel controller', controller.includes("'match-statistics': matchStatisticsView")],
  ['Access control statistiche resta canonico', access.includes("'match-statistics': ACCESS_CAPABILITIES.MATCH_STATISTICS_VIEW")],
  ['Restore sessione conosce match-statistics', restore.includes("'match-statistics'")],
  ['Statistiche legge staff-active-match senza seconda identità', statsView.includes("readJson(storage, 'staff-active-match')")],
  ['Nessuna nuova dipendenza repository/Supabase nel wiring Library', !events.includes('supabase') && !events.includes('repository') && !events.includes('import ')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Library Statistics Entry: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
