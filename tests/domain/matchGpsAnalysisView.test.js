import { describe, expect, it } from 'vitest'
import { renderMatchGpsAnalysisView } from '../../src/modules/match/ui/matchGpsAnalysisView.js'

const history = [
  {
    eventId: 'm1',
    matchDate: '2026-09-06',
    startAt: '2026-09-06T15:00:00+02:00',
    opponent: 'Prima',
    competition: 'Serie D',
    competitionRound: '1',
    rows: [
      {
        playerId: 'p1',
        sourcePlayerName: 'Mario Rossi',
        minutesPlayed: 90,
        metrics: { distanceKm: 10, maxSpeedMs: 8.5 },
      },
      {
        playerId: 'p2',
        sourcePlayerName: 'Luca Bianchi',
        minutesPlayed: 45,
        metrics: { distanceKm: 0, maxSpeedMs: 7.8 },
      },
    ],
  },
  {
    eventId: 'm2',
    matchDate: '2026-09-13',
    startAt: '2026-09-13T15:00:00+02:00',
    opponent: 'Seconda',
    competition: 'Serie D',
    competitionRound: '2',
    rows: [
      {
        playerId: 'p2',
        sourcePlayerName: 'Luca Bianchi',
        minutesPlayed: 90,
        metrics: { distanceKm: 11, maxSpeedMs: 8.1 },
      },
    ],
  },
]

describe('Match GPS multi-match analysis view R32.2', () => {
  it('renders as a top-level multi-match workspace without selected-match shell', () => {
    const html = renderMatchGpsAnalysisView({
      team: { name: 'Mezzolara' },
      history,
      metricKey: 'distanceKm',
    })

    expect(html).toContain('data-match-gps-analysis-workspace')
    expect(html).toContain('Analisi multi-partita')
    expect(html).not.toContain('data-match-workspace')
    expect(html).not.toContain('staff-active-match')
  })

  it('renders chronological squad comparison with minutes and player context', () => {
    const html = renderMatchGpsAnalysisView({
      history,
      metricKey: 'distanceKm',
      scope: 'squad',
      normalization: 'actual',
    })

    expect(html.indexOf('Prima')).toBeLessThan(html.indexOf('Seconda'))
    expect(html).toContain('Minuti squadra')
    expect(html).toContain('Giocatori')
    expect(html).toContain('10 km')
  })

  it('keeps chart typography outside the scalable SVG so labels stay crisp', () => {
    const html = renderMatchGpsAnalysisView({
      history,
      metricKey: 'distanceKm',
      scope: 'squad',
      normalization: 'actual',
    })

    expect(html).toContain('match-gps-analysis-chart-stage')
    expect(html).toContain('match-gps-analysis-chart-value-layer')
    expect(html).toContain('match-gps-analysis-chart-label-layer')
    expect(html).toContain('match-gps-analysis-chart-value')
    expect(html).toContain('match-gps-analysis-chart-label')
    expect(html).toContain('left:clamp(34px,')
    expect(html).toContain('left:clamp(44px,')
    expect(html).not.toMatch(/<text[\s>]/)
  })
  it('renders an explicit one-match state instead of an apparently empty trend chart', () => {
    const singleMatchHtml = renderMatchGpsAnalysisView({
      history: [history[0]],
      metricKey: 'distanceKm',
      scope: 'squad',
      normalization: 'actual',
    })

    expect(singleMatchHtml).toContain('data-match-gps-analysis-single-point')
    expect(singleMatchHtml).toContain('1 PARTITA DISPONIBILE')
    expect(singleMatchHtml).toContain('Prima')
    expect(singleMatchHtml).toContain('10 km')
    expect(singleMatchHtml).toContain('almeno 2 partite GPS')
    expect(singleMatchHtml).not.toContain('<svg')
  })
  it('offers /90 only for metrics owned as per90 by the registry', () => {
    const cumulative = renderMatchGpsAnalysisView({
      history,
      metricKey: 'distanceKm',
      normalization: 'per90',
    })
    const intensive = renderMatchGpsAnalysisView({
      history,
      metricKey: 'maxSpeedMs',
      normalization: 'per90',
    })

    expect(cumulative).toContain('data-match-gps-analysis-normalization="per90"')
    expect(intensive).not.toContain('data-match-gps-analysis-normalization="per90"')
    expect(intensive).toContain('Valore reale')
  })

  it('renders a player longitudinal series and preserves missing-match gaps', () => {
    const html = renderMatchGpsAnalysisView({
      history,
      scope: 'player',
      metricKey: 'distanceKm',
      playerId: 'p1',
    })

    expect(html).toContain('Trend giocatore')
    expect(html).toContain('Mario Rossi')
    expect(html).toContain('Prima')
    expect(html).toContain('Seconda')
    expect(html).toContain('—')
  })
})