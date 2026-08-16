import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const calendarService = fs.readFileSync('src/modules/calendar/calendarService.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['Calendar service imports shared retry helper', calendarService.includes("withDataAccessRetry")],
  ['Calendar service imports operation policy', calendarService.includes('DATA_OPERATION_KIND')],
  ['Calendar list uses bounded READ retry', /listCalendarEvents\(\)[\s\S]*?withDataAccessRetry\([\s\S]*?DATA_OPERATION_KIND\.READ[\s\S]*?calendar-events-list/.test(calendarService)],
  ['Single Calendar read uses bounded READ retry', /getCalendarEvent\(eventId\)[\s\S]*?withDataAccessRetry\([\s\S]*?DATA_OPERATION_KIND\.READ[\s\S]*?calendar-event-get/.test(calendarService)],
  ['Calendar create is not wrapped in retry', !calendarService.slice(calendarService.indexOf('export async function createCalendarEvent'), calendarService.indexOf('export async function updateCalendarEvent')).includes('withDataAccessRetry')],
  ['Calendar update is not wrapped in retry', !calendarService.slice(calendarService.indexOf('export async function updateCalendarEvent'), calendarService.indexOf('export async function deleteCalendarEvent')).includes('withDataAccessRetry')],
  ['Calendar delete is not wrapped in retry', !calendarService.slice(calendarService.indexOf('export async function deleteCalendarEvent'), calendarService.indexOf('export async function deleteCalendarEvents')).includes('withDataAccessRetry')],
  ['Calendar bulk delete is not wrapped in retry', !calendarService.slice(calendarService.indexOf('export async function deleteCalendarEvents'), calendarService.indexOf('export async function getCalendarEvent')).includes('withDataAccessRetry')],
  ['Composition root uses canonical user feedback for load failure', /loadCalendarEvents\(\)[\s\S]*?getDataAccessUserMessage\(error,[\s\S]*?calendar-events-load/.test(controller)],
  ['Raw Supabase Calendar alert removed', !controller.includes('Errore Supabase:')],
  ['Release guard registered in npm check', releaseGateIncludes(pkg, 'check:calendar-read-resilience-completion')],
  ['Dedicated release script exists', pkg.scripts?.['check:calendar-read-resilience-completion'] === 'node scripts/check-calendar-read-resilience-completion.mjs'],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nCalendar read resilience completion: ${checks.length - failed}/${checks.length} checks passed.`)
if (failed) process.exit(1)
