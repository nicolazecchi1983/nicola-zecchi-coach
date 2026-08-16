import { describe, expect, it } from 'vitest'
import { isLegacyRosterCandidate, shouldUseLegacyRoster } from '../../src/modules/roster/rosterDomain.js'

describe('rosterDomain', () => {
  it('riconosce il roster legacy solo dall’identità squadra prevista', () => {
    expect(isLegacyRosterCandidate({ name: 'Mezzolara' })).toBe(true)
    expect(isLegacyRosterCandidate({ shortName: 'MEZZOLARA 1934' })).toBe(true)
    expect(isLegacyRosterCandidate({ name: 'Altra squadra' })).toBe(false)
  })

  it('usa il fallback legacy solo se il roster persistente è ancora vuoto e non inizializzato', () => {
    expect(shouldUseLegacyRoster({ team: { name: 'Mezzolara' }, totalPersistentPlayers: 0 })).toBe(true)
    expect(shouldUseLegacyRoster({ team: { name: 'Mezzolara', rosterInitialized: true }, totalPersistentPlayers: 0 })).toBe(false)
    expect(shouldUseLegacyRoster({ team: { name: 'Mezzolara' }, totalPersistentPlayers: 1 })).toBe(false)
    expect(shouldUseLegacyRoster({ team: { name: 'Altra squadra' }, totalPersistentPlayers: 0 })).toBe(false)
  })
})
