import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  deriveMatchCenterOperationalState,
  formatMatchCenterMinute,
  matchCenterEventLabel,
  matchCenterPlayerOptions,
} from '../../src/modules/match/matchCenterOperationalModel.js'
import { createMatchCenterEvent } from '../../src/modules/match/matchCenterModel.js'

function snapshot() {
  return {
    persisted: true,
    formation: '4-3-3',
    starters: Array.from({ length: 11 }, (_, index) => ({
      slot: index,
      playerId: `s${index + 1}`,
      name: `Starter ${index + 1}`,
      shirtNumber: index + 1,
      x: 50,
      y: 50,
    })),
    bench: Array.from({ length: 9 }, (_, index) => ({
      slot: index + 12,
      playerId: `b${index + 1}`,
      name: `Bench ${index + 1}`,
      shirtNumber: index + 12,
    })),
  }
}

describe('Match Center operational workspace', () => {
  it('deriva XI corrente dallo snapshot PRE più le sostituzioni', () => {
    const substitution = createMatchCenterEvent({
      type: 'substitution',
      side: 'our',
      minute: 60,
      out: { playerId: 's3', name: 'Starter 3' },
      in: { playerId: 'b1', name: 'Bench 1' },
    }, { id: 'sub-1', sequence: 0 })

    const state = deriveMatchCenterOperationalState(snapshot(), { events: [substitution] })
    expect(state.currentStarters).toHaveLength(11)
    expect(state.starters[2].playerId).toBe('b1')
    expect(state.starters[2].shirtNumber).toBe(12)
    expect(state.currentBench.some((player) => player.playerId === 's3')).toBe(true)
  })

  it('espulsione nostra riduce lo XI corrente senza alterare lo snapshot PRE', () => {
    const base = snapshot()
    const red = createMatchCenterEvent({
      type: 'sanction',
      side: 'our',
      minute: 72,
      player: { playerId: 's5', name: 'Starter 5' },
      sanction: 'red',
    }, { id: 'red-1', sequence: 0 })

    const state = deriveMatchCenterOperationalState(base, { events: [red] })
    expect(state.currentStarters).toHaveLength(10)
    expect(base.starters[4].playerId).toBe('s5')
  })

  it('cambio sistema nostro aggiorna la proiezione senza mutare il PRE', () => {
    const base = snapshot()
    const change = createMatchCenterEvent({
      type: 'formation_change',
      side: 'our',
      minute: 70,
      formation: '4-2-3-1',
    }, { id: 'formation-1', sequence: 0 })

    const state = deriveMatchCenterOperationalState(base, { events: [change] })
    expect(state.formation).toBe('4-2-3-1')
    expect(base.formation).toBe('4-3-3')
  })

  it('eventi avversari restano in timeline ma non modificano il nostro XI/sistema', () => {
    const change = createMatchCenterEvent({
      type: 'formation_change',
      side: 'opponent',
      minute: 40,
      formation: '3-5-2',
    }, { id: 'opp-formation', sequence: 0 })

    const state = deriveMatchCenterOperationalState(snapshot(), { events: [change] })
    expect(state.formation).toBe('4-3-3')
    expect(state.currentStarters).toHaveLength(11)
    expect(state.timeline).toHaveLength(1)
  })

  it('timeline ordina minuto, recupero e sequenza', () => {
    const events = [
      createMatchCenterEvent({ type: 'goal', minute: 45, addedMinute: 2 }, { id: 'b', sequence: 1 }),
      createMatchCenterEvent({ type: 'sanction', minute: 12 }, { id: 'a', sequence: 0 }),
      createMatchCenterEvent({ type: 'goal', minute: 45, addedMinute: 1 }, { id: 'c', sequence: 2 }),
    ]
    const state = deriveMatchCenterOperationalState(snapshot(), { events })
    expect(state.timeline.map((event) => event.id)).toEqual(['a', 'c', 'b'])
    expect(formatMatchCenterMinute(state.timeline[2])).toBe('45+2’')
  })

  it('opzioni giocatore mantengono tutti i 20 partecipanti iniziali', () => {
    const options = matchCenterPlayerOptions(snapshot(), {})
    expect(options).toHaveLength(20)
    expect(new Set(options.map((player) => player.playerId)).size).toBe(20)
  })

  it('label evento resta presentazionale e domain-safe', () => {
    expect(matchCenterEventLabel({ type: 'goal', side: 'our' })).toBe('Gol')
    expect(matchCenterEventLabel({ type: 'formation_change', side: 'opponent' })).toBe('Cambio sistema avversario')
  })

  it('route, shell, service e CSS sono owner nativi e non legacy', () => {
    const workflow = fs.readFileSync('src/modules/match/matchWorkflowModel.js', 'utf8')
    const shell = fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8')
    const view = fs.readFileSync('src/modules/match/ui/matchCenterView.js', 'utf8')
    const runtime = fs.readFileSync('src/modules/match/events/matchCenterEvents.js', 'utf8')
    const controller = fs.readFileSync('src/app/appController.js', 'utf8')
    const session = fs.readFileSync('src/app/appSessionRestore.js', 'utf8')
    const access = fs.readFileSync('src/core/accessControl.js', 'utf8')
    const main = fs.readFileSync('src/main.js', 'utf8')
    const css = fs.readFileSync('src/modules/match/ui/matchCenter.css', 'utf8')

    expect(workflow).toContain("'match-center': 'match-day'")
    expect(shell).toContain("'match-day': 'match-center'")
    expect(shell).toContain("'data-match-workspace': true")
    expect(shell).toContain('data-workspace-action="${MATCH_TEMPORAL_MOMENT_ACTIONS[moment.key]}"')
    expect(view).toContain('matchWorkspaceShellHtml')
    expect(view).toContain('readMatchCenterFromEventNotes')
    expect(view).toContain('readMatchSquadSnapshotFromEventNotes')
    expect(view).not.toContain('nz-match-sheet-editor')
    expect(runtime).toContain('createMatchCenterService')
    expect(runtime).toContain('service.appendEvent')
    expect(runtime).toContain('service.removeEvent')
    expect(controller).toContain("'match-center': matchCenterView")
    expect(controller).toContain("'match-center': ensureCalendarEvents")
    expect(session).toContain("'match-center'")
    expect(access).toContain("'match-center': ACCESS_CAPABILITIES.MATCH_SHEET_VIEW")
    expect(main.indexOf('matchCenter.css')).toBeGreaterThan(-1)
    expect(main.indexOf('matchCenter.css')).toBeLessThan(main.indexOf('responsive.css'))
    expect(css).toContain('@media(max-width:760px)')
  })

  it('composition root resta sotto mille righe', () => {
    const controller = fs.readFileSync('src/app/appController.js', 'utf8')
    expect(controller.split(/\r?\n/).length).toBeLessThan(1000)
  })
})
