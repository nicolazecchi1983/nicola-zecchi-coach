export const DEFAULT_CALENDAR_CACHE_TTL_MS = 30_000

export function createCalendarReadCoordinator({
  load,
  apply,
  now = () => Date.now(),
  ttlMs = DEFAULT_CALENDAR_CACHE_TTL_MS,
} = {}) {
  if (typeof load !== 'function') throw new TypeError('Calendar read coordinator requires load()')
  if (typeof apply !== 'function') throw new TypeError('Calendar read coordinator requires apply()')

  let loadedAt = 0
  let inFlight = null

  const isFresh = () => loadedAt > 0 && (now() - loadedAt) < ttlMs

  const refresh = async () => {
    if (inFlight) return inFlight

    inFlight = (async () => {
      const events = await load()
      apply(events)
      loadedAt = now()
      return events
    })()

    try {
      return await inFlight
    } finally {
      inFlight = null
    }
  }

  return Object.freeze({
    refresh,
    ensure() {
      return isFresh() ? Promise.resolve(null) : refresh()
    },
    invalidate() {
      loadedAt = 0
    },
    isFresh,
    getLoadedAt() {
      return loadedAt
    },
  })
}
