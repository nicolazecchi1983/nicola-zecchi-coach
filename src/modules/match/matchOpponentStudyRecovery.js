const RECOVERY_PREFIX = 'staff-match-opponent-study-recovery:v1:'

const cleanPath = (value) => String(value || '').trim()
const cleanBucket = (value) => String(value || '').trim()

const uniquePaths = (values = []) => Array.from(new Set(
  (Array.isArray(values) ? values : [values])
    .map(cleanPath)
    .filter(Boolean),
))

const normalizeLocation = (value, defaultBucket = '') => {
  if (typeof value === 'string') {
    const path = cleanPath(value)
    return path ? { bucket: cleanBucket(defaultBucket), path } : null
  }
  const path = cleanPath(value?.path)
  if (!path) return null
  return {
    bucket: cleanBucket(value?.bucket || defaultBucket),
    path,
  }
}

const uniqueLocations = (values = [], defaultBucket = '') => {
  const result = []
  const seen = new Set()
  for (const value of (Array.isArray(values) ? values : [values])) {
    const location = normalizeLocation(value, defaultBucket)
    if (!location) continue
    const key = `${location.bucket}::${location.path}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(location)
  }
  return result
}

const requireStorage = (storage) => {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    throw new Error('Match opponent study recovery storage unavailable.')
  }
  return storage
}

const recoveryKey = (matchId) => `${RECOVERY_PREFIX}${encodeURIComponent(String(matchId || '').trim())}`

const safeParse = (raw) => {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function collectMatchOpponentStudyAssetPaths(study = {}) {
  return uniquePaths([
    study?.primaryReport?.path,
    ...(Array.isArray(study?.assets) ? study.assets.map((asset) => asset?.path) : []),
    study?.opponentLineup?.path,
  ])
}

export function collectMatchOpponentStudyAssetLocations(study = {}, { defaultBucket = '' } = {}) {
  return uniqueLocations([
    study?.primaryReport,
    ...(Array.isArray(study?.assets) ? study.assets : []),
    study?.opponentLineup,
  ], defaultBucket)
}

export function createMatchOpponentStudyRecoveryStore(storage = globalThis.localStorage, { defaultBucket = '' } = {}) {
  const read = (matchId) => {
    const id = String(matchId || '').trim()
    if (!id) return null
    const parsed = safeParse(requireStorage(storage).getItem(recoveryKey(id)))
    if (!parsed) return null
    const locations = uniqueLocations(parsed.locations?.length ? parsed.locations : parsed.paths, defaultBucket)
    return {
      ...parsed,
      version: 2,
      matchId: id,
      locations,
      paths: locations.map((item) => item.path),
    }
  }

  const write = (matchId, values, startedAt = '') => {
    const id = String(matchId || '').trim()
    if (!id) throw new Error('Match opponent study recovery matchId missing.')
    const locations = uniqueLocations(values, defaultBucket)
    if (!locations.length) {
      requireStorage(storage).removeItem(recoveryKey(id))
      return null
    }
    const entry = {
      version: 2,
      matchId: id,
      locations,
      startedAt: String(startedAt || new Date().toISOString()),
    }
    requireStorage(storage).setItem(recoveryKey(id), JSON.stringify(entry))
    return { ...entry, paths: locations.map((item) => item.path) }
  }

  return {
    defaultBucket: cleanBucket(defaultBucket),
    read,
    begin({ matchId, locations = [], paths = [] } = {}) {
      const current = read(matchId)
      const incoming = locations.length ? locations : paths
      return write(
        matchId,
        [...(current?.locations || []), ...uniqueLocations(incoming, defaultBucket)],
        current?.startedAt,
      )
    },
    track(matchId, values = []) {
      const current = read(matchId)
      return write(matchId, [...(current?.locations || []), ...uniqueLocations(values, defaultBucket)], current?.startedAt)
    },
    replace(matchId, values = []) {
      const current = read(matchId)
      return write(matchId, values, current?.startedAt)
    },
    clear(matchId) {
      const id = String(matchId || '').trim()
      if (!id) return
      requireStorage(storage).removeItem(recoveryKey(id))
    },
  }
}

export async function reconcileInterruptedMatchOpponentStudy({
  recoveryStore,
  matchId,
  study,
  removeAsset,
  defaultBucket = '',
} = {}) {
  const entry = recoveryStore?.read?.(matchId)
  if (!entry?.locations?.length) return { status: 'none', cleaned: [], preserved: [], pending: [] }
  if (typeof removeAsset !== 'function') throw new Error('Match opponent study recovery removeAsset missing.')

  const referenced = new Set(
    collectMatchOpponentStudyAssetLocations(study, { defaultBucket })
      .map((item) => `${item.bucket}::${item.path}`)
  )
  const cleaned = []
  const preserved = []
  const pendingLocations = []

  for (const location of uniqueLocations(entry.locations, defaultBucket)) {
    const key = `${location.bucket}::${location.path}`
    if (referenced.has(key)) {
      preserved.push(location.path)
      continue
    }
    try {
      const removed = await removeAsset(location.path, location.bucket)
      if (removed === false) throw new Error('Storage cleanup returned false.')
      cleaned.push(location.path)
    } catch (error) {
      pendingLocations.push(location)
    }
  }

  if (pendingLocations.length) {
    recoveryStore.replace(matchId, pendingLocations)
    return { status: 'cleanup-pending', cleaned, preserved, pending: pendingLocations.map((item) => item.path) }
  }

  recoveryStore.clear(matchId)
  return { status: 'reconciled', cleaned, preserved, pending: [] }
}
