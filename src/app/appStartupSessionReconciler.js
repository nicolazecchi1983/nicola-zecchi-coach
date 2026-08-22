import {
  isDefinitiveSessionValidationError,
  isTransientSessionValidationError,
} from './appSessionResumeGuard.js'

function superseded(reason = 'auth-generation-changed') {
  return Object.freeze({ status: 'superseded', reason })
}

function deferred(reason, error = null) {
  return Object.freeze({
    status: 'deferred',
    reason,
    transient: isTransientSessionValidationError(error),
  })
}

export function createAppStartupSessionReconciler({
  getSession,
  getAuthGeneration = () => 0,
  isDisposed = () => false,
  showDashboard,
  showLogin,
} = {}) {
  if (typeof getSession !== 'function') throw new Error('getSession dependency required')
  if (typeof showDashboard !== 'function') throw new Error('showDashboard dependency required')
  if (typeof showLogin !== 'function') throw new Error('showLogin dependency required')

  let inFlight = null

  function generationChanged(generationAtStart) {
    return getAuthGeneration() !== generationAtStart
  }

  async function showLoginIfCurrent(generationAtStart) {
    if (isDisposed()) return Object.freeze({ status: 'disposed' })
    if (generationChanged(generationAtStart)) return superseded()
    await showLogin()
    if (isDisposed()) return Object.freeze({ status: 'disposed' })
    if (generationChanged(generationAtStart)) return superseded()
    return null
  }

  async function reconcile() {
    if (isDisposed()) return Object.freeze({ status: 'disposed' })
    if (inFlight) return inFlight

    const generationAtStart = getAuthGeneration()
    const run = (async () => {
      let result
      try {
        result = await getSession()
      } catch (error) {
        if (isDisposed()) return Object.freeze({ status: 'disposed' })
        if (generationChanged(generationAtStart)) return superseded()

        const loginOutcome = await showLoginIfCurrent(generationAtStart)
        if (loginOutcome) return loginOutcome
        if (isDefinitiveSessionValidationError(error)) {
          return Object.freeze({ status: 'login', reason: 'session-read-definitive', error })
        }
        return deferred('session-read-failed', error)
      }

      if (isDisposed()) return Object.freeze({ status: 'disposed' })
      if (generationChanged(generationAtStart)) return superseded()

      const sessionError = result?.error ?? null
      if (sessionError) {
        const loginOutcome = await showLoginIfCurrent(generationAtStart)
        if (loginOutcome) return loginOutcome
        if (isDefinitiveSessionValidationError(sessionError)) {
          return Object.freeze({ status: 'login', reason: 'session-read-definitive', error: sessionError })
        }
        return deferred('session-read-failed', sessionError)
      }

      const session = result?.data?.session ?? null
      if (!session?.user) {
        const loginOutcome = await showLoginIfCurrent(generationAtStart)
        if (loginOutcome) return loginOutcome
        return Object.freeze({ status: 'login', reason: 'missing-session' })
      }

      if (isDisposed()) return Object.freeze({ status: 'disposed' })
      if (generationChanged(generationAtStart)) return superseded()
      await showDashboard({ verifiedUser: session.user })
      if (isDisposed()) return Object.freeze({ status: 'disposed' })
      if (generationChanged(generationAtStart)) return superseded()
      return Object.freeze({ status: 'dashboard', userId: session.user.id })
    })()

    inFlight = run
    try {
      return await run
    } finally {
      if (inFlight === run) inFlight = null
    }
  }

  return Object.freeze({
    reconcile,
    getState() {
      return Object.freeze({ inFlight: Boolean(inFlight) })
    },
  })
}
