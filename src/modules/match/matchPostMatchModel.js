export const MATCH_POST_MATCH_SCHEMA_VERSION = 2

const DEFAULT_POST_MATCH_SECTIONS = [
  {
    id: 'debrief',
    title: 'Debrief della gara',
    helper: 'La lettura sintetica che vuoi conservare dopo la partita.',
    kind: 'text',
    placeholder: 'Cosa ci lascia realmente questa partita?',
    maxLength: 5000,
  },
  {
    id: 'positives',
    title: 'Cosa portiamo con noi',
    helper: 'Comportamenti, principi e aspetti da consolidare.',
    kind: 'text',
    placeholder: 'Punti positivi, conferme, progressi...',
    maxLength: 4000,
  },
  {
    id: 'issues',
    title: 'Cosa correggere',
    helper: 'Problemi osservati senza trasformarli ancora in esercitazioni.',
    kind: 'text',
    placeholder: 'Criticità, errori ricorrenti, situazioni da rivedere...',
    maxLength: 4000,
  },
  {
    id: 'microcyclePriorities',
    title: 'Priorità prossimo microciclo',
    helper: "Il ponte tra analisi gara e progettazione dell'allenamento.",
    kind: 'text',
    placeholder: '2-4 priorità realmente allenabili nella settimana successiva...',
    maxLength: 4000,
  },
  {
    id: 'individualFollowUps',
    title: 'Follow-up individuali',
    helper: 'Giocatori o reparti che richiedono un confronto specifico.',
    kind: 'text',
    placeholder: 'Colloqui, feedback individuali, clip da mostrare...',
    maxLength: 4000,
  },
  {
    id: 'materials',
    title: 'Video e materiali',
    helper: 'Un elemento per riga. Puoi scrivere “Etichetta | https://...” oppure soltanto il link.',
    kind: 'materials',
    placeholder: 'Video gara | https://...\nClip fase difensiva | https://...',
    maxLength: 12000,
  },
]

const DEFAULT_BY_ID = new Map(DEFAULT_POST_MATCH_SECTIONS.map((section) => [section.id, section]))

function parseNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return { ...rawNotes }
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function cleanText(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max)
}

function cleanSectionId(value, index = 0) {
  const id = String(value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
  return id || `custom-${index + 1}`
}

function normalizeMaterial(item = {}) {
  const url = cleanText(item.url, 2000)
  const label = cleanText(item.label, 160)
  if (!url) return null
  return { label, url }
}

export function postMatchMaterialsText(materials = []) {
  return (Array.isArray(materials) ? materials : [])
    .filter((item) => item?.url)
    .map((item) => item.label ? `${item.label} | ${item.url}` : item.url)
    .join('\n')
}

function legacyContentForSection(value, id) {
  if (id === 'debrief') return cleanText(value.debrief, 5000)
  if (id === 'positives') return cleanText(value.positives, 4000)
  if (id === 'issues') return cleanText(value.issues, 4000)
  if (id === 'microcyclePriorities') return cleanText(value.microcyclePriorities ?? value.microcycle_priorities, 4000)
  if (id === 'individualFollowUps') return cleanText(value.individualFollowUps ?? value.individual_follow_ups, 4000)
  if (id === 'materials') return postMatchMaterialsText(value.materials)
  return ''
}

function normalizePostMatchSection(section = {}, index = 0) {
  const id = cleanSectionId(section.id, index)
  const defaults = DEFAULT_BY_ID.get(id)
  const kind = section.kind === 'materials' || defaults?.kind === 'materials' ? 'materials' : 'text'
  const maxLength = defaults?.maxLength || (kind === 'materials' ? 12000 : 4000)
  return {
    id,
    title: cleanText(section.title || defaults?.title || `Sezione ${index + 1}`, 120),
    helper: cleanText(section.helper ?? defaults?.helper ?? '', 320),
    kind,
    placeholder: cleanText(section.placeholder ?? defaults?.placeholder ?? '', 320),
    maxLength,
    content: cleanText(section.content, maxLength),
    order: index,
  }
}

function migrateLegacySections(value = {}) {
  return DEFAULT_POST_MATCH_SECTIONS.map((section, index) => normalizePostMatchSection({
    ...section,
    content: legacyContentForSection(value, section.id),
  }, index))
}

function normalizeSections(value = {}) {
  const source = Array.isArray(value.sections)
    ? value.sections
    : migrateLegacySections(value)

  const seen = new Set()
  const normalized = []
  source.slice(0, 20).forEach((section, index) => {
    const next = normalizePostMatchSection(section, index)
    if (seen.has(next.id)) next.id = `custom-${index + 1}-${next.id}`
    seen.add(next.id)
    next.order = normalized.length
    normalized.push(next)
  })
  return normalized
}

function sectionContent(sections, id) {
  return sections.find((section) => section.id === id)?.content || ''
}

export function normalizeMatchPostMatch(value = {}) {
  const sections = normalizeSections(value)
  const parsedMaterials = parsePostMatchMaterials(sectionContent(sections, 'materials'))
  return {
    schemaVersion: MATCH_POST_MATCH_SCHEMA_VERSION,
    sections,
    // Compatibility mirrors for Report / historic consumers. Identity lives in sections[].id.
    debrief: sectionContent(sections, 'debrief'),
    positives: sectionContent(sections, 'positives'),
    issues: sectionContent(sections, 'issues'),
    microcyclePriorities: sectionContent(sections, 'microcyclePriorities'),
    individualFollowUps: sectionContent(sections, 'individualFollowUps'),
    materials: parsedMaterials.valid ? parsedMaterials.materials : [],
    updatedAt: cleanText(value.updatedAt ?? value.updated_at, 80),
  }
}

export function readMatchPostMatchFromEventNotes(rawNotes) {
  const notes = parseNotes(rawNotes)
  return normalizeMatchPostMatch(notes.post_match || {})
}

export function mergeMatchPostMatchIntoEventNotes(rawNotes, postMatch) {
  const notes = parseNotes(rawNotes)
  return JSON.stringify({
    ...notes,
    post_match: {
      ...normalizeMatchPostMatch(postMatch),
      schema_version: MATCH_POST_MATCH_SCHEMA_VERSION,
    },
  })
}

export function parsePostMatchMaterials(text = '') {
  const errors = []
  const materials = []

  String(text || '').split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) return

    const divider = line.indexOf('|')
    const label = divider >= 0 ? line.slice(0, divider).trim() : ''
    const rawUrl = divider >= 0 ? line.slice(divider + 1).trim() : line

    let url
    try {
      url = new URL(rawUrl)
    } catch {
      errors.push(`Riga ${index + 1}: link non valido.`)
      return
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push(`Riga ${index + 1}: usa un link http o https.`)
      return
    }

    materials.push({
      label: cleanText(label, 160),
      url: url.toString(),
    })
  })

  return {
    valid: errors.length === 0,
    errors,
    materials: materials.slice(0, 20),
  }
}

export function createPostMatchSection({ id, title, content = '', helper = '', kind = 'text' } = {}, index = 0) {
  return normalizePostMatchSection({ id, title, content, helper, kind }, index)
}
