import fs from 'node:fs'
import { createCalendarReadCoordinator } from '../src/modules/calendar/calendarReadCoordinator.js'

const gateway = fs.readFileSync('src/app/appDataGateway.js', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js', 'utf8')
const views = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js', 'utf8')
const preview = fs.readFileSync('src/modules/training/ui/trainingPresentationBuilders.js', 'utf8')

const checks = []
const ok = (label, condition) => {
  if (!condition) throw new Error(`FAIL: ${label}`)
  checks.push(label)
  console.log(`✓ ${label}`)
}

ok('Calendar gateway no longer creates signed URLs while listing events', !gateway.includes('.createSignedUrl('))
ok('Calendar event models retain canonical trainingSheetPath', gateway.includes('trainingSheetPath,'))
ok('Calendar event models keep transient trainingSheetUrl empty for compatibility', gateway.includes('const trainingSheetUrl = null'))
ok('Calendar modules prepare through freshness-aware ensureCalendarEvents', /dashboard: ensureCalendarEvents[\s\S]*?calendar: ensureCalendarEvents[\s\S]*?library: ensureCalendarEvents/.test(controller))
ok('Explicit Calendar refresh remains available after writes', controller.includes('async function loadCalendarEvents()'))
ok('Critical Training flows receive authoritative throwing refresh', controller.includes('loadCalendarEvents: requireFreshCalendarEvents'))
ok('Calendar published-document action is gated by canonical storage path', views.includes('event.trainingSheetPath && can(capabilities.TRAINING_SHEET_VIEW_PUBLISHED)'))
ok('Calendar document open resolves one fresh signed URL on explicit user action', runtime.includes("createSignedFileUrl('training-sheets', event.trainingSheetPath, 3600)"))
ok('Calendar runtime does not cache signed URL back into event state', !runtime.includes('event.trainingSheetUrl = freshUrl'))
ok('Drawer no longer embeds a signed PDF/image preview eagerly', !preview.includes('src="${event.trainingSheetUrl}'))

let now = 1_000
let loads = 0
let applied = []
const coordinator = createCalendarReadCoordinator({
  now: () => now,
  ttlMs: 30_000,
  load: async () => { loads += 1; return [{ id: `e${loads}` }] },
  apply: (events) => { applied = events },
})

await coordinator.refresh()
ok('Coordinator performs authoritative refresh', loads === 1 && applied[0]?.id === 'e1')
await coordinator.ensure()
ok('Fresh Calendar cache suppresses redundant navigation read', loads === 1)
now += 30_001
await coordinator.ensure()
ok('Expired Calendar cache refreshes on next prepare', loads === 2)
coordinator.invalidate()
await coordinator.ensure()
ok('Invalidated Calendar cache refreshes', loads === 3)

let releaseLoad
let concurrentLoads = 0
const singleFlight = createCalendarReadCoordinator({
  load: () => {
    concurrentLoads += 1
    return new Promise((resolve) => { releaseLoad = () => resolve([]) })
  },
  apply: () => {},
})
const first = singleFlight.refresh()
const second = singleFlight.refresh()
ok('Concurrent Calendar refreshes are single-flight', concurrentLoads === 1)
releaseLoad()
await Promise.all([first, second])

let failed = false
const failClosed = createCalendarReadCoordinator({
  load: async () => { throw new Error('offline') },
  apply: () => {},
})
try { await failClosed.refresh() } catch { failed = true }
ok('Authoritative Calendar refresh propagates read failure', failed === true && !failClosed.isFresh())

console.log(`\nR2.1B Calendar Data Efficiency: ${checks.length}/${checks.length}`)
