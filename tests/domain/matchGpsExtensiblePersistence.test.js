import { describe, expect, it, vi } from 'vitest'
import { createMatchGpsService } from '../../src/modules/match/matchGpsService.js'

function importRow(metricRow) {
  return {
    id: 'import-1',
    team_id: 'team-1',
    event_id: 'match-1',
    schema_version: 3,
    source_file_name: 'gara.xlsx',
    source_sheet_name: 'Foglio1',
    source_header_row: 4,
    source_headers: ['KM'],
    source_row_count: 1,
    imported_at: '2026-09-16T08:00:00Z',
    metrics: [metricRow],
  }
}

describe('Match GPS extensible persistence R32', () => {
  it('falls back to R31 legacy scalar columns when metric_values is absent', async () => {
    const service = createMatchGpsService({
      loadImportRow: async () => ({
        data: importRow({
          player_id: 'player-1',
          source_row: 6,
          source_ordinal: 1,
          source_player_name: 'Musiani Manuel',
          distance_km: 11.98,
          max_speed_ms: 8.85,
        }),
        error: null,
      }),
    })

    const result = await service.load({ teamId: 'team-1', eventId: 'match-1' })

    expect(result.rows[0].metrics).toMatchObject({
      distanceKm: 11.98,
      maxSpeedMs: 8.85,
    })
  })

  it('prefers metric_values and preserves future canonical metrics', async () => {
    const service = createMatchGpsService({
      loadImportRow: async () => ({
        data: importRow({
          player_id: 'player-1',
          source_row: 6,
          source_ordinal: null,
          source_player_name: 'Musiani Manuel',
          distance_km: 11.98,
          metric_values: {
            distanceKm: 12.4,
            playerLoad: 456,
          },
        }),
        error: null,
      }),
    })

    const result = await service.load({ teamId: 'team-1', eventId: 'match-1' })

    expect(result.rows[0]).toMatchObject({
      sourceOrdinal: null,
      metrics: {
        distanceKm: 12.4,
        playerLoad: 456,
      },
    })
  })

  it('writes metric_values while maintaining R31 scalar compatibility', async () => {
    const replaceImportRow = vi.fn(async () => ({ data: 'import-1', error: null }))
    const service = createMatchGpsService({ replaceImportRow })

    await service.replace({
      teamId: 'team-1',
      eventId: 'match-1',
      source: {
        fileName: 'gara.xlsx',
        sheetName: 'Foglio1',
        headerRow: 4,
        headers: ['Cognome/ nome', 'KM', 'Player Load'],
        rowCount: 1,
      },
      rows: [{
        playerId: 'player-1',
        sourceRow: 6,
        sourceOrdinal: null,
        sourcePlayerName: 'Musiani Manuel',
        sourceBirthDate: null,
        minutesPlayed: 90,
        metrics: {
          distanceKm: 10.5,
          playerLoad: 321,
        },
        sourceValues: {
          'Cognome/ nome': 'Musiani Manuel',
          KM: 10.5,
          'Player Load': 321,
        },
      }],
    })

    const payload = replaceImportRow.mock.calls[0][0]
    const row = payload.p_rows[0]

    expect(payload.p_schema_version).toBe(3)
    expect(row).toMatchObject({
      source_ordinal: null,
      minutes_played: 90,
      distance_km: 10.5,
      metric_values: {
        distanceKm: 10.5,
        playerLoad: 321,
      },
      source_values: {
        'Cognome/ nome': 'Musiani Manuel',
        KM: 10.5,
        'Player Load': 321,
      },
    })
    expect(row).not.toHaveProperty('player_load')
  })

  it('rejects non-numeric extensible metric values before persistence', async () => {
    const replaceImportRow = vi.fn()
    const service = createMatchGpsService({ replaceImportRow })

    await expect(service.replace({
      teamId: 'team-1',
      eventId: 'match-1',
      source: {
        fileName: 'gara.xlsx',
        sheetName: 'Foglio1',
        headerRow: 1,
        headers: ['KM'],
        rowCount: 1,
      },
      rows: [{
        playerId: 'player-1',
        sourceRow: 2,
        sourceOrdinal: null,
        sourcePlayerName: 'Musiani Manuel',
        sourceBirthDate: null,
        minutesPlayed: 90,
        metrics: {
          playerLoad: '321',
        },
        sourceValues: {},
      }],
    })).rejects.toMatchObject({
      code: 'MATCH_GPS_METRIC_VALUES_INVALID',
    })

    expect(replaceImportRow).not.toHaveBeenCalled()
  })
})