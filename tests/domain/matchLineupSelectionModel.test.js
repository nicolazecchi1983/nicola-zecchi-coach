import { describe, expect, it } from 'vitest'
import { findMatchLineupDuplicatePlayers, sanitizeMatchLineupStarters, sortMatchLineupPlayers } from '../../src/modules/match/matchLineupSelectionModel.js'
import { assertMatchCallupsLimit, createActiveMatchRosterSelector, filterRosterBySavedCallups, MATCH_CALLUPS_MAX_PLAYERS, readMatchCallupsFromEvent } from '../../src/modules/match/matchCallupsModel.js'

describe('match lineup selection model', () => {
  it('sorts players by surname then first name without mutating source', () => {
    const source = [
      { canonicalName: 'Mario Zeta', surname: 'Zeta', firstName: 'Mario' },
      { canonicalName: 'Luca Bianchi', surname: 'Bianchi', firstName: 'Luca' },
      { canonicalName: 'Andrea Bianchi', surname: 'Bianchi', firstName: 'Andrea' },
    ]
    expect(sortMatchLineupPlayers(source).map((player) => player.canonicalName))
      .toEqual(['Andrea Bianchi', 'Luca Bianchi', 'Mario Zeta'])
    expect(source[0].canonicalName).toBe('Mario Zeta')
  })

  it('detects duplicate identity across the full 20-slot match sheet', () => {
    expect(findMatchLineupDuplicatePlayers({
      starters: ['A', 'B', 'C', 'A'],
      bench: ['D', 'B', '', 'E'],
    })).toEqual(['A', 'B'])
    expect(findMatchLineupDuplicatePlayers({
      starters: ['A', 'B'],
      bench: ['C', 'D'],
    })).toEqual([])
  })

  it('sanitizes duplicate or non-convocato starters at the boundary', () => {
    const roster = [{ canonicalName: 'A' }, { canonicalName: 'B' }]
    expect(sanitizeMatchLineupStarters(['A', 'A', 'X', 'B'], roster).slice(0, 4))
      .toEqual(['A', '', '', 'B'])
  })

  it('uses saved callups as the only Formation roster and rejects more than 20', () => {
    const roster = Array.from({ length: 22 }, (_, index) => ({ id: `p${index}`, canonicalName: `P${index}` }))
    expect(filterRosterBySavedCallups(roster, { persisted: false, players: [] })).toEqual([])
    const saved = { persisted: true, players: roster.slice(0, 20).map((player) => ({ playerId: player.id, name: player.canonicalName })) }
    expect(filterRosterBySavedCallups(roster, saved)).toHaveLength(MATCH_CALLUPS_MAX_PLAYERS)
    expect(() => assertMatchCallupsLimit(roster.slice(0, 21).map((player) => ({ playerId: player.id, name: player.canonicalName })))).toThrow(/massimo 20/)
  })

  it('reads persisted callups from the canonical Calendar rawNotes source after section reload', () => {
    const rawNotes = JSON.stringify({
      type: 'match_event',
      match_callups: {
        players: [{ playerId: 'p1', name: 'Player One', role: 'Difensore', shirtNumber: 2 }],
        updated_at: '2026-09-07T06:00:00.000Z',
      },
    })
    const event = {
      id: 'm1',
      rawNotes,
      notes: JSON.stringify({ match_callups: { players: [{ playerId: 'wrong', name: 'Wrong Player' }] } }),
    }
    const roster = [
      { id: 'p1', canonicalName: 'Player One' },
      { id: 'p2', canonicalName: 'Player Two' },
    ]

    expect(readMatchCallupsFromEvent(event).players.map((player) => player.playerId)).toEqual(['p1'])

    const selectRoster = createActiveMatchRosterSelector({
      getRosterPlayers: () => roster,
      getActiveMatchContext: () => ({ id: 'm1' }),
      getCalendarEvents: () => [event],
    })
    expect(selectRoster().map((player) => player.id)).toEqual(['p1'])
  })
})
