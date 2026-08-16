import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const opp=fs.readFileSync('src/modules/match/events/opponentStudyEvents.js','utf8')
const profile=fs.readFileSync('src/modules/roster/events/playerProfileEvents.js','utf8')
const checks=[
 ['Opponent Study extracted',app.includes("import { wireOpponentStudyEvents }")&&!app.includes('function wireOpponentStudyEvents()')],
 ['Opponent Study service dependencies injected',opp.includes('createMatchOpponentStudyService,')&&opp.includes('getCalendarEvent,')&&opp.includes('updateCalendarEvent,')],
 ['Opponent Study refresh preserved',opp.includes("setView('opponent-study', 'Studio avversario')")],
 ['Player Profile extracted',app.includes("import { wirePlayerProfileEvents }")&&!app.includes('function wirePlayerProfileEvents()')],
 ['UUID-aware player lookup preserved',profile.includes('rosterPlayerIdentity(item) === button.dataset.playerProfile')],
 ['Profile save service injected',profile.includes('savePlayerProfile,')],
 ['Legacy profile-key compatibility preserved',profile.includes('rosterPlayerKey(player)')&&profile.includes('appState.playerProfiles[legacyProfileKey] = saved')],
 ['No Supabase/repository imports',!opp.includes('supabase')&&!profile.includes('supabase')&&!opp.includes('repository')&&!profile.includes('repository')],
 ['Controller composes Opponent Study',app.includes('wireOpponentStudyEvents({')&&app.includes('analysisTemplateOptions,')],
 ['Controller composes Player Profile',app.includes('wirePlayerProfileEvents({')&&app.includes('savePlayerProfile,')],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 7: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
