import fs from 'node:fs'

const main = fs.readFileSync('src/main.js', 'utf8')
const owner = fs.readFileSync('src/modules/match/ui/callups.css', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const surfaces = fs.readFileSync('src/design-system/surfaces.css', 'utf8')
const controls = fs.readFileSync('src/design-system/controls.css', 'utf8')

const legacyCallupsOwner = /\.(?:callups-(?:panel|head|counter|toolbar|alert|list|role-groups|role-group)|callup-player)\b/

const checks = [
  ['Convocazioni owner is loaded', main.includes("./modules/match/ui/callups.css")],
  ['Owner loads immediately after legacy stylesheet to preserve cascade', main.indexOf("./style.css") < main.indexOf('callups.css') && main.indexOf('callups.css') < main.indexOf('matchSheet.css')],
  ['Panel and header are canonically owned', owner.includes('.callups-panel') && owner.includes('.callups-head')],
  ['Toolbar and selected counter are canonically owned', owner.includes('.callups-toolbar') && owner.includes('.callups-counter')],
  ['Role grouping is canonically owned', owner.includes('.callups-role-groups') && owner.includes('.callups-role-group > header')],
  ['Player rows are canonically owned', owner.includes('.callup-player') && owner.includes(':has(input:checked)')],
  ['Existing 900px layout behavior is retained', owner.includes('@media (max-width: 900px)') && owner.includes('.callups-list { grid-template-columns: 1fr; }')],
  ['Legacy style no longer owns Convocazioni selectors', !legacyCallupsOwner.test(legacy)],
  ['Shared surface layer still owns neutral panel convergence', surfaces.includes('.callups-panel')],
  ['Shared controls layer still owns callups field labels', controls.includes('.callups-toolbar label')],
  ['Callups mobile geometry converges to owner with only approved late overrides',
    owner.includes('@media (max-width: 760px)') &&
    owner.includes('.callups-head') &&
    owner.includes('.callups-counter') &&
    !responsive.includes('.callups-counter {') &&
    !responsive.includes('.callups-toolbar-actions button') &&
    responsive.includes('.callups-head > div') &&
    /\.callups-bulk-button\s*\{[^}]*min-height:\s*44px;[^}]*font-size:\s*\.72rem;[^}]*\}/s.test(responsive)
  ],
  ['Owner does not absorb Board or Match Sheet responsibilities', !owner.includes('.board-') && !owner.includes('.match-score') && !owner.includes('.opponent-')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS Legacy Cleanup Pass 18: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
