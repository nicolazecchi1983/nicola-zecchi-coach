export const MATCH_POST_MATCH_SCHEMA_VERSION = 1

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

function normalizeMaterial(item = {}) {
  const url = cleanText(item.url, 2000)
  const label = cleanText(item.label, 160)
  if (!url) return null
  return { label, url }
}

export function normalizeMatchPostMatch(value = {}) {
  return {
    schemaVersion: MATCH_POST_MATCH_SCHEMA_VERSION,
    debrief: cleanText(value.debrief, 5000),
    positives: cleanText(value.positives, 4000),
    issues: cleanText(value.issues, 4000),
    microcyclePriorities: cleanText(value.microcyclePriorities ?? value.microcycle_priorities, 4000),
    individualFollowUps: cleanText(value.individualFollowUps ?? value.individual_follow_ups, 4000),
    materials: (Array.isArray(value.materials) ? value.materials : [])
      .map(normalizeMaterial)
      .filter(Boolean)
      .slice(0, 20),
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

export function postMatchMaterialsText(materials = []) {
  return (Array.isArray(materials) ? materials : [])
    .filter((item) => item?.url)
    .map((item) => item.label ? `${item.label} | ${item.url}` : item.url)
    .join('\n')
}
