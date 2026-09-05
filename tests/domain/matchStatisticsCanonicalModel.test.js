import { describe, expect, it } from 'vitest'
import { buildCanonicalMatchDataSnapshot } from '../../src/modules/match/matchStatisticsModel.js'

function player(id, number) {
  return {
    slot: Number(id.replace(/\D/g, '')) - 1,
    player_id: id,
    name: `Player ${id}`,
    shirt_number: number,
  }
}

function eventWith({ status = 'finished', period = 'full_time', events = [], score = { our: 2, opponent: 1 } } = {}) {
  const starters = Array.from({ length: 11 }, (_, index) => ({
    slot: index,
    player_id: `s${index + 1}`,
    name: `Starter ${index + 1}`,
    shirt_number: index + 1,
    x: 50,
    y: 50,
  }))
  const bench = [
    { slot: 12, player_id: 'b1', name: 'Bench 1', shirt_number: 12 },
    { slot: 13, player_id: 'b2', name: 'Bench 2', shirt_number: 13 },
  ]

  return {
    id: 'match-1',
    opponent: 'Avversario',
    startAt: '2026-09-04T13:00:00.000Z',
    rawNotes: JSON.stringify({
      type: 'match_event',
      match_squad_snapshot: {
        schema_version: 1,
        formation: '4-4-2',
        starters,
        bench,
      },
      match_center: {
        schema_version: 1,
        status,
        period,
        score,
        events,
      },
    }),
  }
}

describe('Match Statistics canonical source', () => {
  it('deriva i minuti da PRE + sostituzioni + espulsioni senza salvare un secondo stato', () => {
    const event = eventWith({
      events: [
        { id: 'g1', type: 'goal', side: 'our', minute: 18, sequence: 0, scorer: { player_id: 's9', name: 'Starter 9' }, assist: { player_id: 's8', name: 'Starter 8' } },
        { id: 'sub1', type: 'substitution', side: 'our', minute: 60, sequence: 1, out: { player_id: 's3', name: 'Starter 3' }, in: { player_id: 'b1', name: 'Bench 1' }, reason: 'Tattico' },
        { id: 'red1', type: 'sanction', side: 'our', minute: 72, sequence: 2, player: { player_id: 's5', name: 'Starter 5' }, sanction: 'red' },
        { id: 'sub2', type: 'substitution', side: 'our', minute: 80, sequence: 3, out: { player_id: 'b1', name: 'Bench 1' }, in: { player_id: 'b2', name: 'Bench 2' }, reason: 'Gestione' },
        { id: 'yellow', type: 'sanction', side: 'our', minute: 40, sequence: 4, player: { player_id: 's6', name: 'Starter 6' }, sanction: 'yellow' },
        { id: 'second-yellow', type: 'sanction', side: 'our', minute: 75, sequence: 5, player: { player_id: 's7', name: 'Starter 7' }, sanction: 'second_yellow' },
        { id: 'opp-goal', type: 'goal', side: 'opponent', minute: 31, sequence: 6, scorer: { name: 'Opponent' } },
        { id: 'opp-red', type: 'sanction', side: 'opponent', minute: 50, sequence: 7, player: { name: 'Opponent' }, sanction: 'red' },
      ],
    })

    const snapshot = buildCanonicalMatchDataSnapshot(event, { competition: 'Campionato' })
    const minutes = Object.fromEntries(snapshot.playerMinutes.map((item) => [item.playerId, item.minutes]))

    expect(snapshot.source).toBe('calendar-match-center')
    expect(snapshot.minutesFinalized).toBe(true)
    expect(snapshot.matchDuration).toBe(90)
    expect(minutes.s3).toBe(60)
    expect(minutes.b1).toBe(20)
    expect(minutes.b2).toBe(10)
    expect(minutes.s5).toBe(72)
    expect(minutes.s7).toBe(75)
    expect(minutes.s1).toBe(90)
    expect(snapshot.usedPlayers).toBe(13)
    expect(snapshot.totals.minutes).toBe(957)
    expect(snapshot.totals.substitutions).toBe(2)
    expect(snapshot.totals.goals).toBe(1)
    expect(snapshot.totals.assists).toBe(1)
    expect(snapshot.totals.yellowCards).toBe(1)
    expect(snapshot.totals.redCards).toBe(2)
    expect(snapshot.leaders.scorers).toEqual({ 'Starter 9': 1 })
    expect(snapshot.leaders.assists).toEqual({ 'Starter 8': 1 })
    expect(snapshot.goalsFor).toBe(2)
    expect(snapshot.goalsAgainst).toBe(1)
    expect(snapshot.outcome).toBe('win')
  })

  it('non finalizza il minutaggio finché Match Center non è terminato', () => {
    const snapshot = buildCanonicalMatchDataSnapshot(eventWith({
      status: 'in_progress',
      period: 'second_half',
      events: [
        { id: 'sub1', type: 'substitution', side: 'our', minute: 60, sequence: 0, out: { player_id: 's3', name: 'Starter 3' }, in: { player_id: 'b1', name: 'Bench 1' } },
      ],
    }))

    expect(snapshot.minutesFinalized).toBe(false)
    expect(snapshot.playerMinutes).toEqual([])
    expect(snapshot.totals.minutes).toBeNull()
    expect(snapshot.usedPlayers).toBe(12)
  })

  it('riconosce i supplementari quando la timeline supera il 90°', () => {
    const snapshot = buildCanonicalMatchDataSnapshot(eventWith({
      events: [
        { id: 'sub-et', type: 'substitution', side: 'our', minute: 100, sequence: 0, out: { player_id: 's3', name: 'Starter 3' }, in: { player_id: 'b1', name: 'Bench 1' } },
        { id: 'goal-et', type: 'goal', side: 'our', minute: 105, sequence: 1, scorer: { player_id: 'b1', name: 'Bench 1' } },
      ],
    }))

    const minutes = Object.fromEntries(snapshot.playerMinutes.map((item) => [item.playerId, item.minutes]))
    expect(snapshot.matchDuration).toBe(120)
    expect(minutes.s3).toBe(100)
    expect(minutes.b1).toBe(20)
    expect(minutes.s1).toBe(120)
  })

  it('non prende ownership quando match_center non esiste', () => {
    const snapshot = buildCanonicalMatchDataSnapshot({
      id: 'legacy-match',
      rawNotes: JSON.stringify({
        match_squad_snapshot: {
          schema_version: 1,
          starters: [player('s1', 1)],
        },
      }),
    })

    expect(snapshot).toBeNull()
  })
})
