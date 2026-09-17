import { describe, expect, it } from 'vitest'
import { createMatchGpsService } from '../../src/modules/match/matchGpsService.js'

describe('match GPS minutes persistence', () => {
  it('carica minutes_played nel modello applicativo', async () => {
    const service = createMatchGpsService({
      loadImportRow: async () => ({
        data: {
          id: 'import-1',
          team_id: 'team-1',
          event_id: 'event-1',
          schema_version: 2,
          source_file_name: 'gps.xlsx',
          source_sheet_name: 'Foglio1',
          source_header_row: 4,
          source_headers: [],
          source_row_count: 1,
          metrics: [{
            id: 'metric-1',
            player_id: 'player-1',
            source_row: 6,
            source_ordinal: 1,
            source_player_name: 'Fabbri Filippo',
            source_birth_date: '2002-01-07',
            minutes_played: 58,
            source_values: {},
          }],
        },
        error: null,
      }),
    })

    const result = await service.load({ teamId: 'team-1', eventId: 'event-1' })
    expect(result.rows[0].minutesPlayed).toBe(58)
  })

  it('salva minutesPlayed come minutes_played e usa lo schema GPS corrente', async () => {
    let captured = null

    const service = createMatchGpsService({
      replaceImportRow: async (payload) => {
        captured = payload
        return { data: 'import-1', error: null }
      },
    })

    await service.replace({
      teamId: 'team-1',
      eventId: 'event-1',
      source: {
        fileName: 'gps.xlsx',
        sheetName: 'Foglio1',
        headerRow: 4,
        headers: [],
        rowCount: 1,
      },
      rows: [{
        playerId: 'player-1',
        sourceRow: 6,
        sourceOrdinal: 1,
        sourcePlayerName: 'Fabbri Filippo',
        sourceBirthDate: '2002-01-07',
        minutesPlayed: 58,
        metrics: {},
        sourceValues: {},
      }],
    })

    expect(captured.p_schema_version).toBe(3)
    expect(captured.p_rows[0].minutes_played).toBe(58)
  })
})