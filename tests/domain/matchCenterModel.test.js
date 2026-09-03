import { describe, expect, it } from 'vitest'
import {
  appendMatchCenterEvent,
  createMatchCenterEvent,
  mergeMatchCenterIntoEventNotes,
  normalizeMatchCenterState,
  readMatchCenterFromEventNotes,
  removeMatchCenterEvent,
} from '../../src/modules/match/matchCenterModel.js'
import { createMatchCenterService } from '../../src/modules/match/matchCenterService.js'

describe('Match Center domain', () => {
  it('persiste nello stesso match_event preservando gli owner PRE e POST', () => {
    const rawNotes = JSON.stringify({
      type: 'match_event',
      match_squad_snapshot: { formation: '4-3-3' },
      opponent_study: { notes: { strengths: 'Pressione' } },
      post_match: { schema_version: 2 },
      match_report: { result: '1-0' },
    })

    const state = normalizeMatchCenterState({
      status: 'in_progress',
      period: 'first_half',
      score: { our: 0, opponent: 0 },
    })

    const parsed = JSON.parse(mergeMatchCenterIntoEventNotes(rawNotes, state))
    expect(parsed.match_center.schema_version).toBe(1)
    expect(parsed.match_squad_snapshot.formation).toBe('4-3-3')
    expect(parsed.opponent_study.notes.strengths).toBe('Pressione')
    expect(parsed.post_match.schema_version).toBe(2)
    expect(parsed.match_report.result).toBe('1-0')
  })

  it('un goal aggiorna automaticamente lo score canonico', () => {
    const goal = createMatchCenterEvent({
      type: 'goal',
      side: 'our',
      minute: 18,
      scorer: { playerId: 'p9', name: 'Attaccante' },
    }, { id: 'g1', now: '2026-09-03T15:00:00.000Z' })

    const next = appendMatchCenterEvent(normalizeMatchCenterState({}), goal)
    expect(next.score).toEqual({ our: 1, opponent: 0 })
    expect(next.events).toHaveLength(1)
  })

  it('la rimozione di un goal riallinea lo score', () => {
    const goal = createMatchCenterEvent({
      type: 'goal',
      side: 'opponent',
      minute: 31,
    }, { id: 'g2', now: '2026-09-03T15:10:00.000Z' })

    const withGoal = appendMatchCenterEvent(normalizeMatchCenterState({}), goal)
    const withoutGoal = removeMatchCenterEvent(withGoal, 'g2')
    expect(withGoal.score).toEqual({ our: 0, opponent: 1 })
    expect(withoutGoal.score).toEqual({ our: 0, opponent: 0 })
    expect(withoutGoal.events).toHaveLength(0)
  })

  it('mantiene identità giocatore negli eventi', () => {
    const substitution = createMatchCenterEvent({
      type: 'substitution',
      minute: 62,
      out: { playerId: 'p8', name: 'A' },
      in: { playerId: 'p14', name: 'B' },
      reason: 'Tattico',
    }, { id: 's1', now: '2026-09-03T16:00:00.000Z' })

    const notes = mergeMatchCenterIntoEventNotes('{}', appendMatchCenterEvent(normalizeMatchCenterState({}), substitution))
    const restored = readMatchCenterFromEventNotes(notes)
    expect(restored.events[0].out.playerId).toBe('p8')
    expect(restored.events[0].in.playerId).toBe('p14')
  })

  it('il service rilegge sempre il Calendar event fresco e aggiorna lo stesso ID', async () => {
    let notes = JSON.stringify({ type: 'match_event', opponent: 'Ravenna' })
    let reads = 0
    let writes = 0
    const writtenIds = []

    const service = createMatchCenterService({
      getEvent: async (id) => {
        reads += 1
        return { id, notes }
      },
      updateEvent: async (id, patch) => {
        writes += 1
        writtenIds.push(id)
        notes = patch.notes
        return { id }
      },
      now: () => '2026-09-03T17:00:00.000Z',
      createId: () => 'goal-service',
    })

    await service.setMatchState('match-1', {
      status: 'in_progress',
      period: 'first_half',
      score: { our: 0, opponent: 0 },
    })
    await service.appendEvent('match-1', {
      type: 'goal',
      side: 'our',
      minute: 7,
    })

    expect(reads).toBe(2)
    expect(writes).toBe(2)
    expect(writtenIds).toEqual(['match-1', 'match-1'])
    expect(JSON.parse(notes).match_center.score).toEqual({ our: 1, opponent: 0 })
  })

  it('una correzione manuale esplicita dello score resta possibile', async () => {
    let notes = JSON.stringify({
      type: 'match_event',
      match_center: {
        schema_version: 1,
        status: 'finished',
        period: 'full_time',
        score: { our: 1, opponent: 0 },
        events: [],
      },
    })

    const service = createMatchCenterService({
      getEvent: async (id) => ({ id, notes }),
      updateEvent: async (_id, patch) => { notes = patch.notes },
      now: () => '2026-09-03T18:00:00.000Z',
    })

    await service.setMatchState('match-2', { score: { our: 2, opponent: 1 } })
    expect(JSON.parse(notes).match_center.score).toEqual({ our: 2, opponent: 1 })
  })
})
