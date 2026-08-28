import { describe, expect, it } from 'vitest'
import { findMatchLineupDuplicatePlayers, sortMatchLineupPlayers } from '../../src/modules/match/matchLineupSelectionModel.js'

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

  it('detects duplicate identity across starters and bench', () => {
    expect(findMatchLineupDuplicatePlayers({
      starters: ['Mario Rossi', 'Luca Verdi', ''],
      bench: ['Paolo Neri', 'Mario Rossi'],
    })).toEqual(['Mario Rossi'])
  })

  it('ignores empty slots and returns every duplicated player once', () => {
    expect(findMatchLineupDuplicatePlayers({
      starters: ['A', 'A', 'B'],
      bench: ['', 'B', 'B'],
    })).toEqual(['A', 'B'])
  })
})
