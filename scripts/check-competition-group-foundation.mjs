import fs from 'node:fs'
const profile=fs.readFileSync('src/services/teamProfile.js','utf8')
const settings=fs.readFileSync('src/modules/settings/teamSettingsView.js','utf8')
const calendar=fs.readFileSync('src/modules/calendar/ui/calendarView.js','utf8')
const importer=fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8')
const checks=[
 ['Profilo espone competitionGroup', profile.includes('competitionGroup') && profile.includes('competition_group')],
 ['Impostazioni espongono Girone', settings.includes('name=\"competitionGroup\"') && settings.includes('<span>Girone</span>')],
 ['Calendario mostra Girone dinamico', calendar.includes('team.competitionGroup') && calendar.includes('GIRONE')],
 ['Import calendario riceve contesto squadra', importer.includes('team.competitionGroup') && importer.includes('team.season')],
]
let failed=false
for(const [label,ok] of checks){ console.log(`${ok?'✓':'✗'} ${label}`); if(!ok) failed=true }
if(failed) process.exit(1)
