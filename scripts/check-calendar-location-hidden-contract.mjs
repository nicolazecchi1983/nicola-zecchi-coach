import fs from 'node:fs'

const eventViews = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js','utf8')
const runtime = fs.readFileSync('src/modules/calendar/events/calendarRuntimeActions.js','utf8')
const style = fs.readFileSync('src/modules/calendar/calendarEventPresentation.css','utf8')

const checks = [
  ['location select wrapper has a dedicated data hook', (eventViews.match(/data-location-select-field/g) || []).length >= 2],
  ['free venue mode hides the select wrapper in runtime', runtime.includes('locationSelectField.hidden = usesFreeVenue || isRest')],
  ['CSS force-hides the select wrapper despite generic label display rules', style.includes('[data-location-select-field][hidden],') && style.includes('display: none !important;')],
  ['custom free-text venue remains independently controlled', runtime.includes('customLocationField.hidden = !(usesFreeVenue || isCustomTraining)')],
  ['match venue remains optional', runtime.includes('customLocationInput.required = Boolean(isCustomTraining)')],
  ['create/edit still persist one canonical location', (runtime.match(/location: location \|\| null/g) || []).length >= 2],
]

let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nCalendar location hidden contract: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
