import { selectCalendarEventsForBulkAction } from './calendarBulkManagementModel.js'

export function createCalendarBulkManagementService({ deleteEvents, reloadEvents } = {}) {
  if (typeof deleteEvents !== 'function') throw new Error('Gestione massiva Calendario non configurata.')

  return {
    preview(events, criteria) {
      return selectCalendarEventsForBulkAction(events, criteria)
    },

    async commit(events, criteria) {
      const preview = selectCalendarEventsForBulkAction(events, criteria)
      const ids = preview.deletableEvents.map((event) => event.id).filter(Boolean)
      const result = ids.length ? await deleteEvents(ids) : { deleted: 0 }
      if (typeof reloadEvents === 'function') await reloadEvents()
      return {
        ...preview,
        deleted: result?.deleted ?? ids.length,
      }
    },
  }
}
