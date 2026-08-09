import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const mainPath = path.join(root, 'src/main.js')
const kernelPath = path.join(root, 'src/app/appKernel.js')

if (!fs.existsSync(kernelPath)) failures.push('appKernel.js mancante')

const main = fs.readFileSync(mainPath, 'utf8')
const kernel = fs.readFileSync(kernelPath, 'utf8')

if (!main.includes("bootstrapApp")) failures.push('main.js non avvia bootstrapApp')
if (main.includes('getSession') || main.includes('onAuthStateChange') || main.includes('renderLogin')) {
  failures.push('main.js contiene ancora responsabilità di bootstrap/auth')
}
if (!kernel.includes('createAppKernel')) failures.push('appKernel non espone createAppKernel')
if (!kernel.includes('bootstrapApp')) failures.push('appKernel non espone bootstrapApp')
if (!kernel.includes('prepareAppData') || !kernel.includes('attachAppEvents')) {
  failures.push('appKernel non orchestra correttamente il controller')
}
if (!kernel.includes('dispose()')) failures.push('appKernel non gestisce il lifecycle di chiusura')

if (failures.length) {
  console.error('\nAPP KERNEL CHECK: FAILED\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('APP KERNEL CHECK: OK (bootstrap, auth lifecycle e controller separati)')
