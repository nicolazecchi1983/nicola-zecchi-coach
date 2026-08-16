import fs from 'node:fs'

const compatibilityView = fs.readFileSync('src/modules/match/ui/legacyMatchCompatibilityView.js','utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const sharedTokenCss = fs.readFileSync('src/shared/ui/teamToken.css','utf8')
const matchLibraryCss = fs.readFileSync('src/modules/match/ui/matchLibrary.css','utf8')
const tokenComponent = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.js','utf8')
const tokenCss = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css','utf8')

const checks = [
  ['own-team step receives configured primary color', compatibilityView.includes("teamPrimaryColor: team.primaryColor") && squad.includes('--own-token-primary')],
  ['own-team step receives configured secondary color', compatibilityView.includes("teamSecondaryColor: team.secondaryColor") && squad.includes('--own-token-secondary')],
  ['own-team step receives configured kit pattern', compatibilityView.includes("teamKitPattern: team.kitPattern") && squad.includes('data-own-token-pattern')],
  ['solid own tokens resolve configured colors through canonical renderer', squad.includes('--staff-token-primary') && squad.includes('--staff-token-secondary') && sharedTokenCss.includes('--staff-token-primary-resolved')],
  ['vertical own tokens use canonical shared kit renderer', squad.includes('data-staff-token-pattern') && sharedTokenCss.includes('[data-staff-token-pattern="vertical"] .staff-match-token__shell')],
  ['horizontal own tokens use canonical shared kit renderer', squad.includes('data-staff-token-pattern') && sharedTokenCss.includes('[data-staff-token-pattern="horizontal"] .staff-match-token__shell')],
  ['captain dropdown reads actual lineup selects', legacy.includes("querySelectorAll('.lineup-row select[name^=\"starter_\"]')") && legacy.includes('currentStarterEntries')],
  ['captain dropdown refreshes after hydration frame', legacy.includes('requestFrame(refreshLeadershipSelects)')],
  ['captain and vice retain canonical form fields', squad.includes('name="captain" data-leadership-select="captain"') && squad.includes('name="vice_captain" data-leadership-select="vice_captain"')],
  ['token content uses shared compact three-option control', squad.includes('tokenDisplayControlHtml') && tokenComponent.includes('name="token_number"') && tokenComponent.includes('name="token_surname"') && tokenComponent.includes('name="token_photo"')],
  ['mobile token content keeps the three options in a stable three-column row', tokenCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));')],
  ['desktop Match Library toolbar balances search and filters', matchLibraryCss.includes('minmax(340px, 1.2fr) repeat(3, minmax(190px, .8fr))')],
]
let passed=0
for(const [label,ok] of checks){ console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nM1.3H Match Team Runtime Fixes: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
