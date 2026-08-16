import fs from 'node:fs'

const css = fs.readFileSync('src/modules/calendar/calendarPolish.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const view = fs.readFileSync('src/modules/calendar/ui/calendarView.js', 'utf8')

const media = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((match) => match[1])

const checks = [
  ['calendar polish has a dedicated domain owner', main.includes("./modules/calendar/calendarPolish.css")],
  ['calendar owner loads after dashboard polish', main.indexOf("./modules/dashboard/dashboardPolish.css") < main.indexOf("./modules/calendar/calendarPolish.css")],
  ['calendar owner stays before responsive final', main.indexOf("./modules/calendar/calendarPolish.css") < main.indexOf("./design-system/responsive.css")],
  ['desktop month remains a seven-column planning grid owned by calendar polish', css.includes('.calendar-grid') && css.includes('grid-template-columns: repeat(7, minmax(0, 1fr))') && view.includes('<div class="calendar-weekdays"')],
  ['month surface uses quiet Design System borders and surfaces', css.includes('.calendar-panel') && css.includes('var(--staff-color-border-subtle)') && css.includes('var(--staff-color-bg-panel)')],
  ['event blocks use low-noise surfaces with a category rail', css.includes('.calendar-event') && css.includes('border-left: 2px solid var(--staff-color-primary)') && css.includes('var(--staff-color-bg-panel-raised)')],
  ['mobile calendar becomes a vertical agenda', css.includes('@media (max-width: 760px)') && css.includes('.calendar-grid') && css.includes('display: block') && css.includes('grid-template-columns: 64px minmax(0, 1fr)')],
  ['mobile agenda does not render adjacent-month filler days', css.includes('.calendar-cell.is-muted') && css.includes('display: none')],
  ['mobile agenda exposes weekday context explicitly', view.includes('calendar-cell-weekday') && view.includes("{ weekday: 'short' }")],
  ['calendar cells retain create and open event hooks', view.includes('data-create-event-date=') && view.includes('data-open-event=')],
  ['today and actions remain separate operational controls', view.includes('data-calendar-today') && view.includes('data-calendar-actions-menu')],
  ['calendar polish consumes Design System tokens only', !/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(css)],
  ['calendar polish introduces no important overrides', !css.includes('!important')],
  ['calendar polish uses only canonical responsive tiers', media.every((bp) => ['760', '980'].includes(bp))],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.2 Calendar Polish: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
