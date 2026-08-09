import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const required = [
  'src/app/appModuleContract.js',
  'src/app/appViewRegistry.js',
]
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`File richiesto mancante: ${file}`)
}

const contract = fs.readFileSync(path.join(root, 'src/app/appModuleContract.js'), 'utf8')
const registry = fs.readFileSync(path.join(root, 'src/app/appViewRegistry.js'), 'utf8')
const controller = fs.readFileSync(path.join(root, 'src/app/appController.js'), 'utf8')

if (!contract.includes('createAppModule')) failures.push('Contratto modulo non esportato')
for (const lifecycle of ['prepare', 'render', 'dispose']) {
  if (!contract.includes(lifecycle)) failures.push(`Lifecycle mancante: ${lifecycle}`)
}
if (!registry.includes('createAppModule')) failures.push('Registry non valida i moduli tramite contratto')
if (!registry.includes('async activate')) failures.push('Registry non espone activate() asincrono')
if (!registry.includes('activeModule.dispose')) failures.push('Registry non chiude il modulo precedente')
if (!controller.includes('const moduleRegistry = createAppViewRegistry(')) failures.push('Controller non usa il registro moduli')
if (!controller.includes('createAppWorkspaceEngine')) failures.push('Controller non delega al workspace engine')
if (!controller.includes('workspaceEngine.open')) failures.push('setView non apre le viste tramite workspace engine')
if (controller.includes("if (key === 'calendar' || key === 'dashboard'")) failures.push('Preload delle viste ancora codificato in setView')
if (controller.includes('const viewRegistry = createAppViewRegistry({')) failures.push('Vecchio registry di funzioni ancora presente')

if (failures.length) {
  console.error('\nMODULE CONTRACT CHECK: FAILED\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('MODULE CONTRACT CHECK: OK (prepare/render/dispose e preload modulari)')
