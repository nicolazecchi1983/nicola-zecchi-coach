import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const read = (file) => fs.readFileSync(file, 'utf8')
const runtime = read('src/modules/calendar/events/calendarRuntimeActions.js')
const controller = read('src/app/appController.js')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['Calendar runtime declares centralized feedback dependency', runtime.includes('getDataAccessUserMessage')],
  ['Composition root injects centralized feedback into Calendar runtime', /createCalendarRuntimeActions\(\{[\s\S]*getDataAccessUserMessage,[\s\S]*alertUser: alert/.test(controller)],
  ['Season import uses centralized feedback', runtime.includes("stage: 'calendar-season-import'")],
  ['Bulk delete uses centralized feedback', runtime.includes("stage: 'calendar-bulk-delete'")],
  ['Event create uses centralized feedback', runtime.includes("stage: 'calendar-event-create'")],
  ['Event update uses centralized feedback', runtime.includes("stage: 'calendar-event-update'")],
  ['Event delete uses centralized feedback', runtime.includes("stage: 'calendar-event-delete'")],
  ['Legacy raw Calendar create prefix removed', !runtime.includes('`Errore salvataggio: ${insertError.message}`')],
  ['Legacy raw Calendar update prefix removed', !runtime.includes('`Errore modifica: ${updateError.message}`')],
  ['Legacy raw Calendar delete message removed', !runtime.includes('`Errore eliminazione: ${deleteError?.message')],
  ['Check registered', Boolean(pkg.scripts['check:error-ux-calendar-expansion'])],
  ['Check included in npm run check', releaseGateIncludes(pkg, 'check:error-ux-calendar-expansion')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exit(1)
console.log(`ERROR UX CALENDAR EXPANSION: OK (${checks.length}/${checks.length})`)
