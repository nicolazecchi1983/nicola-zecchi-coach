import { describe, expect, it, vi } from 'vitest'
import { createMatchGpsService } from '../../src/modules/match/matchGpsService.js'

describe('matchGpsService', () => {
  it('normalizza import e metriche Supabase nel modello applicativo', async () => {
    const loadImportRow = vi.fn(async () => ({ data: {
      id: 'import-1', team_id: 'team-1', event_id: 'match-1', schema_version: 1,
      source_file_name: 'gara.xlsx', source_sheet_name: 'Foglio1', source_header_row: 4,
      source_headers: ['KM'], source_row_count: 28, imported_at: '2026-09-15T09:00:00Z',
      metrics: [{ player_id: 'player-1', source_row: 9, source_ordinal: 4, source_player_name: 'Musiani Manuel', distance_km: 11.98 }],
    }, error: null }))
    const service = createMatchGpsService({ loadImportRow })
    const result = await service.load({ teamId: 'team-1', eventId: 'match-1' })
    expect(result).toMatchObject({
      sourceFileName: 'gara.xlsx',
      sourceRowCount: 28,
      rows: [{ playerId: 'player-1', metrics: { distanceKm: 11.98, maxSpeedMs: null } }],
    })
  })

  it('costruisce un unico payload atomico mantenendo null e snapshot sorgente', async () => {
    const replaceImportRow = vi.fn(async () => ({ data: 'import-1', error: null }))
    const service = createMatchGpsService({ replaceImportRow })
    await service.replace({
      teamId: 'team-1', eventId: 'match-1',
      source: { fileName: 'gara.xlsx', sheetName: 'Foglio1', headerRow: 4, headers: ['KM'], rowCount: 28 },
      rows: [{
        playerId: 'player-1', sourceRow: 9, sourceOrdinal: 4, sourcePlayerName: 'Musiani Manuel', sourceBirthDate: '2000-02-29',
        metrics: { restingHeartRate: 52, maxHeartRate: null, distanceKm: 11.98 },
        sourceValues: { KM: '11,98' },
      }],
    })
    expect(replaceImportRow).toHaveBeenCalledWith(expect.objectContaining({
      p_team_id: 'team-1',
      p_event_id: 'match-1',
      p_source_row_count: 28,
      p_rows: [expect.objectContaining({
        player_id: 'player-1',
        max_heart_rate: null,
        distance_km: 11.98,
        source_values: { KM: '11,98' },
      })],
    }))
  })

  it('propaga gli errori di persistenza senza convertirli in dati vuoti', async () => {
    const service = createMatchGpsService({ loadImportRow: async () => ({ data: null, error: new Error('offline') }) })
    await expect(service.load({ teamId: 'team-1', eventId: 'match-1' })).rejects.toThrow('offline')
  })
})
