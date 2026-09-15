import { getDataAccessUserMessage } from '../../infrastructure/dataAccess/dataAccessUserFeedback.js'
import { assignMatchGpsPlayer, buildMatchGpsSaveRows, matchGpsRowsToRoster, parseMatchGpsWorksheetRows } from './matchGpsModel.js'
import { createMatchGpsService } from './matchGpsService.js'
import { readMatchGpsWorkbook } from './matchGpsWorkbook.js'
import { renderMatchGpsView } from './ui/matchGpsView.js'

function readActiveMatch(storage) {
  try { return JSON.parse(storage?.getItem('staff-active-match') || 'null') } catch { return null }
}

export function createMatchGpsWorkspace({
  storage = globalThis.localStorage,
  getCalendarEvents = () => [],
  getTeamProfile = () => ({}),
  getRoster = () => [],
  canImport = () => false,
  service = createMatchGpsService(),
} = {}) {
  const state = { eventId: null, match: null, saved: null, preview: null, error: '' }

  async function prepare() {
    const active = readActiveMatch(storage)
    const events = getCalendarEvents()
    const event = events.find((item) => String(item?.id || '') === String(active?.id || '')) || active
    const nextId = String(event?.id || '')
    if (state.eventId !== nextId) {
      state.eventId = nextId
      state.preview = null
      state.saved = null
      state.error = ''
    }
    state.match = event
    const teamId = getTeamProfile()?.id
    if (!nextId || !teamId) return
    try {
      state.saved = await service.load({ teamId, eventId: nextId })
    } catch (error) {
      state.error = getDataAccessUserMessage(error, undefined, { stage: 'match-gps-load' })
    }
  }

  return Object.freeze({
    prepare,
    render() {
      return renderMatchGpsView({ match: state.match, team: getTeamProfile(), roster: getRoster(), saved: state.saved, preview: state.preview, error: state.error, canImport: canImport() })
    },
    async importFile(file) {
      const workbook = await readMatchGpsWorkbook(file)
      const parsed = parseMatchGpsWorksheetRows(workbook.matrix)
      state.preview = {
        source: { fileName: workbook.fileName, sheetName: workbook.sheetName, headerRow: parsed.headerRow, headers: parsed.headers, rowCount: parsed.rows.length },
        rows: matchGpsRowsToRoster(parsed.rows, getRoster()),
      }
      state.error = ''
    },
    assign(sourceRow, playerId) {
      if (!state.preview) return
      state.preview = { ...state.preview, rows: assignMatchGpsPlayer(state.preview.rows, sourceRow, playerId, getRoster()) }
      state.error = ''
    },
    clearPreview() { state.preview = null; state.error = '' },
    setError(error, stage = 'match-gps-parse') { state.error = getDataAccessUserMessage(error, undefined, { stage }) },
    async save() {
      const teamId = getTeamProfile()?.id
      if (!state.preview || !state.eventId || !teamId) throw new Error('Anteprima GPS non disponibile.')
      const rows = buildMatchGpsSaveRows(state.preview.rows, getRoster())
      await service.replace({ teamId, eventId: state.eventId, source: state.preview.source, rows })
      state.preview = null
      state.error = ''
      state.saved = await service.load({ teamId, eventId: state.eventId })
    },
  })
}
