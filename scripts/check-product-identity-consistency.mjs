import fs from 'node:fs'

const dashboard = fs.readFileSync('src/modules/dashboard/dashboardView.js','utf8')
const calendar = fs.readFileSync('src/modules/calendar/ui/calendarView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const libraryModel = fs.readFileSync('src/modules/match/matchLibraryModel.js','utf8')

const checks = [
  ['Dashboard non hardcode stagione 2026/27', !dashboard.includes('STAGIONE 2026/27')],
  ['Dashboard riceve profilo squadra', dashboard.includes('team = {}') && controller.includes('renderDashboardView(appState.calendarEvents, getTeamProfile())')],
  ['Calendario non hardcode stagione 2026/27', !calendar.includes('STAGIONE 2026/27')],
  ['Calendario non hardcode Serie D', !calendar.includes('<b>•</b>Serie D')],
  ['Calendario usa stagione configurata', calendar.includes('team.season')],
  ['Calendario usa categoria configurata', calendar.includes('team.category')],
  ['Controller passa team al Calendario', controller.match(/team: getTeamProfile\(\)/g)?.length >= 2],
  ['Match Library non mostra Match Sheet disponibile', !libraryModel.includes("'Match Sheet disponibile'")],
  ['Match Library usa stato neutro Partita pronta', libraryModel.includes("'Partita pronta'")],
]

let passed=0
for(const [label,ok] of checks){
  if(ok){console.log(`✓ ${label}`);passed++}
  else{console.error(`✗ ${label}`);process.exitCode=1}
}
console.log(`\nProduct Identity Consistency: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
