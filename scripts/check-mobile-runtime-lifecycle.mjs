import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const controller = read('src/app/appLifecycleController.js')
const kernel = read('src/app/appKernel.js')
const appController = read('src/app/appController.js')
const packageJson = JSON.parse(read('package.json'))

const checks = []
const check = (label, ok) => {
  checks.push([label, Boolean(ok)])
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}

check('dedicated app lifecycle controller exists', /createAppLifecycleController/.test(controller))
check('mobile resume threshold is bounded at 30 seconds', /DEFAULT_MOBILE_RESUME_THRESHOLD_MS\s*=\s*30_000/.test(controller))
check('visibility lifecycle is observed', /visibilitychange/.test(controller))
check('BFCache pageshow lifecycle is observed', /pageshow/.test(controller))
check('online lifecycle is observed', /addEventListener\?\.\('online'/.test(controller))
check('offline lifecycle is observed', /addEventListener\?\.\('offline'/.test(controller))
check('lifecycle bindings are idempotent', /if \(started\) return/.test(controller))
check('lifecycle listeners are disposable', /removeEventListener/.test(controller))
check('kernel starts lifecycle ownership once', /lifecycleController\.start\(\)/.test(kernel))
check('kernel disposes lifecycle ownership', /lifecycleController\.dispose\(\)/.test(kernel))
check('resume invalidates volatile app data without forced rerender', /onResume:[\s\S]*invalidateVolatileAppData/.test(kernel) && !/onResume:[\s\S]{0,200}showDashboard/.test(kernel))
check('network recovery invalidates volatile app data', /onOnline:[\s\S]*invalidateVolatileAppData\('network:online'\)/.test(kernel))
check('calendar freshness has one explicit invalidation owner', /export function invalidateVolatileAppData/.test(appController) && /calendarReadCoordinator\.invalidate\(\)/.test(appController))
check('mobile lifecycle gate is registered', packageJson.scripts?.['check:mobile-runtime-lifecycle'] === 'node scripts/check-mobile-runtime-lifecycle.mjs')
check('mobile lifecycle gate belongs to canonical suite', packageJson.staffCheckSuite?.includes('check:mobile-runtime-lifecycle'))

class FakeTarget {
  constructor() { this.listeners = new Map() }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(fn)
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn) }
  emit(type, event = {}) { for (const fn of this.listeners.get(type) || []) fn(event) }
  count(type) { return this.listeners.get(type)?.size || 0 }
}

const lifecycleUrl = pathToFileURL(path.join(root, 'src/app/appLifecycleController.js')).href
const { createAppLifecycleController } = await import(`${lifecycleUrl}?check=${Date.now()}`)
const doc = new FakeTarget()
doc.hidden = false
const win = new FakeTarget()
const nav = { onLine: true }
let clock = 1_000
const resumes = []
const online = []
const offline = []
const lifecycle = createAppLifecycleController({
  documentRef: doc,
  windowRef: win,
  navigatorRef: nav,
  now: () => clock,
  onResume: (detail) => resumes.push(detail),
  onOnline: (detail) => online.push(detail),
  onOffline: (detail) => offline.push(detail),
})

lifecycle.start()
lifecycle.start()
check('behavior: duplicate start does not duplicate listeners', doc.count('visibilitychange') === 1 && win.count('pageshow') === 1)

doc.hidden = true
doc.emit('visibilitychange')
clock += 29_000
doc.hidden = false
doc.emit('visibilitychange')
check('behavior: short background period does not invalidate', resumes.length === 0)

doc.hidden = true
doc.emit('visibilitychange')
clock += 31_000
doc.hidden = false
doc.emit('visibilitychange')
check('behavior: long background period emits one resume', resumes.length === 1 && resumes[0].source === 'visibilitychange')

win.emit('pageshow', { persisted: true })
check('behavior: BFCache restore emits resume', resumes.length === 2 && resumes[1].source === 'pageshow' && resumes[1].persisted === true)

nav.onLine = false
win.emit('offline')
win.emit('offline')
nav.onLine = true
win.emit('online')
win.emit('online')
check('behavior: offline/online transitions are edge-triggered', offline.length === 1 && online.length === 1)

lifecycle.dispose()
check('behavior: dispose removes all lifecycle listeners', doc.count('visibilitychange') === 0 && win.count('pageshow') === 0 && win.count('online') === 0 && win.count('offline') === 0)

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error(`\nR2.2A Mobile Runtime Lifecycle: ${checks.length - failed.length}/${checks.length} passed.`)
  process.exit(1)
}
console.log(`\nR2.2A Mobile Runtime Lifecycle: ${checks.length}/${checks.length} checks passed.`)
