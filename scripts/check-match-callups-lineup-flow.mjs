import fs from 'node:fs'
const read = (path) => fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const model = read('src/modules/match/matchCallupsModel.js')
const service = read('src/modules/match/matchCallupsService.js')
const view = read('src/modules/match/ui/callupsView.js')
const events = read('src/modules/match/events/callupsEvents.js')
const squad = read('src/modules/match/ui/matchSquadView.js')
const legacy = read('src/modules/match/events/legacyMatchEditorEvents.js')
const lineupModel = read('src/modules/match/matchLineupSelectionModel.js')
const controller = read('src/app/appController.js')
const adapters = read('src/app/appViewAdapters.js')
const gateway = read('src/app/appDataGateway.js')
const checks = [
 ['callups have canonical event-notes model', model.includes('match_callups') && model.includes('mergeMatchCallupsIntoEventNotes')],
 ['callups preserve player identity', model.includes('playerId') && model.includes('shirtNumber')],
 ['callups service rereads fresh event before save', service.includes('await getEvent(matchId)') && service.includes('updateEvent(event.id')],
 ['callups save reloads canonical Calendar', service.includes("typeof reloadEvents === 'function'")],
 ['callups view restores persisted selection', view.includes('savedCallups') && view.includes('isPersisted')],
 ['callups UI exposes explicit save action', view.includes('data-callups-save')],
 ['callups save is wired to canonical service', events.includes('service.save(activeMatch.id')],
 ['Nostra squadra roster is filtered by saved callups', model.includes('createActiveMatchRosterSelector') && model.includes('filterRosterBySavedCallups') && controller.includes('createActiveMatchRosterSelector') && controller.includes('getActiveMatchRosterPlayers')],
 ['unsaved callups do not leak full Rosa into Formation', model.includes('if (!callups?.persisted) return []') && !squad.includes('rosterOptions')],
 ['callups have one canonical maximum of 20', model.includes('MATCH_CALLUPS_MAX_PLAYERS = 20') && service.includes('assertMatchCallupsLimit') && events.includes('MATCH_CALLUPS_MAX_PLAYERS')],
 ['Distinta owns 11 starter plus 9 editable bench slots without a derived bench owner', lineupModel.includes('MATCH_LINEUP_STARTER_COUNT = 11') && lineupModel.includes('MATCH_LINEUP_MAX_BENCH = MATCH_CALLUPS_MAX_PLAYERS - MATCH_LINEUP_STARTER_COUNT') && lineupModel.includes('findMatchLineupDuplicatePlayers') && !lineupModel.includes('deriveMatchLineupBench') && squad.includes('data-bench-select') && squad.includes('bench_number_${index}') && !squad.includes('rosterOptions') && legacy.includes("const name = player ? selectedName : ''") && !legacy.includes('updateDerivedBench')],
 ['Nostra squadra exposes Team Manager PDF action', squad.includes('data-match-lineup-pdf')],
 ['formation PDF reads canonical starter count', legacy.includes('MATCH_LINEUP_STARTER_COUNT') && legacy.includes('starter_number_')],
 ['formation PDF reads editable bench player and match number', legacy.includes('MATCH_LINEUP_MAX_BENCH') && legacy.includes('bench_number_${index}') && legacy.includes('bench_${index}')],
 ['formation PDF blocks duplicate player assignments', legacy.includes('Correggi i giocatori duplicati prima di creare il PDF formazione.')],
 ['formation PDF omits tactical module and preserves leadership', !legacy.includes('Modulo ${escapeHtml(formation)}') && legacy.includes('CAPITANO') && legacy.includes('VICECAPITANO')],
 ['formation PDF uses shared print engine', legacy.includes('await printHtmlDocument')],
 ['callups consume canonical Calendar rawNotes through one event reader', gateway.includes('rawNotes: event.notes || null') && model.includes('export function readMatchCallupsFromEvent') && model.includes("event?.rawNotes ?? event?.notes ?? ''") && model.includes('readMatchCallupsFromEvent(event)') && service.includes('readMatchCallupsFromEvent(eventOrNotes)') && controller.includes('readMatchCallupsFromEvent') && adapters.includes('readMatchCallupsFromEvent(eventModel)') && !adapters.includes('eventModel?.notes')],
]
let failed=0
for (const [label,ok] of checks){ console.log(`${ok?'PASS':'FAIL'}  ${label}`); if(!ok) failed++ }
if(failed) process.exit(1)
console.log(`R3.3 Callups -> Distinta -> TM PDF: ${checks.length}/${checks.length}`)
