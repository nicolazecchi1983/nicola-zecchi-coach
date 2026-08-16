import fs from 'node:fs'
import { findOfficialSeasonCalendar } from '../src/modules/calendar/officialSeasonCalendarRegistry.js'

const view = fs.readFileSync('src/modules/calendar/ui/seasonCalendarImportView.js','utf8')
const app = fs.readFileSync('src/app/appController.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const data = JSON.parse(fs.readFileSync('src/data/officialCalendars/lnd-serie-d-2026-27-girone-e.json','utf8'))
const source = findOfficialSeasonCalendar({
  name: data.teamAliases[0],
  shortName: data.teamAliases[1],
  season: '2026/27',
  category: 'Serie D',
  competitionGroup: 'E',
})

const checks = [
  ['official source matches configured competition context', Boolean(source)],
  ['official source contains 34 matches', source?.rows?.length === 34],
  ['first fixture is home on official opening date', source?.rows?.[0]?.date === '2026-09-06' && source?.rows?.[0]?.homeAway === 'home'],
  ['return leg reverses first fixture', source?.rows?.[17]?.date === '2027-01-06' && source?.rows?.[17]?.homeAway === 'away'],
  ['season ends on 2 May 2027', source?.rows?.[33]?.date === '2027-05-02'],
  ['all rows are league fixtures', source?.rows?.every((row) => row.competition === 'Campionato')],
  ['source is unavailable for a different group', findOfficialSeasonCalendar({ name:data.teamAliases[0],season:'2026/27',category:'Serie D',competitionGroup:'D' }) === null],
  ['view exposes official-source preview action', view.includes('data-use-official-season-calendar')],
  ['preview repeats the kickoff-time warning', view.includes('season-import-preview-warning') && view.includes("sourceMode === 'official'")],
  ['file picker keeps established PDF/image/CSV contract', view.includes('application/pdf') && view.includes('image/png') && view.includes('text/csv')],
  ['controller uses source registry instead of team-specific branching', runtime.includes('findOfficialSeasonCalendar(team)') && runtime.includes("openSeasonCalendarImport(officialSource.rows, 'official')")],
  ['team-specific source values live in JSON, not executable calendar code', !app.toLocaleLowerCase('it-IT').includes(data.teamAliases[0].toLocaleLowerCase('it-IT'))],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nOfficial Season Calendar: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
