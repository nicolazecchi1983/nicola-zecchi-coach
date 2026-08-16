import { createMatchAnalysisSchema, createMatchAnalysisSchemaFromLegacy } from './matchAnalysisSchema.js'

export const MATCH_OPPONENT_STUDY_SCHEMA_VERSION = 2

export const MATCH_OPPONENT_STUDY_CATEGORIES = Object.freeze([
  'general',
  'possession',
  'non-possession',
  'transitions',
  'set-pieces',
])

function safeText(value) {
  return String(value ?? '').trim()
}

function safeUrl(value) {
  const raw = safeText(value)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.toString()
  } catch {
    return ''
  }
}

function normalizeCategory(value) {
  return MATCH_OPPONENT_STUDY_CATEGORIES.includes(value) ? value : 'general'
}

function normalizeAsset(asset = {}) {
  return {
    id: safeText(asset.id),
    kind: ['report', 'video', 'document'].includes(asset.kind) ? asset.kind : 'document',
    category: normalizeCategory(asset.category),
    label: safeText(asset.label || asset.fileName || 'Documento'),
    fileName: safeText(asset.fileName),
    path: safeText(asset.path),
    bucket: safeText(asset.bucket),
    mimeType: safeText(asset.mimeType),
    size: Number.isFinite(Number(asset.size)) ? Number(asset.size) : 0,
    createdAt: asset.createdAt || new Date().toISOString(),
  }
}

function normalizeLink(link = {}) {
  return {
    id: safeText(link.id),
    label: safeText(link.label || 'Link esterno'),
    url: safeUrl(link.url),
    category: normalizeCategory(link.category),
    createdAt: link.createdAt || new Date().toISOString(),
  }
}

export function normalizeMatchOpponentStudy(input = {}) {
  return {
    matchId: safeText(input.matchId),
    notes: {
      general: safeText(input.notes?.general),
      possession: safeText(input.notes?.possession),
      nonPossession: safeText(input.notes?.nonPossession),
      transitions: safeText(input.notes?.transitions),
      setPieces: safeText(input.notes?.setPieces),
    },
    technicalAnalysis: createMatchAnalysisSchema(
      input.technicalAnalysis != null
        ? input.technicalAnalysis
        : createMatchAnalysisSchemaFromLegacy({
            possession: input.notes?.possession,
            nonPossession: input.notes?.nonPossession,
            transitions: input.notes?.transitions,
            setPieces: input.notes?.setPieces,
          }),
    ),
    primaryReport: input.primaryReport?.path ? normalizeAsset({ ...input.primaryReport, kind: 'report' }) : null,
    assets: Array.isArray(input.assets) ? input.assets.map(normalizeAsset).filter((item) => item.path) : [],
    links: Array.isArray(input.links) ? input.links.map(normalizeLink).filter((item) => item.url) : [],
    updatedAt: input.updatedAt || null,
    _schemaVersion: MATCH_OPPONENT_STUDY_SCHEMA_VERSION,
  }
}

export function createMatchOpponentStudy(matchId) {
  return normalizeMatchOpponentStudy({ matchId })
}

export function validateExternalStudyLink(input = {}) {
  const url = safeUrl(input.url)
  const errors = []
  if (!url) errors.push('Inserisci un link http o https valido.')
  return {
    valid: errors.length === 0,
    errors,
    value: {
      label: safeText(input.label || 'Link esterno'),
      url,
      category: normalizeCategory(input.category),
    },
  }
}

export function categoryLabel(category) {
  return ({
    general: 'Generale',
    possession: 'Possesso',
    'non-possession': 'Non possesso',
    transitions: 'Transizioni',
    'set-pieces': 'Palle inattive',
  })[normalizeCategory(category)]
}

export function readMatchOpponentStudyFromEventNotes(rawNotes, matchId = '') {
  let parsed = {}
  try {
    parsed = typeof rawNotes === 'string' ? JSON.parse(rawNotes || '{}') : (rawNotes || {})
  } catch {
    parsed = {}
  }
  return normalizeMatchOpponentStudy({ ...(parsed?.opponent_study || {}), matchId })
}

export function mergeMatchOpponentStudyIntoEventNotes(rawNotes, study) {
  let parsed = {}
  try {
    parsed = typeof rawNotes === 'string' ? JSON.parse(rawNotes || '{}') : (rawNotes || {})
  } catch {
    parsed = {}
  }
  return JSON.stringify({
    ...parsed,
    type: parsed?.type || 'match_event',
    schema_version: Math.max(Number(parsed?.schema_version) || 1, 1),
    opponent_study: normalizeMatchOpponentStudy(study),
  })
}
