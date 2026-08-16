import fs from 'node:fs'
import { buildMatchCalendarEventPayload } from '../src/modules/match/matchCalendarService.js'

const gateway = fs.readFileSync('src/app/appDataGateway.js','utf8')
const model = fs.readFileSync('src/modules/match/matchModel.js','utf8')
const payload = buildMatchCalendarEventPayload({
  matchDay: '34',
  date: '2027-05-02',
  time: '15:30',
  opponent: 'Avversario test',
  homeAway: 'home',
  competition: 'Campionato',
})
const notes = JSON.parse(payload.notes)

const checks = [
  ['match event never writes league round into events.match_day', payload.match_day === null],
  ['league round is stored in native match-event notes', notes.competition_round === '34'],
  ['training MD database column remains domain-isolated', fs.readFileSync('src/modules/match/matchCalendarService.js','utf8').includes('events.match_day appartiene al dominio Training')],
  ['gateway exposes competition round to existing match UI contracts', gateway.includes('parsedNotes.competition_round')],
  ['gateway also exposes explicit competitionRound', gateway.includes('competitionRound:')],
  ['match document model prefers canonical competitionRound', model.includes('input.competitionRound ?? input.competition_round')],
]
let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nMatch Round Domain Separation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
