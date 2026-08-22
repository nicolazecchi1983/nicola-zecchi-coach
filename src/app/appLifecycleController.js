export const DEFAULT_MOBILE_RESUME_THRESHOLD_MS = 30_000

export function createAppLifecycleController({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  navigatorRef = globalThis.navigator,
  now = () => Date.now(),
  resumeThresholdMs = DEFAULT_MOBILE_RESUME_THRESHOLD_MS,
  onResume = () => {},
  onOnline = () => {},
  onOffline = () => {},
} = {}) {
  let started = false
  let hiddenAt = documentRef?.hidden ? now() : 0
  let offline = navigatorRef?.onLine === false

  function handleVisibilityChange() {
    if (documentRef?.hidden) {
      hiddenAt = now()
      return
    }

    if (!hiddenAt) return
    const awayMs = Math.max(0, now() - hiddenAt)
    hiddenAt = 0
    if (awayMs >= resumeThresholdMs) {
      onResume({ source: 'visibilitychange', awayMs, persisted: false })
    }
  }

  function handlePageShow(event) {
    if (event?.persisted) {
      hiddenAt = 0
      onResume({ source: 'pageshow', awayMs: null, persisted: true })
    }
  }

  function handleOnline() {
    if (!offline) return
    offline = false
    onOnline({ source: 'online' })
  }

  function handleOffline() {
    if (offline) return
    offline = true
    onOffline({ source: 'offline' })
  }

  function start() {
    if (started) return
    started = true
    documentRef?.addEventListener?.('visibilitychange', handleVisibilityChange)
    windowRef?.addEventListener?.('pageshow', handlePageShow)
    windowRef?.addEventListener?.('online', handleOnline)
    windowRef?.addEventListener?.('offline', handleOffline)
  }

  function dispose() {
    if (!started) return
    started = false
    documentRef?.removeEventListener?.('visibilitychange', handleVisibilityChange)
    windowRef?.removeEventListener?.('pageshow', handlePageShow)
    windowRef?.removeEventListener?.('online', handleOnline)
    windowRef?.removeEventListener?.('offline', handleOffline)
  }

  return Object.freeze({
    start,
    dispose,
    getState() {
      return Object.freeze({ started, hiddenAt, offline })
    },
  })
}
