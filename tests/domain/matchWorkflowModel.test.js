import { describe, expect, it } from 'vitest'
import {
  getMatchWorkflowPhase,
  getMatchWorkflowPhaseLabel,
  getMatchWorkflowSections,
} from '../../src/modules/match/matchWorkflowModel.js'

describe('matchWorkflowModel', () => {
  it('mantiene le sette sezioni canoniche nell’ordine di prodotto', () => {
    expect(getMatchWorkflowSections().map(({ key }) => key)).toEqual([
      'opponent-study',
      'callups',
      'our-team',
      'opponent',
      'analysis',
      'report',
      'post-match',
    ])
  })

  it('deriva pre-match, match-day e post-match dal calendario', () => {
    const match = { date: '2026-09-13', time: '15:30' }
    expect(getMatchWorkflowPhase(match, new Date('2026-09-12T12:00:00'))).toBe('pre-match')
    expect(getMatchWorkflowPhase(match, new Date('2026-09-13T09:00:00'))).toBe('match-day')
    expect(getMatchWorkflowPhase(match, new Date('2026-09-14T09:00:00'))).toBe('post-match')
  })

  it('usa fallback pre-match per date non utilizzabili', () => {
    expect(getMatchWorkflowPhase({}, new Date('2026-09-13T09:00:00'))).toBe('pre-match')
    expect(getMatchWorkflowPhase({ date: 'invalid' }, new Date('2026-09-13T09:00:00'))).toBe('pre-match')
  })

  it('espone label di fase stabili', () => {
    expect(getMatchWorkflowPhaseLabel('pre-match')).toBe('Pre-gara')
    expect(getMatchWorkflowPhaseLabel('match-day')).toBe('Gara')
    expect(getMatchWorkflowPhaseLabel('post-match')).toBe('Post-gara')
    expect(getMatchWorkflowPhaseLabel('unknown')).toBe('Pre-gara')
  })
})
