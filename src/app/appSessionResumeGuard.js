const TRANSIENT_AUTH_MESSAGE_RE = /(failed to fetch|networkerror|network error|load failed|connection (?:reset|refused)|internet disconnected|offline|econnreset|enotfound|eai_again|timed out|timeout)/i
const DEFINITIVE_AUTH_CODE_RE = /(bad_jwt|invalid.*token|refresh.*token|session.*missing|session.*not.*found|jwt.*expired|token.*expired|unauthorized|forbidden)/i

export function isTransientSessionValidationError(error) {
  if (!error) return false
  const status = Number(error?.status ?? error?.statusCode ?? 0)
  if (status >= 500 || [408, 425, 429].includes(status)) return true
  const code = String(error?.code ?? error?.name ?? '').toLowerCase()
  if (['etimedout', 'econnreset', 'enotfound', 'eai_again', 'aborterror'].some((part) => code.includes(part))) return true
  return TRANSIENT_AUTH_MESSAGE_RE.test(String(error?.message ?? error))
}

export function isDefinitiveSessionValidationError(error) {
  if (!error) return false
  const status = Number(error?.status ?? error?.statusCode ?? 0)
  if ([401, 403].includes(status)) return true
  const code = String(error?.code ?? error?.name ?? '')
  const message = String(error?.message ?? '')
  return DEFINITIVE_AUTH_CODE_RE.test(`${code} ${message}`)
}

function deferred(reason, stage, error = null) {
  return Object.freeze({
    status: 'deferred',
    reason,
    stage,
    transient: isTransientSessionValidationError(error),
  })
}

function stale(reason, detail = {}) {
  return Object.freeze({ status: 'stale', reason, ...detail })
}

