import fs from 'node:fs'

const main = fs.readFileSync('src/main.js', 'utf8')
const owner = fs.readFileSync('src/modules/settings/teamSettings.css', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')

const legacyOwner = /\.(?:team-settings|team-brand|team-color)[\w-]*/

const checks = [
  ['Team Settings owner is loaded', main.includes("./modules/settings/teamSettings.css")],
  ['Owner loads after profile and before shared controls', main.indexOf('profile.css') < main.indexOf('teamSettings.css') && main.indexOf('teamSettings.css') < main.indexOf('controls.css')],
  ['Team settings card is canonically owned', owner.includes('.team-settings-card{') || owner.includes('.team-settings-card {')],
  ['Team identity preview is canonically owned', owner.includes('.team-brand-preview{') || owner.includes('.team-brand-preview {')],
  ['Team color controls are canonically owned', owner.includes('.team-color-palette{') || owner.includes('.team-color-palette {')],
  ['Logo upload remains in team owner', owner.includes('.team-logo-upload') && owner.includes('input[type="file"]')],
  ['Responsive two-to-one column behavior retained', owner.includes('@media(max-width:900px)') && owner.includes('.team-settings-section-grid,.team-appearance-grid{grid-template-columns:1fr}')],
  ['Mobile sticky actions retained', owner.includes('position:sticky') && owner.includes('safe-area-inset-bottom')],
  ['Legacy style no longer owns Team Settings selectors', !legacyOwner.test(legacy)],
  ['Canonical owner introduces no important escalation', !owner.includes('!important')],
  ['Team owner does not own callups or Board', !owner.includes('.callups-') && !owner.includes('.board-')],
  ['Team owner stays domain-scoped', !owner.includes('.match-editor') && !owner.includes('.training-')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS Legacy Cleanup Pass 17: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
