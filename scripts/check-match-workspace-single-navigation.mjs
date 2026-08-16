import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchWorkspaceView.js','utf8')
const style = fs.readFileSync('src/style.css','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8')

const checks = [
  ['workflow navigation remains present', view.includes('class="match-workspace-tabs"')],
  ['workflow sections still come from model', view.includes('getMatchWorkflowSections()')],
  ['duplicated workspace grid removed', !view.includes('match-workspace-grid')],
  ['duplicated workspace cards removed', !view.includes('match-workspace-card')],
  ['dead grid CSS removed', !style.includes('match-workspace-grid')],
  ['dead card CSS removed', !style.includes('match-workspace-card')],
  ['dead responsive card reference removed', !responsive.includes('match-workspace-card')],
  ['workspace actions remain route-based', view.includes('data-workspace-action=')],
  ['view remains persistence-neutral', !view.includes('supabase') && !view.includes('storage.setItem')],
  ['contract records single navigation source', contract.includes('single visible index of match sections')],
]

let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok) passed++
}
console.log(`\nM1.3E Match Workspace single navigation: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
