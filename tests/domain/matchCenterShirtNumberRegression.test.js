import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

import { deriveMatchCenterOperationalState } from '../../src/modules/match/matchCenterOperationalModel.js'
import { renderMatchSquadStep } from '../../src/modules/match/ui/matchSquadView.js'

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

  it('persists the editable PRE bench match number instead of deriving it from roster or slot', () => {
    const source = fs.readFileSync(
      new URL('../../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url),
      'utf8',
    )

    expect(source).toContain('shirtNumber:form.elements[`bench_number_${index}`]?.value||null')
    expect(source).not.toContain('shirtNumber:player?.shirtNumber??player?.shirt_number??player?.number??(index+12)')
  })

  it('does not impose a canonical 12-20 bench number when no match number was chosen', () => {
    const view = fs.readFileSync(
      new URL('../../src/modules/match/ui/matchSquadView.js', import.meta.url),
      'utf8',
    )
    const runtime = fs.readFileSync(
      new URL('../../src/modules/match/events/legacyMatchEditorEvents.js', import.meta.url),
      'utf8',
    )

    expect(view).toContain('name="bench_number_${index}"')
    expect(view).toContain('value="" placeholder="—"')
    expect(runtime).not.toContain('assignedNumber ?? (index + 12)')
    expect(runtime.match(/if \(!String\(numberField\.value \|\| ''\)\.trim\(\) && assignedNumber != null\)/g)).toHaveLength(2)
    expect(runtime).toContain("const raw = String(control.value || '').trim()")
    expect(runtime).toContain("control.value = ''")
    expect(runtime).toContain("number: form.elements[`bench_number_${index}`]?.value || ''")
    expect(runtime).not.toContain('number: form.elements[`bench_number_${index}`]?.value || String(index + 12)')
  })

  it('never falls back to a second full-roster option source when saved callups are empty', () => {
    const html = renderMatchSquadStep({
      teamName: 'STAFF',
      formationOptions: '<option>4-4-2</option>',
      rosterPlayers: [],
      rosterOptions: '<option value="legacy-player">LEGACY PLAYER</option>',
    })

    expect(html).not.toContain('LEGACY PLAYER')
    expect(html).not.toContain('legacy-player')
  })

  it('shows bench position separately from the editable match-number input', () => {
    const view = fs.readFileSync(
      new URL('../../src/modules/match/ui/matchSquadView.js', import.meta.url),
      'utf8',
    )

    expect(view).toContain('class="bench-slot-order">P${index + 1}</span>')
    expect(view).toContain('class="bench-number-input"')
    expect(view).toContain('data-bench-select="${index}"')
    expect(view).not.toContain('data-bench-shirt-number')
  })
})
