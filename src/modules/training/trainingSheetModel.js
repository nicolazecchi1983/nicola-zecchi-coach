/** @typedef {'draft'|'published'} TrainingSheetStatus */
/** @typedef {Record<string, any>} TrainingSheetInput */
/** @typedef {{code:string, field:string, message:string}} ValidationIssue */

export const TRAINING_SHEET_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
})

const TRAINING_SHEET_STATUSES = new Set(Object.values(TRAINING_SHEET_STATUS))

/** @type {Readonly<Record<TrainingSheetStatus, Set<TrainingSheetStatus>>>} */
const STATUS_TRANSITIONS = Object.freeze({
  [TRAINING_SHEET_STATUS.DRAFT]: new Set([TRAINING_SHEET_STATUS.PUBLISHED]),
  [TRAINING_SHEET_STATUS.PUBLISHED]: new Set(),
})

/** @param {unknown} value @returns {string|null} */
function normalizeTimestamp(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(/** @type {string|number} */ (value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** @param {unknown} value @returns {TrainingSheetStatus} */
function normalizeStatus(value) {
  const status = String(value || '').toLowerCase()
  // Compatibilità con le release B1 iniziali: "archived" non è più uno stato
  // operativo. Le vecchie schede archiviate tornano ad essere normali TS pubblicate.
  if (status === 'archived') return TRAINING_SHEET_STATUS.PUBLISHED
  const typedStatus = /** @type {TrainingSheetStatus} */ (status)
  return TRAINING_SHEET_STATUSES.has(typedStatus) ? typedStatus : TRAINING_SHEET_STATUS.DRAFT
}

/** @param {string} code @param {string} field @param {string} message @returns {Readonly<ValidationIssue>} */
function createValidationIssue(code, field, message) {
  return Object.freeze({ code, field, message })
}

/** @param {TrainingSheetInput} [input] @returns {TrainingSheetInput & {status: TrainingSheetStatus}} */
export function normalizeTrainingSheetData(input = {}) {
  const progressive = Math.max(1, Number(input.progressive || 1))
  const status = normalizeStatus(input.status)

  return {
    ...input,
    progressive,
    date: String(input.date || ''),
    time: String(input.time || ''),
    location: String(input.location || '').trim(),
    present: Math.max(0, Number(input.present || 0)),
    phases: Array.isArray(input.phases) ? input.phases : [],
    pillars: Array.isArray(input.pillars) ? input.pillars : [],
    status,
    created_at: normalizeTimestamp(input.created_at || input.createdAt),
    updated_at: normalizeTimestamp(input.updated_at || input.updatedAt),
    published_at: status === TRAINING_SHEET_STATUS.DRAFT
      ? null
      : normalizeTimestamp(input.published_at || input.publishedAt),
    // Metadata legacy conservato soltanto per non perdere informazione storica.
    // Non governa più lifecycle o permessi.
    archived_at: normalizeTimestamp(input.archived_at || input.archivedAt),
  }
}

/** @param {TrainingSheetInput} input */
export function inspectTrainingSheetForPublish(input) {
  const data = normalizeTrainingSheetData(input)
  const errors = []
  const warnings = []

  if (!data.date) errors.push(createValidationIssue('TRAINING_DATE_REQUIRED', 'date', 'Inserisci la data.'))
  if (!data.time) errors.push(createValidationIssue('TRAINING_TIME_REQUIRED', 'time', 'Inserisci l’orario.'))
  if (!data.location) errors.push(createValidationIssue('TRAINING_LOCATION_REQUIRED', 'location', 'Inserisci il campo.'))

  if (!String(data.objective || '').trim()) {
    warnings.push(createValidationIssue('TRAINING_OBJECTIVE_MISSING', 'objective', 'Obiettivo non ancora definito.'))
  }
  if (!data.phases.length) {
    warnings.push(createValidationIssue('TRAINING_PHASES_MISSING', 'phases', 'Nessuna fase di allenamento inserita.'))
  }
  if (!data.present) {
    warnings.push(createValidationIssue('TRAINING_PRESENT_MISSING', 'present', 'Numero dei presenti non ancora indicato.'))
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  })
}

// Compatibilità con il flusso esistente: il service continua a ricevere un errore
// quando mancano i dati minimi, mentre la UI futura potrà usare il risultato strutturato.
/** @param {TrainingSheetInput} data */
export function validateTrainingSheetForPublish(data) {
  const result = inspectTrainingSheetForPublish(data)
  if (!result.valid) {
    const fields = result.errors.map((issue) => issue.field)
    /** @type {Record<string, string>} */
    const labels = {
      date: 'data',
      time: 'orario',
      location: 'campo',
    }
    throw new Error(`Completa ${fields.map((field) => labels[field] || field).join(', ')} prima di creare il PDF.`)
  }
  return result
}

/** @param {unknown} currentStatus @param {unknown} nextStatus @returns {boolean} */
export function canTransitionTrainingSheetStatus(currentStatus, nextStatus) {
  const current = normalizeStatus(currentStatus)
  const next = normalizeStatus(nextStatus)
  return STATUS_TRANSITIONS[current]?.has(next) === true
}

/** @param {TrainingSheetInput} input @param {unknown} nextStatus @param {Date} [now] */
export function transitionTrainingSheetStatus(input, nextStatus, now = new Date()) {
  const data = normalizeTrainingSheetData(input)
  const next = normalizeStatus(nextStatus)

  if (!canTransitionTrainingSheetStatus(data.status, next)) {
    throw new Error(`Transizione Training Sheet non consentita: ${data.status} → ${next}.`)
  }

  const timestamp = normalizeTimestamp(now)
  if (!timestamp) throw new Error('Data della transizione Training Sheet non valida.')

  return normalizeTrainingSheetData({
    ...data,
    status: next,
    created_at: data.created_at || timestamp,
    updated_at: timestamp,
    published_at: next === TRAINING_SHEET_STATUS.PUBLISHED
      ? (data.published_at || timestamp)
      : data.published_at,
    archived_at: data.archived_at,
  })
}


/** @param {TrainingSheetInput} input @param {Date} [now] */
export function publishTrainingSheetData(input, now = new Date()) {
  const data = normalizeTrainingSheetData(input)
  if (data.status === TRAINING_SHEET_STATUS.DRAFT) {
    return transitionTrainingSheetStatus(data, TRAINING_SHEET_STATUS.PUBLISHED, now)
  }

  const timestamp = normalizeTimestamp(now)
  if (!timestamp) throw new Error('Data di pubblicazione Training Sheet non valida.')
  return normalizeTrainingSheetData({
    ...data,
    created_at: data.created_at || timestamp,
    updated_at: timestamp,
    published_at: data.published_at || timestamp,
  })
}

/** @param {TrainingSheetInput} data @returns {string} */
export function buildTrainingSheetFileName(data) {
  const progressive = String(Number(data.progressive || 1)).padStart(3, '0')
  const [year = '', month = '', day = ''] = String(data.date || '').split('-')
  return `ALL_${progressive} - ${day}${month}${year}.pdf`
}

/** @param {unknown} value @param {string} [fallback] @returns {string} */
export function sanitizePathSegment(value, fallback = 'unknown') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

/** @param {{teamId?: string|null, teamName?: string|null, season?: string|null, date?: string|null, fileName: string}} input */
export function buildTrainingSheetStoragePath({ teamId, teamName, season, date, fileName }) {
  // Il profilo locale può essere disponibile prima che Supabase restituisca l'id squadra.
  // Il percorso deve quindi restare pubblicabile anche in quella fase, come accadeva
  // nel flusso storico basato su data + identificativo univoco.
  const teamSegment = teamId
    ? sanitizePathSegment(teamId, 'team')
    : sanitizePathSegment(teamName, 'team')
  const version = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`

  return [
    teamSegment,
    sanitizePathSegment(season, 'stagione'),
    sanitizePathSegment(date, 'senza-data'),
    `${version}-${fileName}`,
  ].join('/')
}

/** @param {{data: TrainingSheetInput, filePath: string, squadTotal: number}} input */
export function buildTrainingSheetEventPayload({ data, filePath, squadTotal }) {
  return {
    title: 'Allenamento',
    event_type: 'training',
    start_at: new Date(`${data.date}T${data.time}:00`).toISOString(),
    location: data.location || null,
    match_day: data.match_day || null,
    present_count: Number(data.present) || 0,
    squad_total: Number(squadTotal) || 0,
    training_sheet_path: filePath,
    notes: JSON.stringify({
      type: 'training_sheet_editor',
      version: 2,
      data,
    }),
  }
}
