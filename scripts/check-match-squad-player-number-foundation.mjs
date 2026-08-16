import fs from 'node:fs'

const rosterView = fs.readFileSync('src/modules/roster/ui/rosterModalViews.js', 'utf8')
const rosterService = fs.readFileSync('src/modules/roster/rosterService.js', 'utf8')
const rosterDomain = fs.readFileSync('src/modules/roster/rosterService.js', 'utf8')
const schema = fs.readFileSync('supabase/20260808_team_roster_foundation.sql', 'utf8')
const squadView = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')

const checks = [
  ['persistent roster already owns optional shirt_number', schema.includes('shirt_number integer')],
  ['roster UI labels seasonal number as optional', rosterView.includes('Numero maglia stagionale') && rosterView.includes('roster-field-label-row') && rosterView.includes('Opzionale')],
  ['roster save accepts null number and validates 1-99 when present', rosterService.includes("shirtNumber = normalized.number === '' || normalized.number == null ? null") && rosterService.includes('Number.isInteger(shirtNumber)')],
  ['active roster prevents duplicate assigned seasonal number', rosterService.includes('Number(row.shirt_number) === shirtNumber') && rosterService.includes('ROSTER_SHIRT_NUMBER_CONFLICT')],
  ['player identity remains independent from shirt number', rosterDomain.includes('export function rosterPlayerIdentity(player)') && rosterDomain.includes('player?.id || rosterPlayerKey(player)')],
  ['starter default match numbers are 1 through 11', squadView.includes('Array.from({ length: 11 }, (_, index) => index + 1)')],
  ['starter number is a compact 1-99 match input, not a native 99-option dropdown', squadView.includes('class="starter-number-input"') && squadView.includes('inputmode="numeric"') && squadView.includes('maxlength="2"') && !squadView.includes('class="starter-number-select"')],
  ['player options carry optional seasonal shirt number metadata', squadView.includes('data-shirt-number')],
  ['player selection can drive match number', runtime.includes('syncStarterNumberFromPlayer') && runtime.includes('playerAssignedShirtNumber')],
  ['number selection can drive unique player', runtime.includes('syncStarterPlayerFromNumber') && runtime.includes('uniquePlayerForShirtNumber')],
  ['unassigned or ambiguous number remains a valid match-only number', runtime.includes('matches.length === 1 ? matches[0] : null') && runtime.includes('if (!player || starterUsesPlayerElsewhere')],
  ['bench number follows seasonal assignment with 12-20 fallback', squadView.includes('data-bench-slot-number') && runtime.includes('assignedNumber ?? (index + 12)')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Player Number Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
