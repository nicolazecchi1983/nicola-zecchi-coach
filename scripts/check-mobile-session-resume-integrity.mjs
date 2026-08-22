import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(process.cwd())
const guardPath = resolve(root, 'src/app/appSessionResumeGuard.js')
const kernelPath = resolve(root, 'src/app/appKernel.js')
const guardSource = readFileSync(guardPath, 'utf8')
const kernel = readFileSync(kernelPath, 'utf8')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const failures = []
let passes = 0

function check(label, condition) {
  if (condition) {
    passes += 1
    console.log(`PASS ${label}`)
  } else {
    failures.push(label)
    console.error(`FAIL ${label}`)
  }
}

check('dedicated session resume guard exists', guardSource.includes('createAppSessionResumeGuard'))
check('guard validates local session before remote user', guardSource.indexOf('await getSession()') < guardSource.indexOf('await getUser()'))
check('session validation has a single in-flight owner', guardSource.includes('let validationPromise = null'))
check('duplicate same-reason validations coalesce', guardSource.includes('if (reason !== activeReason) queuedReason = reason'))
check('different lifecycle reason is queued during validation', guardSource.includes('queuedReason = reason') && guardSource.includes('while (!disposed && queuedReason)'))
check('transient auth classifier exists', guardSource.includes('isTransientSessionValidationError'))
check('definitive auth classifier exists', guardSource.includes('isDefinitiveSessionValidationError'))
check('5xx server auth failures are transient', guardSource.includes('status >= 500'))
check('timeout and rate-limit auth failures are transient', guardSource.includes('[408, 425, 429].includes(status)'))
check('network transport failures are transient', guardSource.includes('TRANSIENT_AUTH_MESSAGE_RE'))
check('401/403 auth failures are definitive', guardSource.includes('[401, 403].includes(status)'))
check('thrown getSession failures are contained', guardSource.includes('sessionResult = await getSession()') && guardSource.includes("return deferred(reason, 'session', error)"))
check('thrown getUser failures are contained', guardSource.includes('userResult = await getUser()') && guardSource.includes("return deferred(reason, 'user', error)"))
check('missing local session is confirmed before login', guardSource.includes('confirmMissingLocalSession'))
check('definitive remote user failure is confirmed against current local session', guardSource.includes('confirmDefinitiveUserFailure'))
check('session appearing during confirmation is treated as stale', guardSource.includes('session-appeared-during-validation'))
check('session identity changing during auth failure is treated as stale', guardSource.includes('session-changed-during-validation'))
check('session/user mismatch is treated as stale', guardSource.includes('session-user-mismatch'))
check('auth generation dependency exists', guardSource.includes('getAuthGeneration = () => 0'))
check('auth generation changes suppress stale callbacks', guardSource.includes('auth-generation-changed'))
check('guard is disposable', guardSource.includes('function dispose()') && guardSource.includes('disposed = true'))
check('dispose clears queued validation', guardSource.includes('queuedReason = null'))
check('kernel owns auth generation counter', kernel.includes('let authGeneration = 0'))
check('kernel injects auth generation into guard', kernel.includes('getAuthGeneration: () => authGeneration'))
check('auth subscription increments generation before reconciliation', kernel.includes('authGeneration += 1'))
check('kernel uses verified auth-state user on dashboard reconcile', kernel.includes('verifiedUser: nextSession.user'))
check('verified resume user is reused without second auth fetch', kernel.includes('verifiedUser ?? (await getUser())?.data?.user ?? null'))
check('dashboard transitions have a monotonic view epoch', kernel.includes('let viewEpoch = 0') && kernel.includes('const transitionEpoch = ++viewEpoch'))
check('login invalidates older dashboard transitions', kernel.includes('viewEpoch += 1') && kernel.includes('async function showLogin()'))
check('stale dashboard transition is checked before auth fetch', kernel.includes("if (transitionEpoch !== viewEpoch) return Object.freeze({ status: 'superseded' })"))
check('stale dashboard transition is checked after data preparation', kernel.indexOf('await prepareAppData(user)') < kernel.lastIndexOf("status: 'superseded'"))
check('dashboard renders are serialized instead of returning wrong-user in-flight render', kernel.includes('let dashboardQueue = Promise.resolve()') && kernel.includes('dashboardQueue.catch(() => {}).then(request)'))
check('auth changed user forces controlled dashboard rebuild', kernel.includes('force: renderedUserId !== nextUserId'))
check('same mounted auth user still avoids destructive rerender', kernel.includes('renderedUserId === nextUserId') && kernel.includes("rootElement.querySelector('.workspace')"))
check('resume invalidates volatile data before session validation', kernel.indexOf('invalidateVolatileAppData(`resume:${source}`)') < kernel.indexOf('validateSessionAfterLifecycle(`resume:${source}`)'))
check('online recovery invalidates and validates session', kernel.includes("invalidateVolatileAppData('network:online')") && kernel.includes("validateSessionAfterLifecycle('network:online')"))
check('lifecycle validation rejection remains contained', kernel.includes('sessionResumeGuard.validate(reason).catch'))
check('kernel disposes lifecycle and session guard', kernel.includes('lifecycleController.dispose()') && kernel.includes('sessionResumeGuard.dispose()'))
check('release gate is registered', pkg.scripts?.['check:mobile-session-resume-integrity'] === 'node scripts/check-mobile-session-resume-integrity.mjs')
check('release gate belongs to canonical suite', pkg.staffCheckSuite?.includes('check:mobile-session-resume-integrity'))

