import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'src/app/appKernel.js',
  'src/app/appController.js',
  'src/modules/auth/loginView.js',
  'src/app/appShellView.js',
  'src/app/appNavigation.js',
  'src/app/appDataGateway.js',
  'src/app/appViewRegistry.js',
  'src/app/appModuleContract.js',
  'src/app/appWorkspaceEngine.js',
  'src/modules/dashboard/dashboardView.js',
  'src/modules/match/ui/callupsView.js',
  'src/modules/match/ui/matchAnalysisView.js',
  'src/modules/roster/rosterView.js',
  'src/modules/calendar/ui/calendarView.js',
  'src/modules/training/ui/trainingLibraryView.js',
  'src/modules/board/boardView.js',
  'src/modules/settings/teamSettingsView.js',
  'src/modules/settings/settingsView.js',
  'src/modules/settings/placeholderView.js',
  'src/modules/profile/profileView.js',
  'src/modules/staff/staffManagementView.js',
  'src/design-system/iconRegistry.js',
]
const forbidden = [
  'src/components',
  'src/components/app.js',
  'src/components/login.js',
  'src/components/icons.js',
  'src/components/dashboard.js',
]

const failures = []
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`File richiesto mancante: ${file}`)
}
for (const file of forbidden) {
  if (fs.existsSync(path.join(root, file))) failures.push(`Residuo della vecchia architettura: ${file}`)
}
const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8')
if (!main.includes("./app/appKernel.js")) failures.push('main.js non usa app/appKernel.js')
if (main.includes("./app/appController.js")) failures.push('main.js dipende ancora direttamente da appController')
if (main.includes("./modules/auth/loginView.js")) failures.push('main.js contiene ancora il bootstrap di autenticazione')
const controller = fs.readFileSync(path.join(root, 'src/app/appController.js'), 'utf8')
if (!controller.includes("./appShellView.js")) failures.push('appController non usa appShellView')
if (!controller.includes("./appDataGateway.js")) failures.push('appController non usa appDataGateway')
if (!controller.includes("./appViewRegistry.js")) failures.push('appController non usa appViewRegistry')
if (!controller.includes("./appWorkspaceEngine.js")) failures.push('appController non usa appWorkspaceEngine')
if (!controller.includes("../modules/dashboard/dashboardView.js")) failures.push('appController non usa dashboardView modulare')
if (!controller.includes("../modules/match/ui/callupsView.js")) failures.push('appController non usa callupsView modulare')
if (!controller.includes("../modules/match/ui/matchAnalysisView.js")) failures.push('appController non usa matchAnalysisView modulare')
if (!controller.includes("../modules/roster/rosterView.js")) failures.push('appController non usa rosterView modulare')
if (!controller.includes("../modules/calendar/ui/calendarView.js")) failures.push('appController non usa calendarView modulare')
if (!controller.includes("../modules/training/ui/trainingLibraryView.js")) failures.push('appController non usa trainingLibraryView modulare')
if (!controller.includes("../modules/board/boardView.js")) failures.push('appController non usa boardView modulare')
if (!controller.includes("../modules/settings/teamSettingsView.js")) failures.push('appController non usa teamSettingsView modulare')
if (!controller.includes("../modules/settings/settingsView.js")) failures.push('appController non usa settingsView modulare')
if (!controller.includes("../modules/profile/profileView.js")) failures.push('appController non usa profileView modulare')
if (!controller.includes("../modules/staff/staffManagementView.js")) failures.push('appController non usa staffManagementView modulare')
if (controller.includes('function calendarCells()')) failures.push('calendarCells è ancora nel controller')
if (controller.includes('function trainingLibraryGroups()')) failures.push('trainingLibraryGroups è ancora nel controller')
for (const legacyView of ['function boardView() {\n  const team', 'function teamSettingsView() {\n  if', 'function profileView() {\n  const email', 'function settingsView() {\n  return `', 'function staffManagementView() {\n  if']) {
  if (controller.includes(legacyView)) failures.push(`View legacy ancora nel controller: ${legacyView.split('(')[0].replace('function ', '')}`)
}

if (failures.length) {
  console.error('\nAPP MIGRATION CHECK: FAILED\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('APP MIGRATION CHECK: OK (data gateway, module contract e registry attivi)')
