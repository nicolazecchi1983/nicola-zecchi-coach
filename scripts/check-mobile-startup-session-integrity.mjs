import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const kernelPath = path.join(root, 'src/app/appKernel.js')
const reconcilerPath = path.join(root, 'src/app/appStartupSessionReconciler.js')
const packagePath = path.join(root, 'package.json')

const kernel = fs.readFileSync(kernelPath, 'utf8')
const reconcilerSource = fs.readFileSync(reconcilerPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const { createAppStartupSessionReconciler } = await import(pathToFileURL(reconcilerPath).href)

let passed = 0
function check(label, condition) {
  if (!condition) {
    console.error(`FAIL ${label}`)
    process.exitCode = 1
    return
  }
  passed += 1
  console.log(`PASS ${label}`)
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

check('dedicated startup session reconciler exists', fs.existsSync(reconcilerPath))
check('startup reconciler is dependency-injected', reconcilerSource.includes('getSession,') && reconcilerSource.includes('showDashboard,') && reconcilerSource.includes('showLogin,'))
check('startup reconciliation is single-flight', reconcilerSource.includes('let inFlight = null') && reconcilerSource.includes('if (inFlight) return inFlight'))
check('startup generation snapshot exists', reconcilerSource.includes('const generationAtStart = getAuthGeneration()'))
check('startup generation change suppresses stale reconciliation', reconcilerSource.includes('function superseded') && reconcilerSource.includes("reason = 'auth-generation-changed'"))
check('startup rechecks generation after login/dashboard callback', reconcilerSource.includes('function generationChanged') && (reconcilerSource.match(/generationChanged\(generationAtStart\)/g) || []).length >= 5)
check('startup reuses session user without remote getUser', reconcilerSource.includes('showDashboard({ verifiedUser: session.user })'))
check('startup handles thrown getSession', reconcilerSource.includes('try {') && reconcilerSource.includes('result = await getSession()') && reconcilerSource.includes('catch (error)'))
check('startup handles getSession result.error', reconcilerSource.includes('const sessionError = result?.error ?? null'))
check('startup shares auth error classification with resume guard', reconcilerSource.includes('isTransientSessionValidationError') && reconcilerSource.includes('isDefinitiveSessionValidationError'))
check('startup handles missing session explicitly', reconcilerSource.includes("reason: 'missing-session'"))
check('startup respects dispose before work', reconcilerSource.includes("if (isDisposed()) return Object.freeze({ status: 'disposed' })"))
check('kernel owns startup reconciler', kernel.includes("createAppStartupSessionReconciler"))
check('kernel binds auth subscription before startup reconciliation', kernel.indexOf('bindAuthSubscription()') < kernel.indexOf('startupSessionReconciler.reconcile()'))
check('kernel start is single-flight', kernel.includes('let startPromise = null') && kernel.includes('if (startPromise) return startPromise'))
check('kernel start is idempotent after success', kernel.includes("if (started) return Object.freeze({ status: 'already-started' })"))
check('kernel startup failure can be retried', kernel.includes('if (!disposed) started = false'))
check('kernel auth callback ignores post-dispose events', kernel.includes('if (disposed) return'))
check('kernel dispose invalidates dashboard transitions', kernel.includes('disposed = true') && kernel.includes('viewEpoch += 1'))
check('kernel still uses verified auth-state user', kernel.includes('verifiedUser: nextSession.user'))
check('kernel tracks auth transitions instead of fire-and-forget renders', kernel.includes('let authTransitionPromise = null') && kernel.includes('trackAuthTransition(showDashboard') && kernel.includes('trackAuthTransition(showLogin())'))
check('superseded startup drains changing auth transitions', kernel.includes("startupResult?.status === 'superseded'") && kernel.includes('awaitAuthTransitionsSettled'))
check('auth transition drain is bounded', kernel.includes('async function awaitAuthTransitionsSettled(maxPasses = 8)'))
check('auth transition sequencing is monotonic', kernel.includes('let authTransitionVersion = 0') && kernel.includes('authTransitionVersion += 1'))
check('startup gate is registered', pkg.scripts?.['check:mobile-startup-session-integrity'] === 'node scripts/check-mobile-startup-session-integrity.mjs')
check('startup gate belongs to canonical suite', pkg.staffCheckSuite?.includes('check:mobile-startup-session-integrity'))

{
  let sessionCalls = 0
  let dashboardCalls = 0
  const pending = deferred()
  const guard = createAppStartupSessionReconciler({
    getSession: () => { sessionCalls += 1; return pending.promise },
    getAuthGeneration: () => 0,
    showDashboard: async () => { dashboardCalls += 1 },
    showLogin: async () => {},
  })
  const a = guard.reconcile()
  const b = guard.reconcile()
  pending.resolve({ data: { session: { user: { id: 'u1' } } } })
  const [ra, rb] = await Promise.all([a, b])
  check('behavior: duplicate startup reconcile performs one session read', sessionCalls === 1 && dashboardCalls === 1 && ra.status === 'dashboard' && rb.status === 'dashboard')
}

{
  let capturedUser = null
  const user = { id: 'u2', email: 'u2@example.test' }
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: { user } } }),
    getAuthGeneration: () => 0,
    showDashboard: async ({ verifiedUser }) => { capturedUser = verifiedUser },
    showLogin: async () => {},
  })
  const result = await guard.reconcile()
  check('behavior: local session user is passed directly to dashboard', result.status === 'dashboard' && capturedUser === user)
}

