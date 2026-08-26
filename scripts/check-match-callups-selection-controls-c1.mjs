import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createCallupsDirtyState, shouldTrackCallupsInteraction } from '../src/modules/match/events/callupsEvents.js'
const view=fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const events=fs.readFileSync('src/modules/match/events/callupsEvents.js','utf8')
const css=fs.readFileSync('src/modules/match/ui/callups.css','utf8')
const model=fs.readFileSync('src/modules/match/matchCallupsModel.js','utf8')
const service=fs.readFileSync('src/modules/match/matchCallupsService.js','utf8')
const state = createCallupsDirtyState('A')
const behavior = []
try { assert.equal(state.isDirty(), false); behavior.push(['behavior initial state is clean', true]) } catch { behavior.push(['behavior initial state is clean', false]) }
try { assert.equal(state.onUserSelection('B'), true); behavior.push(['behavior real selection change becomes dirty', true]) } catch { behavior.push(['behavior real selection change becomes dirty', false]) }
try { assert.equal(state.onUserSelection('A'), false); behavior.push(['behavior reverting to baseline becomes clean', true]) } catch { behavior.push(['behavior reverting to baseline becomes clean', false]) }
try { state.onUserSelection('B'); assert.equal(state.commit('B', 'B'), false); behavior.push(['behavior successful save rebases submitted selection', true]) } catch { behavior.push(['behavior successful save rebases submitted selection', false]) }
try { state.onUserSelection('C'); assert.equal(state.commit('B', 'C'), true); behavior.push(['behavior edits during save remain dirty', true]) } catch { behavior.push(['behavior edits during save remain dirty', false]) }
try { assert.equal(shouldTrackCallupsInteraction({ type: 'change', isTrusted: true }), false); behavior.push(['behavior trusted lifecycle change is not sufficient to mark dirty', true]) } catch { behavior.push(['behavior trusted lifecycle change is not sufficient to mark dirty', false]) }
try { assert.equal(shouldTrackCallupsInteraction({ type: 'click', isTrusted: false }), false); behavior.push(['behavior synthetic click is not a user edit', true]) } catch { behavior.push(['behavior synthetic click is not a user edit', false]) }
try { assert.equal(shouldTrackCallupsInteraction({ type: 'click', isTrusted: true }), true); behavior.push(['behavior trusted click is a user edit', true]) } catch { behavior.push(['behavior trusted click is a user edit', false]) }
try { state.onUserSelection('Z'); assert.equal(state.reset('Q'), false); assert.equal(state.isDirty(), false); behavior.push(['behavior hydration reset establishes clean baseline', true]) } catch { behavior.push(['behavior hydration reset establishes clean baseline', false]) }

const checks=[
 ['redundant Lista convocati retired',!view.includes('Lista convocati')],
 ['redundant full-roster instruction retired',!view.includes('Tutta la rosa parte selezionata')],
 ['redundant inner CONVOCAZIONI eyebrow retired',!view.includes('<span>CONVOCAZIONI</span>')],
 ['structural callups-head owner preserved',view.includes('callups-head callups-selection-bar')&&css.includes('.callups-head,')],
 ['old copy-specific callups-head CSS retired',!css.includes('.callups-head h2')&&!css.includes('.callups-head p')&&!css.includes('.callups-head span')],
 ['select-all exists',view.includes('data-callups-select-all')],
 ['clear-all exists',view.includes('data-callups-clear-all')],
 ['counter restores persisted selection',view.includes('activePlayers.filter(isSelected).length')],
 ['bulk controls wired',events.includes("selectAllButton?.addEventListener('click'")&&events.includes("clearAllButton?.addEventListener('click'")],
 ['zero selections saveable when match exists',!events.includes('saveButton.disabled = selected.length === 0 || !activeMatch?.id')&&events.includes('saveButton.disabled = !activeMatch?.id')],
 ['zero selections disable PDF only',events.includes('pdfButton.disabled = selected.length === 0')],
 ['service accepts empty arrays',service.includes('async save(matchId, players = [])')],
 ['persisted empty snapshot remains valid',model.includes('persisted: Boolean(persisted)')&&model.includes('persisted: exists')],
 ['persisted empty snapshot filters Nostra squadra',model.includes('if (!callups?.persisted) return rosterPlayers')&&model.includes('return rosterPlayers.filter')],
 ['dirty state is explicit state controller',events.includes('createCallupsDirtyState')&&events.includes('dirtyState.isDirty()')],
 ['dirty state only tracks trusted click activation',events.includes('shouldTrackCallupsInteraction(event)')&&events.includes("event?.type === 'click'")&&events.includes('event?.isTrusted !== false')],
 ['checkbox change refreshes UI without arming dirty state',events.includes("check.addEventListener('change', updateCallups)")&&!events.includes("check.addEventListener('change', handleUserSelectionActivation)")],
 ['checkbox click is the explicit dirty-state boundary',events.includes("check.addEventListener('click', handleUserSelectionActivation)")],
 ['callups event wiring is idempotent',events.includes("dataset.callupsEventsWired === 'true'")&&events.includes("dataset.callupsEventsWired = 'true'")],
 ['initial render cannot mark dirty by DOM comparison',!events.includes('const dirty = selectionKey() !== cleanSelectionKey')],
 ['alert is explicitly neutralized before event wiring',events.includes('alertEl.hidden = true')&&events.includes("alertEl.textContent = ''")],
 ['successful save commits exact submitted selection',events.includes('dirtyState.commit(selectionKeyToSave, selectionKey())')],
 ['compact mobile keeps both bulk actions together',/@media \(max-width: 520px\)[\s\S]*?\.callups-bulk-actions[\s\S]*?grid-template-columns:\s*1fr 1fr/.test(css)],
 ...behavior,
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C3-R8 Callups Dirty State Integrity: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
