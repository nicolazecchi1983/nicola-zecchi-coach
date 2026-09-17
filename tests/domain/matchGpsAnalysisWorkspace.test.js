import { describe, expect, it, vi } from 'vitest'
import { createMatchGpsAnalysisWorkspace } from '../../src/modules/match/matchGpsAnalysisWorkspace.js'

const history = [
  {
    eventId: 'm1',
    matchDate: '2026-09-06',
    startAt: '2026-09-06T15:00:00+02:00',
    opponent: 'Prima',
    rows: [{
      playerId: 'p1',
      sourcePlayerName: 'Mario Rossi',
      minutesPlayed: 90,
      metrics: { distanceKm: 10, maxSpeedMs: 8.5 },
    }],
  },
]

describe('Match GPS analysis workspace R32.2', () => {
  it('loads team history without reading selected-match storage', async () => {
    const loadHistory = vi.fn(async () => history)
    const workspace = createMatchGpsAnalysisWorkspace({
      getTeamProfile: () => ({ id: 'team-1', name: 'Mezzolara' }),
      getRoster: () => [{ id: 'p1', name: 'Mario Rossi' }],
      service: { loadHistory },
    })

    await workspace.prepare()

    expect(loadHistory).toHaveBeenCalledWith({ teamId: 'team-1' })
    expect(workspace.render()).toContain('Analisi multi-partita')
  })

  it('keeps cached history during UI-only selection changes', async () => {
    const loadHistory = vi.fn(async () => history)
    const workspace = createMatchGpsAnalysisWorkspace({
      getTeamProfile: () => ({ id: 'team-1' }),
      getRoster: () => [{ id: 'p1', name: 'Mario Rossi' }],
      service: { loadHistory },
    })

    await workspace.prepare()
    workspace.setScope('player')
    workspace.setPlayer('p1')
    workspace.setMetric('distanceKm')
    workspace.setNormalization('per90')
    await workspace.prepare()

    expect(loadHistory).toHaveBeenCalledTimes(1)
    const html = workspace.render()
    expect(html).toContain('Trend giocatore')
    expect(html).toContain('/90’')
  })

  it('forces a fresh read only when refresh is requested', async () => {
    const loadHistory = vi.fn(async () => history)
    const workspace = createMatchGpsAnalysisWorkspace({
      getTeamProfile: () => ({ id: 'team-1' }),
      getRoster: () => [],
      service: { loadHistory },
    })

    await workspace.prepare()
    await workspace.refresh()

    expect(loadHistory).toHaveBeenCalledTimes(2)
  })
})