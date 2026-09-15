import { AppError } from '../../core/appError.js'
import {
  loadMatchGpsImportRow,
  replaceMatchGpsImportRow,
} from '../../infrastructure/repositories/matchGpsRepository.js'
import { MATCH_GPS_SCHEMA_VERSION } from './matchGpsModel.js'

function requireIdentity(value, label) {
  const id = String(value || '').trim()
  if (!id) throw new AppError(`${label} mancante.`, { code: 'MATCH_GPS_IDENTITY_MISSING', stage: 'match-gps-load' })
  return id
}

function normalizeMetricRow(row = {}) {
  return {
    id: row.id || null,
    playerId: row.player_id || null,
    sourceRow: Number(row.source_row) || null,
    sourceOrdinal: Number(row.source_ordinal) || null,
    sourcePlayerName: String(row.source_player_name || ''),
    sourceBirthDate: row.source_birth_date || null,
    metrics: {
      restingHeartRate: row.resting_heart_rate ?? null,
      maxHeartRate: row.max_heart_rate ?? null,
      maxSpeedMs: row.max_speed_ms ?? null,
      distanceMaxSpeedKm: row.distance_max_speed_km ?? null,
      averageSpeed: row.average_speed ?? null,
      accelerationMs2: row.acceleration_ms2 ?? null,
      accelerationCount: row.acceleration_count ?? null,
      decelerationCount: row.deceleration_count ?? null,
      distanceKm: row.distance_km ?? null,
    },
    sourceValues: row.source_values || {},
  }
}

function normalizeImport(row) {
  if (!row) return null
  return {
    id: row.id,
    teamId: row.team_id,
    eventId: row.event_id,
    schemaVersion: Number(row.schema_version) || MATCH_GPS_SCHEMA_VERSION,
    sourceFileName: row.source_file_name || '',
    sourceSheetName: row.source_sheet_name || '',
    sourceHeaderRow: Number(row.source_header_row) || null,
    sourceHeaders: Array.isArray(row.source_headers) ? row.source_headers : [],
    sourceRowCount: Number(row.source_row_count) || 0,
    importedBy: row.imported_by || null,
    importedAt: row.imported_at || null,
    updatedAt: row.updated_at || null,
    rows: Array.isArray(row.metrics) ? row.metrics.map(normalizeMetricRow) : [],
  }
}

function persistenceRow(row) {
  const metrics = row.metrics || {}
  return {
    player_id: row.playerId,
    source_row: row.sourceRow,
    source_ordinal: row.sourceOrdinal,
    source_player_name: row.sourcePlayerName,
    source_birth_date: row.sourceBirthDate,
    resting_heart_rate: metrics.restingHeartRate ?? null,
    max_heart_rate: metrics.maxHeartRate ?? null,
    max_speed_ms: metrics.maxSpeedMs ?? null,
    distance_max_speed_km: metrics.distanceMaxSpeedKm ?? null,
    average_speed: metrics.averageSpeed ?? null,
    acceleration_ms2: metrics.accelerationMs2 ?? null,
    acceleration_count: metrics.accelerationCount ?? null,
    deceleration_count: metrics.decelerationCount ?? null,
    distance_km: metrics.distanceKm ?? null,
    source_values: row.sourceValues || {},
  }
}

export function createMatchGpsService({
  loadImportRow = loadMatchGpsImportRow,
  replaceImportRow = replaceMatchGpsImportRow,
} = {}) {
  return {
    async load({ teamId, eventId } = {}) {
      const resolvedTeamId = requireIdentity(teamId, 'Squadra')
      const resolvedEventId = requireIdentity(eventId, 'Partita')
      const { data, error } = await loadImportRow(resolvedTeamId, resolvedEventId)
      if (error) throw error
      return normalizeImport(data)
    },

    async replace({ teamId, eventId, source, rows } = {}) {
      const resolvedTeamId = requireIdentity(teamId, 'Squadra')
      const resolvedEventId = requireIdentity(eventId, 'Partita')
      if (!source?.fileName || !source?.sheetName || !Array.isArray(rows) || !rows.length) {
        throw new AppError('Import GPS incompleto.', {
          code: 'MATCH_GPS_SAVE_PAYLOAD_INVALID',
          stage: 'match-gps-save',
          userMessage: 'Completa l’anteprima GPS prima di confermare l’importazione.',
        })
      }
      const payload = {
        p_team_id: resolvedTeamId,
        p_event_id: resolvedEventId,
        p_schema_version: MATCH_GPS_SCHEMA_VERSION,
        p_source_file_name: source.fileName,
        p_source_sheet_name: source.sheetName,
        p_source_header_row: source.headerRow,
        p_source_headers: source.headers || [],
        p_source_row_count: source.rowCount,
        p_rows: rows.map(persistenceRow),
      }
      const { data, error } = await replaceImportRow(payload)
      if (error) throw error
      return data
    },
  }
}
