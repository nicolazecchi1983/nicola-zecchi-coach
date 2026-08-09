import { classifySeasonImportRows, validateSeasonImportRows } from './seasonCalendarImportModel.js'

export function createSeasonCalendarImportService({ createMatch, reloadEvents } = {}) {
  if (typeof createMatch !== 'function') throw new Error('Import calendario non configurato.')

  return {
    preview(rows, calendarEvents = []) {
      const validation = validateSeasonImportRows(rows)
      return {
        ...validation,
        rows: classifySeasonImportRows(validation.rows, calendarEvents),
      }
    },

    async commit(rows, calendarEvents = []) {
      const preview = this.preview(rows, calendarEvents)
      if (!preview.valid) throw new Error(preview.errors[0] || 'Dati calendario non validi.')

      const created = []
      const skipped = preview.rows.filter((row) => row.importStatus === 'duplicate')
      for (const row of preview.rows.filter((item) => item.importStatus === 'new')) {
        created.push(await createMatch(row))
      }
      if (typeof reloadEvents === 'function') await reloadEvents()
      return { created, skipped }
    },
  }
}
