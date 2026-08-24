import fs from 'node:fs'
const model = fs.readFileSync('src/modules/match/matchCallupsModel.js','utf8')
const service = fs.readFileSync('src/modules/match/matchCallupsService.js','utf8')
const view = fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const events = fs.readFileSync('src/modules/match/events/callupsEvents.js','utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js','utf8')
const checks = [
 ['callups have canonical event-notes model', model.includes('match_callups') && model.includes('mergeMatchCallupsIntoEventNotes')],
 ['callups preserve player identity', model.includes('playerId') && model.includes('shirtNumber')],
 ['callups service rereads fresh event before save', service.includes('await getEvent(matchId)') && service.includes('updateEvent(event.id')],
 ['callups save reloads canonical Calendar', service.includes("typeof reloadEvents === 'function'")],
 ['callups view restores persisted selection', view.includes('savedCallups') && view.includes('isPersisted')],
 ['callups UI exposes explicit save action', view.includes('data-callups-save')],
 ['callups save is wired to canonical service', events.includes('service.save(activeMatch.id')],
 ['Nostra squadra roster is filtered by saved callups', model.includes('createActiveMatchRosterSelector') && model.includes('filterRosterBySavedCallups') && controller.includes('createActiveMatchRosterSelector') && controller.includes('getActiveMatchRosterPlayers')],
 ['no-snapshot fallback keeps full roster', model.includes('if (!callups?.persisted) return rosterPlayers')],
 ['Nostra squadra exposes Team Manager PDF action', squad.includes('data-match-lineup-pdf')],
 ['formation PDF reads eleven starters', legacy.includes('Array.from({ length: 11 }') && legacy.includes('starter_number_')],
 ['formation PDF reads bench', legacy.includes('Array.from({ length: 9 }') && legacy.includes('bench_')],
 ['formation PDF includes module and leadership', legacy.includes('Modulo ${escapeHtml(formation)}') && legacy.includes('CAPITANO') && legacy.includes('VICECAPITANO')],
 ['formation PDF uses shared print engine', legacy.includes('await printHtmlDocument')],
 ['callups adapter reads same Calendar event', adapters.includes('readMatchCallupsFromEventNotes(eventModel?.notes')],
]
let failed=0
for (const [label,ok] of checks){ console.log(`${ok?'PASS':'FAIL'}  ${label}`); if(!ok) failed++ }
if(failed) process.exit(1)
console.log(`R3.3 Callups -> Lineup -> TM PDF: ${checks.length}/${checks.length}`)
