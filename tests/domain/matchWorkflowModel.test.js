import { describe, expect, it } from 'vitest'
import {
  getMatchWorkflowPhase,
  getMatchWorkflowPhaseLabel,
  getMatchPostUtilities,
  getMatchWorkflowSections,
  getMatchWorkflowSectionsForSection,
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

  it('espone Statistiche e GPS come utility POST senza creare sezioni aggiuntive', () => {
    expect(getMatchPostUtilities()).toEqual([
      expect.objectContaining({ key: 'statistics', route: 'match-statistics' }),
      expect.objectContaining({ key: 'gps', route: 'match-gps' }),
    ])
    expect(getMatchWorkflowSections()).toHaveLength(7)
    expect(getMatchWorkflowSectionsForSection('match-gps').map(({ key }) => key)).toEqual(['analysis', 'report', 'post-match'])
  })

  it('deriva la navigazione contestuale dal momento senza barra globale a sette', () => {
    expect(getMatchWorkflowSectionsForSection('callups').map(({ key }) => key)).toEqual([
      'opponent-study', 'callups', 'our-team', 'opponent',
    ])
    expect(getMatchWorkflowSectionsForSection('match-center')).toEqual([])
    expect(getMatchWorkflowSectionsForSection('analysis').map(({ key }) => key)).toEqual([
      'analysis', 'report', 'post-match',
    ])
    expect(getMatchWorkflowSectionsForSection('match-report-workspace').map(({ key }) => key)).toEqual([
      'analysis', 'report', 'post-match',
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
