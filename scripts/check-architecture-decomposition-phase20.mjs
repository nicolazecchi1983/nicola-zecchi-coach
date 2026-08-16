import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const rosterViews = fs.readFileSync('src/modules/roster/ui/rosterModalViews.js', 'utf8')
const teamEvents = fs.readFileSync('src/modules/team/events/teamRosterEvents.js', 'utf8')
const profileEvents = fs.readFileSync('src/modules/roster/events/playerProfileEvents.js', 'utf8')

const checks = [
  ['Roster modal view factory physically extracted', rosterViews.includes('export function createRosterModalViews')],
  ['Controller composes roster modal factory', app.includes('createRosterModalViews({')],
  ['Player Profile markup no longer lives in controller', !app.includes('class="new-event-modal player-profile-modal"') && rosterViews.includes('class="new-event-modal player-profile-modal"')],
  ['Roster Player markup no longer lives in controller', !app.includes('class="new-event-modal roster-player-modal"') && rosterViews.includes('class="new-event-modal roster-player-modal"')],
  ['Persistent and legacy player identity remain injected', app.includes('rosterPlayerIdentity,') && app.includes('rosterPlayerKey,')],
  ['Team/Roster event owner still receives modal builder', teamEvents.includes('rosterPlayerModalHtml')],
  ['Player Profile event owner still receives modal builder', profileEvents.includes('playerProfileModalHtml')],
  ['Roster modal view has no Supabase dependency', !rosterViews.includes('supabase')],
  ['Roster modal view has no event wiring', !rosterViews.includes('addEventListener(')],
  ['Controller falls below one thousand lines', app.split('\n').length < 1000],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nArchitecture Decomposition Phase 20: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
