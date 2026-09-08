import { AppError } from '../../core/appError.js'
import { toSlugKey } from '../../shared/text/textNormalization.js'
import {
  createMatchOpponentStudy,
  mergeMatchOpponentStudyIntoEventNotes,
  readMatchOpponentStudyFromEventNotes,
  validateExternalStudyLink,
} from './matchOpponentStudyModel.js'
import {
  createMatchOpponentStudyAssetRepository,
  MATCH_STUDY_DOCUMENT_BUCKET,
  MATCH_STUDY_LEGACY_BUCKET,
  resolveMatchStudyBucket,
} from './matchOpponentStudyRepository.js'
import {
  createMatchOpponentStudyRecoveryStore,
  reconcileInterruptedMatchOpponentStudy,
} from './matchOpponentStudyRecovery.js'

const MAX_REPORT_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 250 * 1024 * 1024

function randomId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function safeFileName(name) {
  const clean = String(name || 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return clean || 'file'
}

function buildAssetPath({ team, matchId, file }) {
  const teamId = String(team?.id || '').trim()
  if (!teamId) {
    throw new AppError('Identità squadra mancante per il caricamento Match.', {
      code: 'MATCH_STUDY_TEAM_REQUIRED',
      stage: 'validation',
      userMessage: 'Impossibile caricare il file: squadra non configurata.',
    })
  }
  const seasonKey = toSlugKey(team?.season || 'season') || 'season'
  return `${teamId}/${seasonKey}/match-study/${String(matchId)}/${randomId('asset')}-${safeFileName(file.name)}`
}

function validateFile(file, kind) {
  if (!(file instanceof File) || !file.size) {
    throw new AppError('File non valido.', {
      code: 'MATCH_STUDY_FILE_INVALID',
      stage: 'validation',
      userMessage: 'Seleziona un file valido.',
    })
  }
  const limit = kind === 'video' ? MAX_VIDEO_BYTES : MAX_REPORT_BYTES
  if (file.size > limit) {
    const limitMb = Math.round(limit / 1024 / 1024)
    throw new AppError(`File oltre il limite di ${limitMb} MB.`, {
      code: 'MATCH_STUDY_FILE_TOO_LARGE',
      stage: 'validation',
      userMessage: `Il file supera ${limitMb} MB. Per video più grandi usa un link esterno.`,
    })
  }

  const mimeType = String(file.type || '').toLowerCase()
  const validVideo = mimeType.startsWith('video/')
  const validDocument = mimeType.startsWith('application/')
    || mimeType.startsWith('image/')
    || mimeType.startsWith('text/')

  if (kind === 'video' && !validVideo) {
    throw new AppError('Formato video non valido.', {
      code: 'MATCH_STUDY_VIDEO_FILE_TYPE',
      stage: 'validation',
      userMessage: 'Per un materiale Video seleziona un file video.',
    })
  }
  if (kind !== 'video' && !validDocument) {
    throw new AppError('Formato documento non valido.', {
      code: 'MATCH_STUDY_DOCUMENT_FILE_TYPE',
      stage: 'validation',
      userMessage: 'Per un documento usa PDF, immagini, file Office o file di testo.',
    })
  }
}

function validateOpponentLineupFile(file) {
  validateFile(file, 'document')
  if (!String(file.type || '').startsWith('image/')) {
    throw new AppError('Formato distinta avversaria non valido.', {
      code: 'MATCH_OPPONENT_LINEUP_FILE_TYPE',
      stage: 'validation',
      userMessage: 'Carica una foto o immagine della distinta avversaria.',
    })
  }
}

export function createMatchOpponentStudyService({ getEvent, updateEvent, reloadEvents, recoveryStorage = globalThis.localStorage } = {}) {
  if (typeof getEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Studio avversario non configurato: accesso evento mancante.')
  }
  const assets = createMatchOpponentStudyAssetRepository()
  const recoveryStore = createMatchOpponentStudyRecoveryStore(recoveryStorage, {
    defaultBucket: MATCH_STUDY_LEGACY_BUCKET,
  })
  const recoveryFlights = new Map()

  const beginRecovery = (matchId, paths) => {
    try {
      return recoveryStore.begin({ matchId, locations: paths })
    } catch (error) {
      throw new AppError('Recovery journal Match non disponibile.', {
        code: 'MATCH_STUDY_RECOVERY_UNAVAILABLE',
        stage: 'recovery',
        cause: error,
        userMessage: 'STAFF non può garantire il cleanup sicuro dei file Match. Ricarica la pagina e riprova.',
      })
    }
  }

  const trackRecovery = (matchId, paths) => {
    try {
      return recoveryStore.track(matchId, paths)
    } catch (error) {
      throw new AppError('Recovery journal Match non aggiornabile.', {
        code: 'MATCH_STUDY_RECOVERY_UNAVAILABLE',
        stage: 'recovery',
        cause: error,
        userMessage: 'STAFF non può garantire il cleanup sicuro dei file Match. Ricarica la pagina e riprova.',
      })
    }
  }

  const removeRecoveryPath = async (path, bucket = MATCH_STUDY_LEGACY_BUCKET) => {
    await assets.remove(bucket || MATCH_STUDY_LEGACY_BUCKET, path)
    return true
  }

  const runStorageRecovery = async (matchId) => {
    const pending = recoveryStore.read(matchId)
    if (!pending?.paths?.length) return { status: 'none', cleaned: [], preserved: [], pending: [] }
    const event = await getEvent(matchId)
    if (!event?.id) throw new AppError('Partita non trovata nel Calendario.', {
      code: 'MATCH_STUDY_EVENT_NOT_FOUND',
      stage: 'read',
      userMessage: 'La partita non è più disponibile. Torna alla Match Library e riaprila.',
    })
    const study = load(event, matchId)
    return reconcileInterruptedMatchOpponentStudy({
      recoveryStore,
      matchId,
      study,
      removeAsset: removeRecoveryPath,
      defaultBucket: MATCH_STUDY_LEGACY_BUCKET,
    })
  }

  const reconcileStorageRecovery = (matchId) => {
    const id = String(matchId || '').trim()
    if (!id) return Promise.resolve({ status: 'none', cleaned: [], preserved: [], pending: [] })
    if (recoveryFlights.has(id)) return recoveryFlights.get(id)
    const flight = runStorageRecovery(id)
      .finally(() => recoveryFlights.delete(id))
    recoveryFlights.set(id, flight)
    return flight
  }

  const settleStorageRecoveryAfterCommit = async (matchId, label) => {
    try {
      return await reconcileStorageRecovery(matchId)
    } catch (error) {
      console.warn(label, error)
      return {
        status: 'cleanup-pending',
        cleaned: [],
        preserved: [],
        pending: recoveryStore.read(matchId)?.paths || [],
      }
    }
  }

  const load = (eventOrNotes, matchId = '') => {
    if (!eventOrNotes && !matchId) return createMatchOpponentStudy('')
    const rawNotes = typeof eventOrNotes === 'object' && eventOrNotes !== null
      ? (eventOrNotes.rawNotes ?? eventOrNotes.notes ?? '')
      : eventOrNotes
    const resolvedMatchId = matchId || (typeof eventOrNotes === 'object' ? eventOrNotes?.id : '')
    return readMatchOpponentStudyFromEventNotes(rawNotes, resolvedMatchId)
  }

  async function mutate(matchId, mutator) {
    const event = await getEvent(matchId)
    if (!event?.id) throw new AppError('Partita non trovata nel Calendario.', {
      code: 'MATCH_STUDY_EVENT_NOT_FOUND',
      stage: 'read',
      userMessage: 'La partita non è più disponibile. Torna alla Match Library e riaprila.',
    })
    const current = readMatchOpponentStudyFromEventNotes(event.notes, matchId)
    const next = await mutator(current, event)
    await updateEvent(event.id, {
      notes: mergeMatchOpponentStudyIntoEventNotes(event.notes, next),
    })
    if (typeof reloadEvents === 'function') await reloadEvents()
    return next
  }

  return {
    load,
    reconcileStorageRecovery,
    saveNotes(matchId, notes) {
      return mutate(matchId, (current) => ({
        ...current,
        notes: { ...current.notes, ...notes },
        updatedAt: new Date().toISOString(),
      }))
    },
    saveTechnicalAnalysis(matchId, technicalAnalysis) {
      return mutate(matchId, (current) => ({
        ...current,
        technicalAnalysis,
        updatedAt: new Date().toISOString(),
      }))
    },
    addLink(matchId, input) {
      const inspected = validateExternalStudyLink(input)
      if (!inspected.valid) {
        throw new AppError(inspected.errors.join(' '), {
          code: 'MATCH_STUDY_LINK_INVALID',
          stage: 'validation',
          userMessage: inspected.errors[0],
        })
      }
      return mutate(matchId, (current) => ({
        ...current,
        links: [...current.links, {
          id: randomId('link'),
          ...inspected.value,
          createdAt: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      }))
    },
    removeLink(matchId, linkId) {
      return mutate(matchId, (current) => ({
        ...current,
        links: current.links.filter((item) => item.id !== linkId),
        updatedAt: new Date().toISOString(),
      }))
    },
    async uploadAsset({ matchId, team, file, kind = 'document', category = 'general', label = '' }) {
      validateFile(file, kind)
      await reconcileStorageRecovery(matchId)
      const path = buildAssetPath({ team, matchId, file })
      const bucket = resolveMatchStudyBucket(kind)
      beginRecovery(matchId, [{ bucket, path }])
      try {
        await assets.upload(bucket, path, file)
        const asset = {
          id: randomId('asset'), kind, category,
          label: String(label || file.name).trim(), fileName: file.name,
          path, bucket, mimeType: file.type || 'application/octet-stream',
          size: file.size, createdAt: new Date().toISOString(),
        }
        let previousPath = null
        let previousBucket = MATCH_STUDY_LEGACY_BUCKET
        const saved = await mutate(matchId, (current) => {
          if (kind === 'report') {
            previousPath = current.primaryReport?.path || null
            previousBucket = current.primaryReport?.bucket || MATCH_STUDY_LEGACY_BUCKET
            if (previousPath && previousPath !== path) {
              trackRecovery(matchId, [{ bucket: previousBucket, path: previousPath }])
            }
            return { ...current, primaryReport: asset, updatedAt: new Date().toISOString() }
          }
          return { ...current, assets: [...current.assets, asset], updatedAt: new Date().toISOString() }
        })
        await settleStorageRecoveryAfterCommit(matchId, 'Pulizia storage Match rimasta pendente:')
        return saved
      } catch (error) {
        await reconcileStorageRecovery(matchId)
          .catch((recoveryError) => console.warn('Recovery Match asset in attesa:', recoveryError))
        throw error
      }
    },
    async uploadOpponentLineup({ matchId, team, file }) {
      validateOpponentLineupFile(file)
      await reconcileStorageRecovery(matchId)
      const path = buildAssetPath({ team, matchId, file })
      const bucket = MATCH_STUDY_DOCUMENT_BUCKET
      beginRecovery(matchId, [{ bucket, path }])
      try {
        await assets.upload(bucket, path, file)
        const asset = {
          id: randomId('asset'),
          kind: 'document',
          category: 'general',
          label: 'Distinta avversaria',
          fileName: file.name,
          path,
          bucket,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          createdAt: new Date().toISOString(),
        }
        let previousPath = null
        let previousBucket = MATCH_STUDY_LEGACY_BUCKET
        const saved = await mutate(matchId, (current) => {
          previousPath = current.opponentLineup?.path || null
          previousBucket = current.opponentLineup?.bucket || MATCH_STUDY_LEGACY_BUCKET
          if (previousPath && previousPath !== path) {
            trackRecovery(matchId, [{ bucket: previousBucket, path: previousPath }])
          }
          return { ...current, opponentLineup: asset, updatedAt: new Date().toISOString() }
        })
        await settleStorageRecoveryAfterCommit(matchId, 'Pulizia storage distinta rimasta pendente:')
        return saved
      } catch (error) {
        await reconcileStorageRecovery(matchId)
          .catch((recoveryError) => console.warn('Recovery distinta avversaria in attesa:', recoveryError))
        throw error
      }
    },
    async removeOpponentLineup(matchId) {
      await reconcileStorageRecovery(matchId)
      let removedPath = null
      let removedBucket = MATCH_STUDY_LEGACY_BUCKET
      try {
        const saved = await mutate(matchId, (current) => {
          removedPath = current.opponentLineup?.path || null
          removedBucket = current.opponentLineup?.bucket || MATCH_STUDY_LEGACY_BUCKET
          if (removedPath) beginRecovery(matchId, [{ bucket: removedBucket, path: removedPath }])
          return { ...current, opponentLineup: null, updatedAt: new Date().toISOString() }
        })
        await settleStorageRecoveryAfterCommit(matchId, 'Pulizia storage rimozione distinta rimasta pendente:')
        return saved
      } catch (error) {
        await reconcileStorageRecovery(matchId)
          .catch((recoveryError) => console.warn('Recovery rimozione distinta in attesa:', recoveryError))
        throw error
      }
    },
    async removeAsset(matchId, assetId, { primary = false } = {}) {
      await reconcileStorageRecovery(matchId)
      let removedPath = null
      let removedBucket = MATCH_STUDY_LEGACY_BUCKET
      try {
        const saved = await mutate(matchId, (current) => {
          const target = primary ? current.primaryReport : current.assets.find((item) => item.id === assetId)
          removedPath = target?.path || null
          removedBucket = target?.bucket || MATCH_STUDY_LEGACY_BUCKET
          if (removedPath) beginRecovery(matchId, [{ bucket: removedBucket, path: removedPath }])
          return primary
            ? { ...current, primaryReport: null, updatedAt: new Date().toISOString() }
            : { ...current, assets: current.assets.filter((item) => item.id !== assetId), updatedAt: new Date().toISOString() }
        })
        await settleStorageRecoveryAfterCommit(matchId, 'Pulizia storage rimozione asset rimasta pendente:')
        return saved
      } catch (error) {
        await reconcileStorageRecovery(matchId)
          .catch((recoveryError) => console.warn('Recovery rimozione asset Match in attesa:', recoveryError))
        throw error
      }
    },
    async getAssetUrl(path, bucket = MATCH_STUDY_LEGACY_BUCKET) {
      if (!path) return null
      return assets.signedUrl(bucket || MATCH_STUDY_LEGACY_BUCKET, path)
    },
  }
}
