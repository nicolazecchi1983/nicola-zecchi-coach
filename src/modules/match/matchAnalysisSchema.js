export const MATCH_ANALYSIS_SCHEMA_VERSION = 3

export const MATCH_ANALYSIS_PHASES = Object.freeze([
  { key: 'possession', title: 'Fase di possesso' },
  { key: 'non-possession', title: 'Fase di non possesso' },
  { key: 'transitions', title: 'Transizioni' },
  { key: 'set-pieces', title: 'Palle inattive' },
])

export const MATCH_ANALYSIS_SET_PIECE_DIRECTIONS = Object.freeze([
  { key: 'for', title: 'A favore' },
  { key: 'against', title: 'Contro' },
])

export const MATCH_ANALYSIS_SET_PIECE_SITUATIONS = Object.freeze([
  "Calci d'angolo",
  'Punizioni laterali',
  'Punizioni centrali',
  'Rigori',
  'Rimesse laterali',
  "Calcio d'inizio",
])

export const MATCH_ANALYSIS_SUGGESTIONS = Object.freeze({
  possession: [
    'Costruzione da rimessa del portiere',
    'Costruzione bassa',
    'Costruzione alta',
    'Sviluppo',
    'Rifinitura',
    'Finalizzazione',
  ],
  'non-possession': [
    'Prima pressione',
    'Blocco medio',
    'Blocco basso',
    'Difesa area di rigore',
    'Difesa uomo a uomo',
  ],
  transitions: [
    'Transizione positiva',
    'Transizione negativa',
    'Riaggressione',
    'Attacco spazio',
  ],
  'set-pieces': MATCH_ANALYSIS_SET_PIECE_SITUATIONS,
})

function safeText(value) {
  return String(value ?? '').trim()
}

function safeId(value, fallback = '') {
  const raw = safeText(value || fallback)
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase('it-IT') || fallback
}

function normalizeSetPieceDirection(value) {
  const direction = safeText(value)
  return MATCH_ANALYSIS_SET_PIECE_DIRECTIONS.some((item) => item.key === direction) ? direction : ''
}

function defaultSubsections(phaseKey) {
  if (phaseKey === 'set-pieces') {
    return MATCH_ANALYSIS_SET_PIECE_DIRECTIONS.flatMap((direction) => (
      MATCH_ANALYSIS_SET_PIECE_SITUATIONS.map((title, index) => ({
        id: `set-pieces-${direction.key}-${index + 1}`,
        title,
        note: '',
        direction: direction.key,
      }))
    ))
  }

  return (MATCH_ANALYSIS_SUGGESTIONS[phaseKey] || []).map((title, index) => ({
    id: `${phaseKey}-${index + 1}`,
    title,
    note: '',
  }))
}

function normalizeSubsection(input = {}, phaseKey = '', index = 0) {
  const normalized = {
    id: safeId(input.id, `${phaseKey}-${index + 1}`),
    title: safeText(input.title || 'Nuova sottofase'),
    note: safeText(input.note),
  }

  if (phaseKey === 'set-pieces') {
    const direction = normalizeSetPieceDirection(input.direction)
    if (direction) normalized.direction = direction
  }

  return normalized
}

function normalizePhase(input = {}, definition = {}, index = 0, { useDefaults = false } = {}) {
  const fallbackKey = definition.key || `custom-phase-${index + 1}`
  const key = safeId(input.key, fallbackKey)
  const sourceSubsections = Array.isArray(input.subsections)
    ? input.subsections
    : (useDefaults ? defaultSubsections(fallbackKey) : [])
  return {
    key,
    title: safeText(input.title || definition.title || 'Nuova macroarea'),
    note: safeText(input.note),
    subsections: sourceSubsections.map((item, subIndex) => normalizeSubsection(item, key, subIndex)),
  }
}

export function createStaffAnalysisTemplateSchema() {
  return {
    version: MATCH_ANALYSIS_SCHEMA_VERSION,
    phases: MATCH_ANALYSIS_PHASES.map((definition, index) => normalizePhase(
      { ...definition, subsections: defaultSubsections(definition.key) },
      definition,
      index,
    )),
  }
}

function legacySetPieceDefaultsAreEmptyAndCanonical(phase = {}) {
  const subsections = Array.isArray(phase.subsections) ? phase.subsections : []
  if (subsections.length !== MATCH_ANALYSIS_SET_PIECE_SITUATIONS.length) return false

  return subsections.every((item, index) => (
    safeId(item.id) === `set-pieces-${index + 1}`
    && safeText(item.title) === MATCH_ANALYSIS_SET_PIECE_SITUATIONS[index]
    && !safeText(item.note)
    && !normalizeSetPieceDirection(item.direction)
  ))
}

