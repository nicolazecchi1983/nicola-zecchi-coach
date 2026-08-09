import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const enginePath = path.join(root, 'src/app/appWorkspaceEngine.js')
const controllerPath = path.join(root, 'src/app/appController.js')

if (!fs.existsSync(enginePath)) failures.push('Workspace engine mancante')
const engine = fs.existsSync(enginePath) ? fs.readFileSync(enginePath, 'utf8') : ''
const controller = fs.readFileSync(controllerPath, 'utf8')

for (const contract of ['createAppWorkspaceEngine', 'async open', 'resolveTarget', 'updateShell', 'resetScroll']) {
  if (!engine.includes(contract)) failures.push(`Contratto workspace mancante: ${contract}`)
}
if (!controller.includes("./appWorkspaceEngine.js")) failures.push('Controller non importa il workspace engine')
if (!controller.includes('const workspaceEngine = createAppWorkspaceEngine({')) failures.push('Workspace engine non inizializzato')
if (!controller.includes('return workspaceEngine.open(key, label)')) failures.push('setView non delega al workspace engine')
if (controller.includes("workspace?.classList.toggle('workspace--editor-focus'")) failures.push('Gestione shell ancora duplicata nel controller')
if (controller.includes("root.innerHTML = await moduleRegistry.activate")) failures.push('Attivazione moduli ancora gestita direttamente dal controller')

if (failures.length) {
  console.error('\nWORKSPACE ENGINE CHECK: FAILED\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('WORKSPACE ENGINE CHECK: OK (accesso, lifecycle e shell disaccoppiati)')
