import fs from 'node:fs'

const files = {
  printEngine: fs.readFileSync('src/shared/print/printEngine.js', 'utf8'),
  nativeView: fs.readFileSync('src/modules/match/ui/matchNativeSectionView.js', 'utf8'),
  controller: fs.readFileSync('src/app/appController.js', 'utf8'),
  teamSettings: fs.readFileSync('src/modules/settings/teamSettingsView.js', 'utf8'),
}

const checks = [
  ['stampe HTML autonome escludono il CSS globale', files.printEngine.includes('includeDocumentStyles: false')],
  ['Print Engine supporta esplicitamente includeDocumentStyles', files.printEngine.includes('includeDocumentStyles = true')],
  ['Nostra squadra usa la squadra configurata', files.nativeView.includes("ownTeamName = team?.shortName || team?.name")],
  ['Avversario usa il nome partita', files.nativeView.includes("pageTitle = section === 'our-team' ? ownTeamName : opponent")],
  ['controller passa il profilo squadra alla vista nativa', files.controller.includes('team: getTeamProfile()')],
  ['motore compatibilità usa avversario dal match attivo', files.controller.includes("const opponentName = activeMatch?.opponent")],
  ['configurazione squadra collega la Rosa', files.teamSettings.includes('data-open-team-roster')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch team/print integrity: ${passed}/${checks.length} controlli superati.`)
if (passed !== checks.length) process.exit(1)
