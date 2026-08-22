import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const controller = fs.readFileSync(path.join(root, 'src/app/appController.js'), 'utf8')
const kernel = fs.readFileSync(path.join(root, 'src/app/appKernel.js'), 'utf8')
const failures = []

const attachMatch = controller.match(/export async function attachAppEvents\(user\) \{([\s\S]*?)\n  const root = document\.querySelector\('#viewRoot'\)/)
const attach = attachMatch?.[1] || ''

if (!attach) failures.push('attachAppEvents non analizzabile')
if (/await loadTeamProfile\(user\)/.test(attach)) failures.push('attachAppEvents ricarica ancora il team profile già preparato')
if (/await loadCurrentUserRole\(user\)/.test(attach)) failures.push('attachAppEvents ricarica ancora access profile/role già preparato')
if (!/await Promise\.all\(\[\s*loadCalendarEvents\(\),\s*loadFacilities\(\),\s*loadRosterPlayers\(\),\s*loadPlayerProfiles\(\),?\s*\]\)/s.test(attach)) {
  failures.push('initial data non caricati in parallelo con Promise.all')
}
if (!attach.includes("'staff:initial-data'")) failures.push('timing initial-data mancante')

for (const metric of [
  'staff:dashboard:start',
  'staff:prepare-data',
  'staff:shell-rendered',
  'staff:attach-events',
  'staff:app-ready',
  'staff:dashboard-ready',
]) {
  if (!kernel.includes(`'${metric}'`)) failures.push(`metrica bootstrap mancante: ${metric}`)
}

if (!/await prepareAppData\(user\)[\s\S]*dom\.render\(renderApp\(user\)\)[\s\S]*await attachAppEvents\(user\)/.test(kernel)) {
  failures.push('ordine prepare → render → attach alterato')
}

if (failures.length) {
  console.error('\nPERFORMANCE BOOTSTRAP FOUNDATION CHECK: FAILED\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PERFORMANCE BOOTSTRAP FOUNDATION CHECK: OK (no duplicate identity loads, parallel initial data, timing markers)')
