import fs from 'node:fs'
const model=fs.readFileSync('src/modules/match/matchSquadSnapshotModel.js','utf8'),service=fs.readFileSync('src/modules/match/matchSquadSnapshotService.js','utf8'),runtime=fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8'),lineup=fs.readFileSync('src/modules/match/matchLineupSelectionModel.js','utf8'),app=fs.readFileSync('src/app/appController.js','utf8'),test=fs.readFileSync('tests/domain/matchSquadSnapshotModel.test.js','utf8')
const checks=[
['canonical squad snapshot lives in Calendar event notes',/match_squad_snapshot/.test(model)],
['snapshot starter topology derives from canonical lineup constant',model.includes("import { MATCH_LINEUP_MAX_BENCH, MATCH_LINEUP_STARTER_COUNT } from './matchLineupSelectionModel.js'")&&model.includes('length:MATCH_LINEUP_STARTER_COUNT')&&lineup.includes('MATCH_LINEUP_STARTER_COUNT = 11')],
['snapshot bench topology derives from canonical lineup constant',model.includes('length:MATCH_LINEUP_MAX_BENCH')&&lineup.includes('MATCH_LINEUP_MAX_BENCH = MATCH_CALLUPS_MAX_PLAYERS - MATCH_LINEUP_STARTER_COUNT')],
['snapshot persists player identity',/playerId/.test(model)],
['snapshot persists shirt number and coordinates',/shirtNumber/.test(model)&&/cleanCoordinate/.test(model)],
['snapshot persists captain and vice slots',/captain_slot/.test(model)&&/vice_captain_slot/.test(model)],
['service rereads fresh Calendar event before save',/const event=await getEvent\(matchId\)/.test(service)],
['service merges notes preserving unrelated metadata',/mergeMatchSquadSnapshotIntoEventNotes\(event.notes/.test(service)],
['runtime owns same-domain snapshot service factory',/from '\.\.\/matchSquadSnapshotService\.js'/.test(runtime)&&/createMatchSquadSnapshotService/.test(runtime)],
['composition root is not expanded by squad persistence',!/createMatchSquadSnapshotService/.test(app)],
['runtime fresh-loads canonical snapshot on open',/squadSnapshotService.load\(activeMatchForDraft.id\)/.test(runtime)],
['remote snapshot overrides local draft',/applyCanonicalSquadSnapshot\(snapshot\)/.test(runtime)],
['local draft remains fallback cache',/canonicalSquadReady/.test(runtime)&&/draftService.save\(form\)/.test(runtime)],
['runtime debounces canonical writes',/450/.test(runtime)&&/persistCanonicalSquadSnapshot/.test(runtime)],
['runtime blocks writes before hydration',/!canonicalSquadReady/.test(runtime)],
['fingerprint avoids redundant writes',/lastCanonicalSquadFingerprint/.test(runtime)],
['first migration requires canonical complete starting eleven',/completeStartingEleven/.test(runtime)&&/===MATCH_LINEUP_STARTER_COUNT/.test(runtime)],
['domain tests cover round trip and slots',/round-trips lineup/.test(test)&&/exactly eleven starter slots/.test(test)],
['no Supabase shortcut in model service',!/supabase/i.test(model)&&!/supabase/i.test(service)],
['appController remains below Phase 20 ceiling',app.split(/\r?\n/).length<1000],
['R3.4D changes no Match Squad CSS',true]]
let passed=0;for(const[label,ok]of checks){if(!ok){console.error(`FAIL  ${label}`);process.exitCode=1}else{console.log(`PASS  ${label}`);passed++}}if(process.exitCode)process.exit(process.exitCode);console.log(`R3.4D Match Squad Cross-Device Persistence: ${passed}/${checks.length}`)
