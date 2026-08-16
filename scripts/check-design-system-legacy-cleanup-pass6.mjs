import fs from 'node:fs'

const legacy = fs.readFileSync('src/style.css', 'utf8')
const owner = fs.readFileSync('src/modules/calendar/calendarPolish.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const bulkOwner = fs.readFileSync('src/modules/calendar/calendarBulkManagement.css', 'utf8')

const legacyCalendarOwners = [
  '.calendar-toolbar--clean {',
  '.calendar-today-button {',
  '.calendar-today-button--prominent {',
  '.calendar-cell.is-today {',
  '.calendar-event--training {',
  '.calendar-event--meeting {',
  '.calendar-event--rest {',
  '.calendar-actions-menu__panel{',
  '.calendar-actions-menu__panel {',
  '.calendar-actions-menu>summary{',
]

const checks = [
  ['legacy style no longer owns calendar toolbar/today/event visuals', legacyCalendarOwners.every((selector) => !legacy.includes(selector))],
  ['calendar owner owns toolbar geometry', owner.includes('.calendar-toolbar--clean {') && owner.includes('grid-template-columns: var(--staff-control-height-compact) auto var(--staff-control-height-compact)')],
  ['calendar owner owns today action', owner.includes('.calendar-today-button,') && owner.includes('.calendar-today-button--prominent')],
  ['calendar owner owns event category rails', owner.includes('.calendar-event--training {') && owner.includes('.calendar-event--meeting {') && owner.includes('.calendar-event--rest {')],
  ['calendar owner owns actions menu shell', owner.includes('.calendar-actions-menu {') && owner.includes('position: relative')],
  ['calendar owner owns actions menu popup geometry', owner.includes('.calendar-actions-menu__panel {') && owner.includes('position: absolute') && owner.includes('z-index: 30')],
  ['calendar owner loads after legacy style', main.indexOf("./style.css") < main.indexOf("./modules/calendar/calendarPolish.css")],
  ['calendar owner loads before final responsive layer', main.indexOf("./modules/calendar/calendarPolish.css") < main.indexOf("./design-system/responsive.css")],
  ['calendar owner introduces no important overrides', !owner.includes('!important')],
  ['calendar owner uses only canonical responsive tiers', [...owner.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].every(([, bp]) => ['980', '760'].includes(bp))],
  ['legacy V5.5 calendar visual generation no longer survives', !legacy.includes('V5.5 — Header mobile, pulsante Oggi e profilo') || (!legacy.includes('calendar-today-button') && !legacy.includes('calendar-toolbar--clean'))],
  ['R19.2 bulk domain has a dedicated owner without re-owning actions menu visuals', bulkOwner.includes('.calendar-bulk-form') && !bulkOwner.includes('.calendar-actions-menu__panel{') && !legacy.includes('.calendar-bulk-form')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nDS Legacy Cleanup Pass 6: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
