const RECOVERY_KEY = 'nz-training-publish-recovery-v1'

const safeParse = (raw) => {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}
const eventPath = (event) => String(event?.trainingSheetPath || event?.training_sheet_path || '')

export function createTrainingPublishRecoveryStore(storage = globalThis.localStorage) {
  const requireStorage = () => {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
      throw new Error('Training publish recovery storage unavailable.')
    }
    return storage
  }

  return {
    read() {
      return safeParse(requireStorage().getItem(RECOVERY_KEY))
    },
    begin({ filePath, previousPath = '', eventId = '' }) {
      if (!filePath) throw new Error('Training publish recovery filePath missing.')
      const entry = {
        version: 1,
        filePath: String(filePath),
        previousPath: String(previousPath || ''),
        eventId: String(eventId || ''),
        startedAt: new Date().toISOString(),
      }
      requireStorage().setItem(RECOVERY_KEY, JSON.stringify(entry))
      return entry
    },
    clear() {
      requireStorage().removeItem(RECOVERY_KEY)
    },
  }
}

export async function reconcileInterruptedTrainingPublish({
  recoveryStore,
  calendarEvents = [],
  removePublishedPdf,
}) {
  const entry = recoveryStore?.read?.()
  if (!entry?.filePath) return { status: 'none' }

  const events = calendarEvents || []
  const newPathReferencedBy = events.find((event) => eventPath(event) === String(entry.filePath))

  if (newPathReferencedBy) {
    const previousPath = String(entry.previousPath || '')
    if (previousPath && previousPath !== String(entry.filePath)) {
      const previousStillReferenced = events.some((event) => eventPath(event) === previousPath)
      if (!previousStillReferenced) {
        try {
          const removedPrevious = await removePublishedPdf(previousPath)
          if (!removedPrevious) {
            return { status: 'cleanup-pending-previous', filePath: entry.filePath, previousPath }
          }
        } catch (error) {
          return { status: 'cleanup-pending-previous', filePath: entry.filePath, previousPath, error }
        }
      }
    }
    recoveryStore.clear()
    return { status: 'committed', eventId: String(newPathReferencedBy.id || entry.eventId || '') }
  }

  try {
    const removed = await removePublishedPdf(entry.filePath)
    if (!removed) return { status: 'cleanup-pending', filePath: entry.filePath }
    recoveryStore.clear()
    return { status: 'cleaned', filePath: entry.filePath }
  } catch (error) {
    return { status: 'cleanup-pending', filePath: entry.filePath, error }
  }
}