{
  let generation = 0
  let dashboardCalls = 0
  let loginCalls = 0
  const pending = deferred()
  const guard = createAppStartupSessionReconciler({
    getSession: () => pending.promise,
    getAuthGeneration: () => generation,
    showDashboard: async () => { dashboardCalls += 1 },
    showLogin: async () => { loginCalls += 1 },
  })
  const run = guard.reconcile()
  generation = 1
  pending.resolve({ data: { session: { user: { id: 'old-user' } } } })
  const result = await run
  check('behavior: auth generation change suppresses stale startup render', result.status === 'superseded' && dashboardCalls === 0 && loginCalls === 0)
}

{
  let generation = 0
  let loginCalls = 0
  const pending = deferred()
  const guard = createAppStartupSessionReconciler({
    getSession: () => pending.promise,
    getAuthGeneration: () => generation,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1 },
  })
  const run = guard.reconcile()
  generation = 1
  pending.reject(new Error('storage read failed'))
  const result = await run
  check('behavior: thrown startup read cannot overwrite newer auth state', result.status === 'superseded' && loginCalls === 0)
}

{
  let loginCalls = 0
  const guard = createAppStartupSessionReconciler({
    getSession: async () => { throw new Error('storage read failed') },
    getAuthGeneration: () => 0,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1 },
  })
  const result = await guard.reconcile()
  check('behavior: stable unknown thrown startup read is deferred without claiming signed-out', result.status === 'deferred' && result.reason === 'session-read-failed' && loginCalls === 1)
}

{
  let loginCalls = 0
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: null } }),
    getAuthGeneration: () => 0,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1 },
  })
  const result = await guard.reconcile()
  check('behavior: missing startup session renders login once', result.status === 'login' && result.reason === 'missing-session' && loginCalls === 1)
}

{
  let disposed = true
  let sessionCalls = 0
  const guard = createAppStartupSessionReconciler({
    getSession: async () => { sessionCalls += 1; return { data: { session: null } } },
    isDisposed: () => disposed,
    showDashboard: async () => {},
    showLogin: async () => {},
  })
  const result = await guard.reconcile()
  check('behavior: disposed kernel never starts startup session work', result.status === 'disposed' && sessionCalls === 0)
}

{
  let disposed = false
  let dashboardCalls = 0
  let loginCalls = 0
  const pending = deferred()
  const guard = createAppStartupSessionReconciler({
    getSession: () => pending.promise,
    isDisposed: () => disposed,
    getAuthGeneration: () => 0,
    showDashboard: async () => { dashboardCalls += 1 },
    showLogin: async () => { loginCalls += 1 },
  })
  const run = guard.reconcile()
  disposed = true
  pending.resolve({ data: { session: { user: { id: 'u3' } } } })
  const result = await run
  check('behavior: dispose during startup suppresses late callbacks', result.status === 'disposed' && dashboardCalls === 0 && loginCalls === 0)
}


{
  let generation = 0
  let dashboardCalls = 0
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: { user: { id: 'u4' } } } }),
    getAuthGeneration: () => generation,
    showDashboard: async () => { dashboardCalls += 1; generation = 1 },
    showLogin: async () => {},
  })
  const result = await guard.reconcile()
  check('behavior: auth change during dashboard callback marks startup superseded', result.status === 'superseded' && dashboardCalls === 1)
}

{
  let generation = 0
  let loginCalls = 0
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: null } }),
    getAuthGeneration: () => generation,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1; generation = 1 },
  })
  const result = await guard.reconcile()
  check('behavior: auth change during login callback marks startup superseded', result.status === 'superseded' && loginCalls === 1)
}

{
  let loginCalls = 0
  const error = Object.assign(new Error('Service unavailable'), { status: 503 })
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: null }, error }),
    getAuthGeneration: () => 0,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1 },
  })
  const result = await guard.reconcile()
  check('behavior: result.error 503 is deferred rather than definitive logout', result.status === 'deferred' && result.transient === true && loginCalls === 1)
}

{
  let loginCalls = 0
  const error = Object.assign(new Error('JWT expired'), { status: 401, code: 'bad_jwt' })
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: null }, error }),
    getAuthGeneration: () => 0,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1 },
  })
  const result = await guard.reconcile()
  check('behavior: result.error definitive auth failure reaches controlled login', result.status === 'login' && result.reason === 'session-read-definitive' && loginCalls === 1)
}

{
  let generation = 0
  let loginCalls = 0
  const error = Object.assign(new Error('Service unavailable'), { status: 503 })
  const guard = createAppStartupSessionReconciler({
    getSession: async () => ({ data: { session: null }, error }),
    getAuthGeneration: () => generation,
    showDashboard: async () => {},
    showLogin: async () => { loginCalls += 1; generation += 1 },
  })
  const result = await guard.reconcile()
  check('behavior: auth change during transient fallback supersedes stale startup result', result.status === 'superseded' && loginCalls === 1)
}

{
  let calls = 0
  const first = deferred()
  const guard = createAppStartupSessionReconciler({
    getSession: async () => {
      calls += 1
      if (calls === 1) return first.promise
      return { data: { session: { user: { id: 'retry-user' } } } }
    },
    getAuthGeneration: () => 0,
    showDashboard: async () => {},
    showLogin: async () => {},
  })
  const firstRun = guard.reconcile()
  first.resolve({ data: { session: null }, error: Object.assign(new Error('timeout'), { status: 503 }) })
  const firstResult = await firstRun
  const secondResult = await guard.reconcile()
  check('behavior: deferred startup reconciliation releases single-flight for retry', firstResult.status === 'deferred' && secondResult.status === 'dashboard' && calls === 2)
}

if (!process.exitCode) {
  console.log(`\nR2.2C Mobile Startup Session Integrity: ${passed}/${passed} checks passed.`)
}