export function createAppSessionResumeGuard({
  getSession,
  getUser,
  getRenderedUserId = () => null,
  getAuthGeneration = () => 0,
  onSessionMissing = async () => {},
  onUserChanged = async () => {},
} = {}) {
  if (typeof getSession !== 'function') throw new Error('getSession dependency required')
  if (typeof getUser !== 'function') throw new Error('getUser dependency required')

  let disposed = false
  let validationPromise = null
  let activeReason = null
  let queuedReason = null

  function generationChanged(startGeneration) {
    return getAuthGeneration() !== startGeneration
  }

  async function handleDefinitiveMissing({ reason, stage, error = null, startGeneration }) {
    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (generationChanged(startGeneration)) return stale(reason, { stage, cause: 'auth-generation-changed' })
    await onSessionMissing({ reason, stage, error })
    return Object.freeze({ status: 'missing', reason, stage })
  }

  async function confirmMissingLocalSession({ reason, startGeneration }) {
    let confirmation
    try {
      confirmation = await getSession()
    } catch (error) {
      if (disposed) return Object.freeze({ status: 'disposed', reason })
      if (generationChanged(startGeneration)) return stale(reason, { stage: 'session-confirm', cause: 'auth-generation-changed' })
      if (isDefinitiveSessionValidationError(error)) {
        return handleDefinitiveMissing({ reason, stage: 'session-confirm', error, startGeneration })
      }
      return deferred(reason, 'session-confirm', error)
    }

    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (generationChanged(startGeneration)) return stale(reason, { stage: 'session-confirm', cause: 'auth-generation-changed' })

    const confirmationError = confirmation?.error ?? null
    const confirmedSession = confirmation?.data?.session ?? null
    if (confirmationError) {
      if (isDefinitiveSessionValidationError(confirmationError)) {
        return handleDefinitiveMissing({ reason, stage: 'session-confirm', error: confirmationError, startGeneration })
      }
      return deferred(reason, 'session-confirm', confirmationError)
    }

    if (confirmedSession) {
      return stale(reason, {
        stage: 'session-confirm',
        cause: 'session-appeared-during-validation',
        userId: confirmedSession?.user?.id ?? null,
      })
    }

    return handleDefinitiveMissing({ reason, stage: 'session', startGeneration })
  }

  async function confirmDefinitiveUserFailure({ reason, error, observedSessionUserId, startGeneration }) {
    let confirmation
    try {
      confirmation = await getSession()
    } catch (confirmationError) {
      if (disposed) return Object.freeze({ status: 'disposed', reason })
      if (generationChanged(startGeneration)) return stale(reason, { stage: 'user-confirm', cause: 'auth-generation-changed' })
      if (!isDefinitiveSessionValidationError(confirmationError)) return deferred(reason, 'user-confirm', confirmationError)
      return handleDefinitiveMissing({ reason, stage: 'user', error, startGeneration })
    }

    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (generationChanged(startGeneration)) return stale(reason, { stage: 'user-confirm', cause: 'auth-generation-changed' })

    const confirmationError = confirmation?.error ?? null
    const confirmedSession = confirmation?.data?.session ?? null
    if (confirmationError && !isDefinitiveSessionValidationError(confirmationError)) {
      return deferred(reason, 'user-confirm', confirmationError)
    }

    const confirmedUserId = confirmedSession?.user?.id ?? null
    if (confirmedUserId && observedSessionUserId && confirmedUserId !== observedSessionUserId) {
      return stale(reason, {
        stage: 'user-confirm',
        cause: 'session-changed-during-validation',
        sessionUserId: observedSessionUserId,
        confirmedUserId,
      })
    }

    return handleDefinitiveMissing({ reason, stage: 'user', error, startGeneration })
  }

  async function validateOnce(reason) {
    const startGeneration = getAuthGeneration()
    let sessionResult
    try {
      sessionResult = await getSession()
    } catch (error) {
      if (disposed) return Object.freeze({ status: 'disposed', reason })
      if (generationChanged(startGeneration)) return stale(reason, { stage: 'session', cause: 'auth-generation-changed' })
      if (isDefinitiveSessionValidationError(error)) {
        return handleDefinitiveMissing({ reason, stage: 'session', error, startGeneration })
      }
      return deferred(reason, 'session', error)
    }

    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (generationChanged(startGeneration)) return stale(reason, { stage: 'session', cause: 'auth-generation-changed' })

    const sessionError = sessionResult?.error ?? null
    const session = sessionResult?.data?.session ?? null
    if (sessionError) {
      if (isDefinitiveSessionValidationError(sessionError)) {
        return handleDefinitiveMissing({ reason, stage: 'session', error: sessionError, startGeneration })
      }
      return deferred(reason, 'session', sessionError)
    }

    if (!session) {
      return confirmMissingLocalSession({ reason, startGeneration })
    }

    const observedSessionUserId = session?.user?.id ?? null
    let userResult
    try {
      userResult = await getUser()
    } catch (error) {
      if (disposed) return Object.freeze({ status: 'disposed', reason })
      if (generationChanged(startGeneration)) return stale(reason, { stage: 'user', cause: 'auth-generation-changed' })
      if (isDefinitiveSessionValidationError(error)) {
        return confirmDefinitiveUserFailure({ reason, error, observedSessionUserId, startGeneration })
      }
      return deferred(reason, 'user', error)
    }

    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (generationChanged(startGeneration)) return stale(reason, { stage: 'user', cause: 'auth-generation-changed' })

    const user = userResult?.data?.user ?? null
    const userError = userResult?.error ?? null
    if (!user) {
      if (userError && !isDefinitiveSessionValidationError(userError)) {
        return deferred(reason, 'user', userError)
      }
      if (userError && isDefinitiveSessionValidationError(userError)) {
        return confirmDefinitiveUserFailure({ reason, error: userError, observedSessionUserId, startGeneration })
      }
      return handleDefinitiveMissing({ reason, stage: 'user', error: userError, startGeneration })
    }

    if (observedSessionUserId && observedSessionUserId !== user.id) {
      return stale(reason, {
        stage: 'user',
        cause: 'session-user-mismatch',
        sessionUserId: observedSessionUserId,
        userId: user.id,
      })
    }

    const renderedUserId = getRenderedUserId()
    if (renderedUserId !== user.id) {
      if (generationChanged(startGeneration)) return stale(reason, { stage: 'user-change', cause: 'auth-generation-changed' })
      await onUserChanged({ reason, previousUserId: renderedUserId, user })
      return Object.freeze({ status: 'changed', reason, userId: user.id })
    }

    return Object.freeze({ status: 'valid', reason, userId: user.id })
  }

  async function validate(reason = 'resume') {
    if (disposed) return Object.freeze({ status: 'disposed', reason })
    if (validationPromise) {
      if (reason !== activeReason) queuedReason = reason
      return validationPromise
    }
    queuedReason = reason

    validationPromise = (async () => {
      let result = Object.freeze({ status: 'deferred', reason, stage: 'queue' })
      while (!disposed && queuedReason) {
        const currentReason = queuedReason
        queuedReason = null
        activeReason = currentReason
        result = await validateOnce(currentReason)
        activeReason = null
        if (result?.status === 'missing' || result?.status === 'disposed') {
          queuedReason = null
          break
        }
      }
      return disposed ? Object.freeze({ status: 'disposed', reason }) : result
    })()

    try {
      return await validationPromise
    } finally {
      activeReason = null
      validationPromise = null
    }
  }

  function dispose() {
    disposed = true
    activeReason = null
    queuedReason = null
  }

  return Object.freeze({
    validate,
    dispose,
    getState() {
      return Object.freeze({ disposed, validating: Boolean(validationPromise), activeReason, queued: Boolean(queuedReason) })
    },
  })
}
