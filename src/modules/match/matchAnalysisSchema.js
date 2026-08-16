export const MATCH_ANALYSIS_SCHEMA_VERSION = 2

export const MATCH_ANALYSIS_PHASES = Object.freeze([
  { key: 'possession', title: 'Fase di possesso' },
  { key: 'non-possession', title: 'Fase di non possesso' },
  { key: 'transitions', title: 'Transizioni' },
  { key: 'set-pieces', title: 'Palle inattive' },
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
  'set-pieces': [
    "Calci d'angolo",
    'Punizioni laterali',
    'Punizioni centrali',
    'Rigori',
    'Rimesse laterali',
    "Calcio d'inizio",
  ],
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

function defaultSubsections(phaseKey) {
  return (MATCH_ANALYSIS_SUGGESTIONS[phaseKey] || []).map((title, index) => ({
    id: `${phaseKey}-${index + 1}`,
    title,
    note: '',
  }))
}

function normalizeSubsection(input = {}, phaseKey = '', index = 0) {
  return {
    id: safeId(input.id, `${phaseKey}-${index + 1}`),
    title: safeText(input.title || 'Nuova sottofase'),
    note: safeText(input.note),
  }
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

  if (hasExplicitPhases && Number(parsed?.version || 1) >= MATCH_ANALYSIS_SCHEMA_VERSION) {
    return {
      version: MATCH_ANALYSIS_SCHEMA_VERSION,
      phases: phases.map((phase, index) => normalizePhase(phase, {}, index)),
    }
  }

  if (hasExplicitPhases && Number(parsed?.version || 1) < MATCH_ANALYSIS_SCHEMA_VERSION) {
    return migrateLegacySchema(parsed)
  }

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
  const hasExplicitSchema = Array.isArray(raw?.phases)
    && Number(raw?.version || 1) >= MATCH_ANALYSIS_SCHEMA_VERSION
  const hasLegacyPhases = Array.isArray(raw?.phases) && raw.phases.length > 0
  const hasLegacy = Object.values(legacy || {}).some((item) => safeText(item))

  if (hasExplicitSchema) return createMatchAnalysisSchema(raw)
  if (hasLegacyPhases) return createMatchAnalysisSchema(raw)
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
