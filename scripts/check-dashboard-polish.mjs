import fs from 'node:fs'

const css = fs.readFileSync('src/modules/dashboard/dashboardPolish.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const view = fs.readFileSync('src/modules/dashboard/dashboardView.js', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')

const checks = [
  ['dashboard polish has a dedicated page owner', main.includes("./modules/dashboard/dashboardPolish.css")],
  ['dashboard owner loads after shared overlays', main.indexOf("./design-system/overlays.css") < main.indexOf("./modules/dashboard/dashboardPolish.css")],
  ['dashboard owner stays before responsive final', main.indexOf("./modules/dashboard/dashboardPolish.css") < main.indexOf("./design-system/responsive.css")],
  ['primary dashboard grid gives more space to match context', css.includes('1.15fr') && css.includes('.dashboard-primary-grid')],
  ['weekly calendar is visually lighter than primary summaries', css.includes('.dashboard-week-card') && css.includes('border-top: 1px solid var(--staff-color-border-subtle)') && css.includes('background: transparent')],
  ['mobile calendar becomes an agenda instead of seven compressed columns', css.includes('@media (max-width: 760px)') && css.includes('grid-template-columns: 58px minmax(0, 1fr)')],
  ['mobile agenda keeps event title and metadata visible', css.includes('.dashboard-day button span,') && css.includes('.dashboard-day button small') && css.includes('display: block')],
  ['training history is a data-list rather than nested cards', css.includes('.dashboard-training-history button') && css.includes('border-top: 1px solid var(--staff-color-border-subtle)') && css.includes('border-radius: 0')],
  ['dashboard interactions preserve existing event hooks', view.includes('data-open-event=') && view.includes('data-dashboard-calendar')],
  ['dashboard polish consumes Design System tokens only', !/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(css)],
  ['dashboard polish introduces no important overrides', !css.includes('!important')],
  ['dashboard polish uses only canonical responsive tiers', [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].every(([, bp]) => ['760', '980'].includes(bp))],
  ['legacy emergency dashboard mobile important ownership removed', !/\.dashboard-primary-grid[\s\S]{0,500}!important/.test(legacy)],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS2.1 Dashboard Polish: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