const mod = await import(pathToFileURL(guardPath).href + `?t=${Date.now()}`)
const { createAppSessionResumeGuard, isTransientSessionValidationError, isDefinitiveSessionValidationError } = mod

async function behavior() {
  let getSessionCalls = 0
  let getUserCalls = 0
  let releaseSession
  const pendingSession = new Promise((resolvePromise) => { releaseSession = resolvePromise })
  const duplicate = createAppSessionResumeGuard({
    getSession: async () => { getSessionCalls += 1; await pendingSession; return { data: { session: { user: { id: 'u1' } } } } },
    getUser: async () => { getUserCalls += 1; return { data: { user: { id: 'u1' } } } },
    getRenderedUserId: () => 'u1',
  })
  const a = duplicate.validate('resume')
  const b = duplicate.validate('resume')
  releaseSession()
  const duplicateResults = await Promise.all([a, b])
  check('behavior: duplicate same-reason validation performs one auth pass', getSessionCalls === 1 && getUserCalls === 1 && duplicateResults.every((r) => r.status === 'valid'))

  let queuedSessionCalls = 0
  let queuedUserCalls = 0
  let releaseUser
  const pendingUser = new Promise((resolvePromise) => { releaseUser = resolvePromise })
  const queued = createAppSessionResumeGuard({
    getSession: async () => { queuedSessionCalls += 1; return { data: { session: { user: { id: 'u1' } } } } },
    getUser: async () => {
      queuedUserCalls += 1
      if (queuedUserCalls === 1) {
        await pendingUser
        const error = new Error('network error')
        error.code = 'ECONNRESET'
        throw error
      }
      return { data: { user: { id: 'u1' } } }
    },
    getRenderedUserId: () => 'u1',
  })
  const first = queued.validate('resume')
  await Promise.resolve()
  const second = queued.validate('network:online')
  releaseUser()
  const queuedResults = await Promise.all([first, second])
  check('behavior: online event arriving during failed resume gets a second validation pass', queuedSessionCalls === 2 && queuedUserCalls === 2 && queuedResults.every((r) => r.status === 'valid'))

  let missingCalls = 0
  let missingSessionCalls = 0
  const missing = createAppSessionResumeGuard({
    getSession: async () => { missingSessionCalls += 1; return { data: { session: null }, error: null } },
    getUser: async () => { throw new Error('getUser must not run without session') },
    onSessionMissing: async () => { missingCalls += 1 },
  })
  const missingResult = await missing.validate('resume')
  check('behavior: missing local session is confirmed and exits once', missingResult.status === 'missing' && missingCalls === 1 && missingSessionCalls === 2)

  let appearedCalls = 0
  let appearanceSessionCalls = 0
  const appeared = createAppSessionResumeGuard({
    getSession: async () => {
      appearanceSessionCalls += 1
      return { data: { session: appearanceSessionCalls === 1 ? null : { user: { id: 'u1' } } }, error: null }
    },
    getUser: async () => ({ data: { user: { id: 'u1' } } }),
    onSessionMissing: async () => { appearedCalls += 1 },
  })
  const appearedResult = await appeared.validate('resume')
  check('behavior: session appearing during missing-session confirmation avoids false login', appearedResult.status === 'stale' && appearedCalls === 0)

  const transient = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    getUser: async () => ({ data: { user: null }, error: new Error('Failed to fetch') }),
    onSessionMissing: async () => { missingCalls += 100 },
  })
  const transientResult = await transient.validate('online')
  check('behavior: network validation failure preserves mounted app', transientResult.status === 'deferred' && missingCalls === 1)

  let definitiveMissing = 0
  let definitiveSessionCalls = 0
  const revoked = createAppSessionResumeGuard({
    getSession: async () => { definitiveSessionCalls += 1; return { data: { session: { user: { id: 'u1' } } } } },
    getUser: async () => { const error = new Error('JWT expired'); error.status = 401; throw error },
    onSessionMissing: async () => { definitiveMissing += 1 },
  })
  const revokedResult = await revoked.validate('resume')
  check('behavior: definitive auth error is confirmed then returns to login', revokedResult.status === 'missing' && definitiveMissing === 1 && definitiveSessionCalls === 2)

  let changedMissing = 0
  let changedSessionCalls = 0
  const changedDuringFailure = createAppSessionResumeGuard({
    getSession: async () => {
      changedSessionCalls += 1
      return { data: { session: { user: { id: changedSessionCalls === 1 ? 'u1' : 'u2' } } } }
    },
    getUser: async () => { const error = new Error('JWT expired'); error.status = 401; throw error },
    onSessionMissing: async () => { changedMissing += 1 },
  })
  const changedDuringFailureResult = await changedDuringFailure.validate('resume')
  check('behavior: changed local session during definitive user failure cannot be logged out by stale validation', changedDuringFailureResult.status === 'stale' && changedMissing === 0)

  let generation = 0
  let generationChangedCallbacks = 0
  let releaseGenerationUser
  const generationUser = new Promise((resolvePromise) => { releaseGenerationUser = resolvePromise })
  const generationGuard = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    getUser: async () => { await generationUser; return { data: { user: { id: 'u1' } } } },
    getRenderedUserId: () => null,
    getAuthGeneration: () => generation,
    onUserChanged: async () => { generationChangedCallbacks += 1 },
  })
  const generationValidation = generationGuard.validate('resume')
  await Promise.resolve()
  generation += 1
  releaseGenerationUser()
  const generationResult = await generationValidation
  check('behavior: auth-state generation change suppresses stale user callback', generationResult.status === 'stale' && generationChangedCallbacks === 0)

  let changedCalls = 0
  const changed = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u2' } } } }),
    getUser: async () => ({ data: { user: { id: 'u2' } }, error: null }),
    getRenderedUserId: () => 'u1',
    onUserChanged: async () => { changedCalls += 1 },
  })
  const changedResult = await changed.validate('resume')
  check('behavior: changed authenticated user triggers controlled rebuild', changedResult.status === 'changed' && changedCalls === 1)

  let mismatchChangedCalls = 0
  const mismatch = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    getUser: async () => ({ data: { user: { id: 'u2' } }, error: null }),
    getRenderedUserId: () => 'u1',
    onUserChanged: async () => { mismatchChangedCalls += 1 },
  })
  const mismatchResult = await mismatch.validate('resume')
  check('behavior: session/user mismatch cannot render the wrong identity', mismatchResult.status === 'stale' && mismatchChangedCalls === 0)

  let loginRecoveryCalls = 0
  const loginRecovery = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
    getRenderedUserId: () => null,
    onUserChanged: async ({ user }) => { if (user.id === 'u1') loginRecoveryCalls += 1 },
  })
  const loginRecoveryResult = await loginRecovery.validate('online')
  check('behavior: recovered session remounts app from login state', loginRecoveryResult.status === 'changed' && loginRecoveryCalls === 1)

  check('behavior: 503 is transient', isTransientSessionValidationError({ status: 503, message: 'Service unavailable' }))
  check('behavior: 429 is transient', isTransientSessionValidationError({ status: 429, message: 'Too many requests' }))
  check('behavior: generic 400 is not definitive without auth evidence', !isDefinitiveSessionValidationError({ status: 400, message: 'Bad request' }))
  check('behavior: token-specific 400 remains definitive', isDefinitiveSessionValidationError({ status: 400, message: 'refresh token expired' }))
  check('behavior: 401 is definitive and not transient', isDefinitiveSessionValidationError({ status: 401, message: 'JWT expired' }) && !isTransientSessionValidationError({ status: 401, message: 'JWT expired' }))
  check('behavior: network reset is transient and not definitive', isTransientSessionValidationError({ code: 'ECONNRESET', message: 'network error' }) && !isDefinitiveSessionValidationError({ code: 'ECONNRESET', message: 'network error' }))

  let terminalSessionCalls = 0
  let releaseTerminal
  const terminalPause = new Promise((resolvePromise) => { releaseTerminal = resolvePromise })
  const terminal = createAppSessionResumeGuard({
    getSession: async () => { terminalSessionCalls += 1; if (terminalSessionCalls === 1) await terminalPause; return { data: { session: null }, error: null } },
    getUser: async () => ({ data: { user: null } }),
  })
  const terminalFirst = terminal.validate('resume')
  const terminalSecond = terminal.validate('network:online')
  releaseTerminal()
  const terminalResults = await Promise.all([terminalFirst, terminalSecond])
  check('behavior: definitive missing session clears queued follow-up instead of logging out twice', terminalSessionCalls === 2 && terminalResults.every((r) => r.status === 'missing'))

  let callbackAfterDispose = 0
  let releaseDisposeUser
  const disposeUser = new Promise((resolvePromise) => { releaseDisposeUser = resolvePromise })
  const disposeInFlight = createAppSessionResumeGuard({
    getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
    getUser: async () => { await disposeUser; return { data: { user: { id: 'u1' } } } },
    getRenderedUserId: () => null,
    onUserChanged: async () => { callbackAfterDispose += 1 },
  })
  const pendingDispose = disposeInFlight.validate('resume')
  await Promise.resolve()
  disposeInFlight.dispose()
  releaseDisposeUser()
  const disposedInflightResult = await pendingDispose
  check('behavior: dispose during validation suppresses callbacks', disposedInflightResult.status === 'disposed' && callbackAfterDispose === 0)
}

await behavior()

if (failures.length) {
  console.error(`\nR2.2B Mobile Session Resume Integrity: ${passes}/${passes + failures.length}`)
  process.exit(1)
}
console.log(`\nR2.2B Mobile Session Resume Integrity: ${passes}/${passes} checks passed.`)
