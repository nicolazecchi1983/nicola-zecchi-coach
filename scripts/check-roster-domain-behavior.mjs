import assert from 'node:assert/strict'
import { shouldUseLegacyRoster } from '../src/modules/roster/rosterDomain.js'

const legacyTeam = { id: 'legacy-team', name: 'Mezzolara Calcio', shortName: 'Mezzolara', rosterInitialized: false }
const initializedLegacyTeam = { ...legacyTeam, rosterInitialized: true }
const otherTeam = { id: 'other-team', name: 'Nuova Squadra', shortName: 'NS', rosterInitialized: true }

assert.equal(
  shouldUseLegacyRoster({ team: legacyTeam, totalPersistentPlayers: 0 }),
  true,
  'La vecchia squadra Mezzolara non ancora migrata deve poter leggere il fallback legacy.',
)

assert.equal(
  shouldUseLegacyRoster({ team: legacyTeam, totalPersistentPlayers: 27 }),
  false,
  'La presenza di record persistenti, anche se tutti inattivi, deve disabilitare definitivamente il fallback legacy.',
)

assert.equal(
  shouldUseLegacyRoster({ team: initializedLegacyTeam, totalPersistentPlayers: 0 }),
  false,
  'Una Rosa inizializzata e volontariamente vuota non deve far riapparire il legacy.',
)

assert.equal(
  shouldUseLegacyRoster({ team: otherTeam, totalPersistentPlayers: 0 }),
  false,
  'Una nuova squadra deve partire con Rosa vuota e non deve mai ricevere giocatori Mezzolara.',
)

console.log('Roster Domain Behavior: 4/4 OK')
