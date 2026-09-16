import { AppError } from '../../core/appError.js'
import { loadMatchGpsHistoryRows } from '../../infrastructure/repositories/matchGpsRepository.js'
import { normalizeMatchGpsHistory } from './matchGpsAnalysisModel.js'
import { normalizeMatchGpsImportRow } from './matchGpsService.js'

function requireTeamId(value) {
  const teamId = String(value || '').trim()
  if (!teamId) {
    throw new AppError('Squadra mancante.', {
      code: 'MATCH_GPS_ANALYSIS_TEAM_MISSING',
      stage: 'match-gps-analysis-load',
      userMessage: 'Seleziona una squadra prima di aprire l’analisi GPS.',
    })
  }
  return teamId
}

export function createMatchGpsAnalysisService({
  loadHistoryRows = loadMatchGpsHistoryRows,
} = {}) {
  return Object.freeze({
    async loadHistory({ teamId } = {}) {
      const resolvedTeamId = requireTeamId(teamId)
      const { data, error } = await loadHistoryRows(resolvedTeamId)

      if (error) throw error

      const imports = Array.isArray(data) ? data : []

      return normalizeMatchGpsHistory(
        imports.map((row) => ({
          ...normalizeMatchGpsImportRow(row),
          event: row.event || null,
        })),
      )
    },
  })
}