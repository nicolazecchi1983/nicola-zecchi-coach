import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { deriveMatchCenterOperationalState } from '../../src/modules/match/matchCenterOperationalModel.js'

describe('Match Center initial state regression', () => {
  it('preserves the persisted PRE snapshot ownership flag', () => {
    const starters = Array.from({ length: 11 }, (_, index) => ({
      slot: index,
      playerId: `p-${index}`,
      name: `Player ${index}`,
      shirtNumber: index + 1,
      x: 10,
      y: 10,
    }))

    const state = deriveMatchCenterOperationalState({
      formation: '4-3-3',
      starters,
      bench: [],
      persisted: true,
    }, {})

    expect(state.snapshotPersisted).toBe(true)
    expect(state.currentStarters).toHaveLength(11)
    expect(state.formation).toBe('4-3-3')
  })

  it('keeps an absent PRE snapshot empty and non-persisted', () => {
    const state = deriveMatchCenterOperationalState({}, {})

    expect(state.snapshotPersisted).toBe(false)
    expect(state.currentStarters).toHaveLength(0)
  })

  it('namespaces Match Center state controls and disables browser restoration', () => {
    const view = readFileSync(new URL('../../src/modules/match/ui/matchCenterView.js', import.meta.url), 'utf8')
    const events = readFileSync(new URL('../../src/modules/match/events/matchCenterEvents.js', import.meta.url), 'utf8')

    expect(view).toContain('data-match-center-state-form autocomplete="off"')
    expect(view).toContain('name="match_center_status" autocomplete="off"')
    expect(view).toContain('name="match_center_period" autocomplete="off"')
    expect(view).toContain('name="match_center_score_our" autocomplete="off"')
    expect(view).toContain('name="match_center_score_opponent" autocomplete="off"')
    expect(view).not.toContain('name="status"')
    expect(view).not.toContain('name="period"')

    expect(events).toContain('stateForm.elements.match_center_status?.value')
    expect(events).toContain('stateForm.elements.match_center_period?.value')
    expect(events).toContain("integerField(stateForm, 'match_center_score_our')")
    expect(events).toContain("integerField(stateForm, 'match_center_score_opponent')")
  })
})
