import { TRAINING_SHEET_STATUS, normalizeTrainingSheetData } from './trainingSheetModel.js'

const normalizedEventId = (value) => String(value || '').trim()

const timestampMs = (value) => {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildTrainingDraftMeta({
  eventId = '',
  dirty = false,
  baseUpdatedAt = null,
  savedAt = new Date().toISOString(),
} = {}) {
  return {
    version: 1,
    eventId: normalizedEventId(eventId),
    dirty: Boolean(dirty),
    baseUpdatedAt: baseUpdatedAt || null,
    savedAt,
  }
}

export function trainingDraftContentSignature(data = {}) {
  const normalized = normalizeTrainingSheetData(data)
  const { created_at, updated_at, published_at, archived_at, ...content } = normalized
  return JSON.stringify(content)
}

export function hasTrainingDraftContentChanges(localData, serverData) {
  if (!localData || !serverData) return Boolean(localData) !== Boolean(serverData)
  return trainingDraftContentSignature(localData) !== trainingDraftContentSignature(serverData)
}

export function resolveTrainingDraftSource({
  eventId = '',
  localData = null,
  localMeta = null,
  serverData = null,
  hasPublishedPath = false,
} = {}) {
  const normalizedId = normalizedEventId(eventId)
  const metaEventId = normalizedEventId(localMeta?.eventId)
  const localMatchesEvent = Boolean(localData)
    && (normalizedId ? metaEventId === normalizedId : metaEventId === '')

  if (!localMatchesEvent) {
    return {
      data: serverData || null,
      dirty: false,
      source: serverData ? 'server' : 'empty',
      staleLocal: false,
    }
  }

  const localDirty = Boolean(localMeta?.dirty)
  const serverIsPublished = Boolean(hasPublishedPath)
    || serverData?.status === TRAINING_SHEET_STATUS.PUBLISHED

  // For a linked draft with no published server document, the local snapshot is
  // the only editable source of truth and must survive reloads.
  if (!serverIsPublished) {
    return {
      data: localData,
      dirty: localDirty,
      source: 'local-draft',
      staleLocal: false,
    }
  }

  if (!localDirty) {
    return {
      data: serverData || localData,
      dirty: false,
      source: serverData ? 'server' : 'local-clean',
      staleLocal: false,
    }
  }

  const baseUpdatedAtMs = timestampMs(localMeta?.baseUpdatedAt)
  const serverUpdatedAtMs = timestampMs(serverData?.updated_at || serverData?.updatedAt)
  const serverIsNewer = Boolean(serverUpdatedAtMs && baseUpdatedAtMs && serverUpdatedAtMs > baseUpdatedAtMs)

  // A newer server publication (for example from another device) must win over
  // a stale local draft. This avoids silently overwriting a newer canonical TS.
  if (serverIsNewer) {
    return {
      data: serverData,
      dirty: false,
      source: 'server-newer',
      staleLocal: true,
    }
  }

  return {
    data: localData,
    dirty: true,
    source: 'local-dirty',
    staleLocal: false,
  }
}
