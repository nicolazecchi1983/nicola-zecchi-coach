function parseNotes(rawNotes) {
  if (!rawNotes) return {}
  if (typeof rawNotes === 'object' && !Array.isArray(rawNotes)) return { ...rawNotes }
  try {
    const parsed = JSON.parse(String(rawNotes))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function readSavedMatchReport(event = null) {
  if (!event) return null
  if (event.matchReportData && typeof event.matchReportData === 'object') return event.matchReportData
  const notes = parseNotes(event.rawNotes ?? event.notes)
  return notes?.match_report && typeof notes.match_report === 'object' ? notes.match_report : null
}

export function readSavedMatchReportMeta(event = null) {
  const notes = parseNotes(event?.rawNotes ?? event?.notes)
  const report = readSavedMatchReport(event)
  return {
    report,
    status: event?.matchReportStatus || notes.report_status || (report ? 'completed' : null),
    savedAt: notes.report_saved_at || null,
  }
}

export function formatSavedReportTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
