import { describe, expect, it } from 'vitest'
import {
  buildMatchGpsPlayerMetricSeries,
  buildMatchGpsSquadMetricSeries,
  normalizeMatchGpsHistory,
  normalizeMatchGpsPer90,
  readMatchGpsMetricValue,
} from '../../src/modules/match/matchGpsAnalysisModel.js'

const row = (playerId, distanceKm, minutesPlayed, extra = {}) => ({
  playerId,
  minutesPlayed,
  metrics: {
    distanceKm,
    maxSpeedMs: extra.maxSpeedMs ?? null,
  },
})

const match = ({
  id,
  startAt,
  opponent,
  importedAt,
  rows,
}) => ({
  id: `import-${id}`,
  eventId: id,
  importedAt,
  event: {
    id,
    start_at: startAt,
    title: `Partita · Casa · vs ${opponent}`,
    notes: JSON.stringify({ opponent, competition: 'Serie D' }),
  },
  rows,
})

describe('Match GPS multi-match analysis model R32.1', () => {
  it('orders matches by canonical event date rather than import date', () => {
    const history = normalizeMatchGpsHistory([
      match({
        id: 'm2',
        startAt: '2026-09-13T15:00:00+02:00',
        opponent: 'Seconda',
        importedAt: '2026-09-13T18:00:00Z',
        rows: [],
      }),
      match({
        id: 'm1',
        startAt: '2026-09-06T15:00:00+02:00',
        opponent: 'Prima',
        importedAt: '2026-09-15T18:00:00Z',
        rows: [],
      }),
    ])

    expect(history.map((item) => item.eventId)).toEqual(['m1', 'm2'])
    expect(history.map((item) => item.opponent)).toEqual(['Prima', 'Seconda'])
  })

  it('keeps zero distinct from null and normalizes only with positive minutes', () => {
    expect(normalizeMatchGpsPer90(0, 90)).toBe(0)
    expect(normalizeMatchGpsPer90(null, 90)).toBeNull()
    expect(normalizeMatchGpsPer90(10, null)).toBeNull()
    expect(normalizeMatchGpsPer90(10, 0)).toBeNull()
    expect(normalizeMatchGpsPer90(10, 45)).toBe(20)
  })

  it('allows /90 only for metrics owned as per90 by the registry', () => {
    const sample = row('p1', 10, 45, { maxSpeedMs: 8.5 })

    expect(readMatchGpsMetricValue(sample, 'distanceKm', { mode: 'per90' })).toBe(20)
    expect(readMatchGpsMetricValue(sample, 'maxSpeedMs', { mode: 'per90' })).toBeNull()
    expect(readMatchGpsMetricValue(sample, 'unknownMetric')).toBeNull()
  })

  it('builds squad match statistics without converting missing values to zero', () => {
    const history = [
      match({
        id: 'm1',
        startAt: '2026-09-06T15:00:00+02:00',
        opponent: 'Prima',
        rows: [
          row('p1', 10, 90),
          row('p2', 0, 45),
          row('p3', null, 90),
        ],
      }),
    ]

    const series = buildMatchGpsSquadMetricSeries(history, 'distanceKm')

    expect(series).toHaveLength(1)
    expect(series[0].actual).toMatchObject({
      count: 2,
      sum: 10,
      average: 5,
      min: 0,
      max: 10,
    })
    expect(series[0].per90).toMatchObject({
      count: 2,
      sum: 10,
      average: 5,
    })
    expect(series[0]).toMatchObject({
      playerCount: 3,
      totalMinutes: 225,
    })
  })

  it('keeps explicit null gaps in a player longitudinal series', () => {
    const history = [
      match({
        id: 'm1',
        startAt: '2026-09-06T15:00:00+02:00',
        opponent: 'Prima',
        rows: [row('p1', 9, 90)],
      }),
      match({
        id: 'm2',
        startAt: '2026-09-13T15:00:00+02:00',
        opponent: 'Seconda',
        rows: [row('p2', 11, 90)],
      }),
    ]

    const series = buildMatchGpsPlayerMetricSeries(history, 'p1', 'distanceKm')

    expect(series).toHaveLength(2)
    expect(series[0]).toMatchObject({
      rowPresent: true,
      actualValue: 9,
      per90Value: 9,
    })
    expect(series[1]).toMatchObject({
      rowPresent: false,
      actualValue: null,
      per90Value: null,
      minutesPlayed: null,
    })
  })
})