function migrateV2Schema(parsed = {}) {
  const phases = Array.isArray(parsed?.phases) ? parsed.phases : []
  return {
    version: MATCH_ANALYSIS_SCHEMA_VERSION,
    phases: phases.map((phase, index) => {
      const key = safeId(phase?.key, `custom-phase-${index + 1}`)
      if (key !== 'set-pieces') return normalizePhase(phase, {}, index)

      const subsections = legacySetPieceDefaultsAreEmptyAndCanonical(phase)
        ? defaultSubsections('set-pieces')
        : (Array.isArray(phase?.subsections) ? phase.subsections : [])

      return normalizePhase({ ...phase, key, subsections }, {}, index)
    }),
  }
}

function migrateLegacySchema(parsed = {}) {
  const phaseMap = new Map((Array.isArray(parsed?.phases) ? parsed.phases : []).map((phase) => [phase.key, phase]))
  return {
    version: MATCH_ANALYSIS_SCHEMA_VERSION,
    phases: MATCH_ANALYSIS_PHASES.map((definition, index) => {
      const legacy = phaseMap.get(definition.key)
      return normalizePhase(
        legacy
          ? {
              ...legacy,
              subsections: Array.isArray(legacy.subsections) && legacy.subsections.length
                ? legacy.subsections
                : defaultSubsections(definition.key),
            }
          : { ...definition, subsections: defaultSubsections(definition.key) },
        definition,
        index,
      )
    }),
  }
}

export function createMatchAnalysisSchema(input = {}) {
  let parsed = input
  if (typeof input === 'string') {
    try { parsed = JSON.parse(input || '{}') } catch { parsed = {} }
  }

  const hasExplicitPhases = Array.isArray(parsed?.phases)
  const phases = hasExplicitPhases ? parsed.phases : []
  const version = Number(parsed?.version || 1)

  if (hasExplicitPhases && version >= MATCH_ANALYSIS_SCHEMA_VERSION) {
    return {
      version: MATCH_ANALYSIS_SCHEMA_VERSION,
      phases: phases.map((phase, index) => normalizePhase(phase, {}, index)),
    }
  }

  if (hasExplicitPhases && version === 2) return migrateV2Schema(parsed)
  if (hasExplicitPhases && version < 2) return migrateLegacySchema(parsed)

  return createStaffAnalysisTemplateSchema()
}

export function createMatchAnalysisSchemaFromLegacy({
  possession = '',
  nonPossession = '',
  transitions = '',
  setPieces = '',
} = {}) {
  const schema = createStaffAnalysisTemplateSchema()
  const notes = {
    possession,
    'non-possession': nonPossession,
    transitions,
    'set-pieces': setPieces,
  }
  schema.phases.forEach((phase) => { phase.note = safeText(notes[phase.key]) })
  return schema
}

export function parseMatchAnalysisSchema(value, legacy = {}) {
  let raw = value
  if (typeof value === 'string') {
    try { raw = JSON.parse(value || '{}') } catch { raw = {} }
  }

  const hasExplicitPhases = Array.isArray(raw?.phases)
  const hasLegacy = Object.values(legacy || {}).some((item) => safeText(item))

  if (hasExplicitPhases) return createMatchAnalysisSchema(raw)
  if (hasLegacy) return createMatchAnalysisSchemaFromLegacy(legacy)
  return createStaffAnalysisTemplateSchema()
}

export function serializeMatchAnalysisSchema(schema) {
  return JSON.stringify(createMatchAnalysisSchema(schema))
}

export function analysisSchemaHasNotes(schema) {
  return createMatchAnalysisSchema(schema).phases.some((phase) => (
    Boolean(phase.note) || phase.subsections.some((item) => Boolean(item.note))
  ))
}

export function createAnalysisTemplateDefinition(schema) {
  const normalized = createMatchAnalysisSchema(schema)
  return {
    version: MATCH_ANALYSIS_SCHEMA_VERSION,
    phases: normalized.phases.map((phase) => ({
      key: phase.key,
      title: phase.title,
      note: '',
      subsections: phase.subsections.map((item) => ({
        id: item.id,
        title: item.title,
        note: '',
        ...(item.direction ? { direction: item.direction } : {}),
      })),
    })),
  }
}

export function matchAnalysisSchemaEntries(schema) {
  return createMatchAnalysisSchema(schema).phases.map((phase) => ({
    ...phase,
    entries: [
      ...(phase.note ? [{ id: `${phase.key}-general`, title: 'Nota generale', note: phase.note }] : []),
      ...phase.subsections.filter((item) => item.note),
    ],
  }))
}
