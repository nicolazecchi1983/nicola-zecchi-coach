import fs from 'node:fs'

const eventViews = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')

const refreshStart = runtime.indexOf('const refresh = () => {')
const refreshEnd = runtime.indexOf('typeSelect.addEventListener', refreshStart)
const refreshBlock = runtime.slice(refreshStart, refreshEnd)

const checks = [
  ['Match/Meeting replace location selector with custom venue option', runtime.includes(`locationSelect.innerHTML = '<option value="__custom__">Inserisci luogo…</option>'`)],
  ['custom venue input exists in create modal', eventViews.includes('name="customLocation"') && eventViews.includes('data-custom-location hidden')],
  ['custom venue is optional for matches and required only for custom training venue', runtime.includes('customLocationInput.required = Boolean(isCustomTraining)')],
  ['event-type refresh re-evaluates custom venue visibility', refreshBlock.includes('refreshLocationOptions()') && refreshBlock.includes('refreshLocation()')],
  ['submit resolves __custom__ to typed venue', runtime.includes(`locationChoice === '__custom__' ? customLocation : locationChoice`)],
  ['create persists resolved location', runtime.includes('location: location || null')],
  ['edit persists resolved location', (runtime.match(/location: location \|\| null/g) || []).length >= 2],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nCalendar custom match venue: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
