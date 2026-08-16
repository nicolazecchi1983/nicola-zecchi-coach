import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const team=fs.readFileSync('src/modules/team/events/teamRosterEvents.js','utf8')
const checks=[
 ['Team/Roster physically extracted',app.includes("import { wireTeamAndRosterEvents }")&&!app.includes('function wireTeamAndRosterEvents()')],
 ['Team settings navigation preserved',team.includes('data-open-team-settings')&&team.includes('data-open-team-roster')],
 ['Logo validation preserved',team.includes("image/png")&&team.includes('2 * 1024 * 1024')],
 ['Facilities add/remove preserved',team.includes('data-add-team-facility')&&team.includes('data-remove-team-facility')],
 ['Team profile persistence injected',team.includes('saveTeamProfile')&&team.includes('replaceTeamFacilities')],
 ['Roster create/edit/remove preserved',team.includes('data-roster-create')&&team.includes('data-roster-edit')&&team.includes('data-roster-remove')],
 ['Persistent player identity preserved',team.includes('rosterPlayerIdentity(item)')],
 ['Soft-remove service remains injected',team.includes('removeRosterPlayer')],
 ['Historical-data warning preserved',team.includes('dati storici delle partite resteranno invariati')],
 ['No Supabase/repository import',!team.includes('supabase')&&!team.includes('repository')&&!team.includes('import ')],
 ['Controller remains composition root',app.includes('wireTeamAndRosterEvents({')&&app.includes('saveRosterPlayer,')&&app.includes('removeRosterPlayer,')],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 6: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
