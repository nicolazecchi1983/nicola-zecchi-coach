import fs from 'node:fs'
const view=fs.readFileSync('src/modules/dashboard/dashboardView.js','utf8')
const events=fs.readFileSync('src/app/events/dashboardEvents.js','utf8')
const css=fs.readFileSync('src/modules/dashboard/dashboardPolish.css','utf8')
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const gate='check:dashboard-match-day-quick-access'
const checks=[
 ['active card',view.includes('dashboard-match-item--active')],
 ['three actions',(view.match(/data-dashboard-match-quick=/g)||[]).length===3],
 ['callups route',view.includes('data-dashboard-match-quick="callups"')],
 ['formation route',view.includes('data-dashboard-match-quick="our-team"')],
 ['open match route',view.includes('data-dashboard-match-quick="opponent-study"')],
 ['canonical context write',events.includes("storage?.setItem('staff-active-match'")],
 ['canonical active section',events.includes("storage?.setItem('nz-active-section', section)")],
 ['direct native view',events.includes('await setView(section')],
 ['explicit opponent payload',view.includes('data-match-opponent=')],
 ['dashboard CSS owner',css.includes('.dashboard-match-quick-actions')],
 ['Design System color tokens',css.includes('var(--staff-color-primary)') && css.includes('var(--staff-color-primary-hover)')],
 ['Design System spacing tokens',css.includes('var(--staff-space-2)')],
 ['canonical mobile breakpoint',css.includes('@media (max-width: 760px)') && !css.includes('620px')],
 ['no important escalation',!css.includes('!important')],
 ['npm script registration',pkg.scripts?.[gate]==='node scripts/check-dashboard-match-day-quick-access.mjs'],
 ['canonical suite registration',Array.isArray(pkg.staffCheckSuite) && pkg.staffCheckSuite.includes(gate)],
 ['suite registration unique',Array.isArray(pkg.staffCheckSuite) && pkg.staffCheckSuite.filter(x=>x===gate).length===1],
]
let failed=0
for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failed++}
if(failed)process.exit(1)
console.log('RESULT=PASS '+checks.length+'/'+checks.length)
