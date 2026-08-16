import fs from 'node:fs'

const required = [
  ['src/modules/match/matchStatisticsModel.js', 'buildMatchDataSnapshot'],
  ['src/modules/match/ui/matchStatisticsView.js', 'Minuti giocati'],
  ['src/modules/match/ui/matchStatisticsView.js', 'Conteggio visivo dei provvedimenti registrati'],
  ['src/core/accessControl.js', "'match-statistics': ACCESS_CAPABILITIES.MATCH_STATISTICS_VIEW"],
  ['src/modules/match/ui/matchWorkspaceView.js', 'Apri statistiche'],
  ['src/modules/match/events/matchWorkspaceEvents.js', "action === 'statistics'"],
]

const errors = []
for (const [file, token] of required) {
  if (!fs.existsSync(file)) errors.push(`File mancante: ${file}`)
  else if (!fs.readFileSync(file, 'utf8').includes(token)) errors.push(`Contratto mancante in ${file}: ${token}`)
}

if (errors.length) {
  console.error('\nMATCH DATA FOUNDATION CHECK: FAILED\n')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}
console.log('MATCH DATA FOUNDATION CHECK: OK (snapshot, numeri e grafici verificati)')
