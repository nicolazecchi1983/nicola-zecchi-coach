import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

import { deriveMatchCenterOperationalState } from '../../src/modules/match/matchCenterOperationalModel.js'

function baseSnapshot(benchNumber = null) {
  return {
    persisted: true,
    formation: '4-4-2',
    starters: [
      { slot: 0, playerId: 'out', name: 'OUT', shirtNumber: 12 },
    ],
    bench: [
      { slot: 12, playerId: 'in', name: 'IN', shirtNumber: benchNumber },
    ],
  }
}

function substitutionCenter() {
  return {
    persisted: true,
    status: 'in_progress',
    period: 'second_half',
    score: { our: 0, opponent: 0 },
    events: [
      {
        id: 'sub-1',
        type: 'substitution',
        side: 'our',
        minute: 60,
        addedMinute: 0,
        sequence: 1,
        createdAt: '2026-09-03T20:00:00.000Z',
        out: { playerId: 'out', name: 'OUT' },
        in: { playerId: 'in', name: 'IN' },
        reason: 'tactical',
      },
    ],
  }
}

describe('Match Center shirt-number regression', () => {
  it('never inherits the outgoing shirt number when incoming has none', () => {
    const state = deriveMatchCenterOperationalState(baseSnapshot(null), substitutionCenter())
    const incoming = state.currentStarters.find((player) => player.playerId === 'in')

    expect(incoming).toBeTruthy()
    expect(incoming.shirtNumber).toBeNull()
  })

  it('uses the canonical incoming bench shirt number when available', () => {
    const state = deriveMatchCenterOperationalState(baseSnapshot(27), substitutionCenter())
    const incoming = state.currentStarters.find((player) => player.playerId === 'in')

    expect(incoming).toBeTruthy()
    expect(incoming.shirtNumber).toBe(27)
  })

  it('preserves roster player.number before the PRE bench 12-20 fallback', () => {
    const source = fs.readFileSync(
      new URL('../../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url),
      'utf8',
    )

    expect(source).toMatch(
      /shirtNumber:player\?\.shirtNumber\?\?player\?\.shirt_number\?\?player\?\.number\?\?\(index\+12\)/,
    )
  })

  it('persists the 12-20 bench default as canonical PRE match-number data', () => {
    const source = fs.readFileSync(
      new URL('../../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url),
      'utf8',
    )

    expect(source).toContain(
      'shirtNumber:player?.shirtNumber??player?.shirt_number??player?.number??(index+12)',
    )
  })
  it('shows PRE bench position separately from the resolved match number', () => {
    const view = fs.readFileSync(
      new URL('../../src/modules/match/ui/matchSquadView.js', import.meta.url),
      'utf8',
    )
    const runtime = fs.readFileSync(
      new URL('../../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url),
      'utf8',
    )

    expect(view).toContain('>P${index + 1}</span>')
    expect(view).toContain('<b data-bench-shirt-number="${index}">${index + 12}</b>')
    expect(runtime).toContain('assignedNumber ?? (index + 12)')
  })

})
