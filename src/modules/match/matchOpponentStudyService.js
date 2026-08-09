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
  MATCH_STUDY_BUCKET,
} from './matchOpponentStudyRepository.js'

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
  const teamKey = String(team?.id || toSlugKey(team?.shortName || team?.name || 'team') || 'team')
  const seasonKey = toSlugKey(team?.season || 'season') || 'season'
  return `match-study/${teamKey}/${seasonKey}/${String(matchId)}/${randomId('asset')}-${safeFileName(file.name)}`
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
}

export function createMatchOpponentStudyService({ getEvent, updateEvent, reloadEvents } = {}) {
  if (typeof getEvent !== 'function' || typeof updateEvent !== 'function') {
    throw new Error('Studio avversario non configurato: accesso evento mancante.')
  }
  const assets = createMatchOpponentStudyAssetRepository()

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
    saveNotes(matchId, notes) {
      return mutate(matchId, (current) => ({
        ...current,
        notes: { ...current.notes, ...notes },
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
      const path = buildAssetPath({ team, matchId, file })
      await assets.upload(path, file)
      const asset = {
        id: randomId('asset'), kind, category,
        label: String(label || file.name).trim(), fileName: file.name,
        path, bucket: MATCH_STUDY_BUCKET, mimeType: file.type || 'application/octet-stream',
        size: file.size, createdAt: new Date().toISOString(),
      }
      let previousPath = null
      try {
        const saved = await mutate(matchId, (current) => {
          if (kind === 'report') {
            previousPath = current.primaryReport?.path || null
            return { ...current, primaryReport: asset, updatedAt: new Date().toISOString() }
          }
          return { ...current, assets: [...current.assets, asset], updatedAt: new Date().toISOString() }
        })
        if (previousPath && previousPath !== path) {
          assets.remove(previousPath).catch((error) => console.warn('Vecchio report non rimosso:', error))
        }
        return saved
      } catch (error) {
        await assets.remove(path).catch(() => {})
        throw error
      }
    },
    async removeAsset(matchId, assetId, { primary = false } = {}) {
      let removedPath = null
      const saved = await mutate(matchId, (current) => {
        const target = primary ? current.primaryReport : current.assets.find((item) => item.id === assetId)
        removedPath = target?.path || null
        return primary
          ? { ...current, primaryReport: null, updatedAt: new Date().toISOString() }
          : { ...current, assets: current.assets.filter((item) => item.id !== assetId), updatedAt: new Date().toISOString() }
      })
      if (removedPath) {
        assets.remove(removedPath).catch((error) => console.warn('File Match orfano non rimosso:', error))
      }
      return saved
    },
    async getAssetUrl(path) {
      if (!path) return null
      return assets.signedUrl(path)
    },
  }
}
