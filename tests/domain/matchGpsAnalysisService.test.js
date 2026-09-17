import { describe, expect, it, vi } from 'vitest'
import { createMatchGpsAnalysisService } from '../../src/modules/match/matchGpsAnalysisService.js'

function rawImport({
  importId,
  eventId,
  startAt,
  opponent,
  importedAt,
  playerId,
  metricValues,
  minutesPlayed = 90,
}) {
  return {
    id: importId,
    team_id: 'team-1',
    event_id: eventId,
    schema_version: 3,
    source_file_name: `${eventId}.xlsx`,
    source_sheet_name: 'Foglio1',
    source_header_row: 1,
    source_headers: ['KM'],
    source_row_count: 1,
    imported_at: importedAt,
    updated_at: importedAt,
    event: {
      id: eventId,
      team_id: 'team-1',
      event_type: 'match',
      title: `Partita · Casa · vs ${opponent}`,
      start_at: startAt,
      location: 'Budrio',
      notes: JSON.stringify({
        opponent,
        competition: 'Serie D',
        competition_round: '2',
        home_away: 'home',
      }),
    },
    metrics: [{
      id: `metric-${eventId}`,
      import_id: importId,
      team_id: 'team-1',
      player_id: playerId,
      source_row: 2,
      source_ordinal: null,
      source_player_name: 'Giocatore Test',
      source_birth_date: null,
      minutes_played: minutesPlayed,
      metric_values: metricValues,
      source_values: {},
    }],
  }
}

describe('Match GPS analysis service R32.1', () => {
  it('loads every GPS import for the team and returns chronological canonical history', async () => {
    const loadHistoryRows = vi.fn(async () => ({
      data: [
        rawImport({
          importId: 'i2',
          eventId: 'm2',
          startAt: '2026-09-13T15:00:00+02:00',
          opponent: 'Seconda',
          importedAt: '2026-09-13T18:00:00Z',
          playerId: 'p1',
          metricValues: { distanceKm: 11, playerLoad: 500 },
        }),
        rawImport({
          importId: 'i1',
          eventId: 'm1',
          startAt: '2026-09-06T15:00:00+02:00',
          opponent: 'Prima',
          importedAt: '2026-09-15T18:00:00Z',
          playerId: 'p1',
          metricValues: { distanceKm: 9, playerLoad: 450 },
        }),
      ],
      error: null,
    }))

    const service = createMatchGpsAnalysisService({ loadHistoryRows })
    const history = await service.loadHistory({ teamId: 'team-1' })

    expect(loadHistoryRows).toHaveBeenCalledWith('team-1')
    expect(history.map((item) => item.eventId)).toEqual(['m1', 'm2'])
    expect(history[0]).toMatchObject({
      opponent: 'Prima',
      competition: 'Serie D',
      competitionRound: '2',
      homeAway: 'home',
    })
    expect(history[0].rows[0].metrics).toMatchObject({
      distanceKm: 9,
      playerLoad: 450,
    })
  })

  it('is read-only and propagates repository read failures', async () => {
    const error = new Error('network')
    const service = createMatchGpsAnalysisService({
      loadHistoryRows: async () => ({ data: null, error }),
    })

    await expect(service.loadHistory({ teamId: 'team-1' })).rejects.toBe(error)
  })

  it('fails closed without canonical team identity', async () => {
    const loadHistoryRows = vi.fn()
    const service = createMatchGpsAnalysisService({ loadHistoryRows })

    await expect(service.loadHistory({ teamId: '' }))
      .rejects.toMatchObject({ code: 'MATCH_GPS_ANALYSIS_TEAM_MISSING' })

    expect(loadHistoryRows).not.toHaveBeenCalled()
  })
})