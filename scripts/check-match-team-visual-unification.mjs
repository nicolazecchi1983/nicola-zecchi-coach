import fs from 'node:fs'

const ui = fs.readFileSync('src/design-system/uiComponents.js','utf8')
const settings = fs.readFileSync('src/modules/settings/teamSettingsView.js','utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const workspace = fs.readFileSync('src/modules/match/ui/matchWorkspaceView.js','utf8')
const native = fs.readFileSync('src/modules/match/ui/matchNativeSectionView.js','utf8')
const compatibilityView = fs.readFileSync('src/modules/match/ui/legacyMatchCompatibilityView.js','utf8')
const opponentView = fs.readFileSync('src/modules/match/ui/matchOpponentView.js','utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css','utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')
const style = fs.readFileSync('src/style.css','utf8')
const sharedTokenCss = fs.readFileSync('src/shared/ui/teamToken.css','utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const tokenMarkup = fs.readFileSync('src/modules/match/ui/matchTokenMarkup.js','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')

const checks = [
  ['shared color picker component exists', ui.includes('export function colorPickerHtml')],
  ['team settings use shared picker twice', (settings.match(/colorPickerHtml\(/g) || []).length === 2],
  ['opponent uses shared picker twice', (opponentView.match(/colorPickerHtml\(\{ name: 'opponent_token_/g) || []).length === 2],
  ['nine swatches stay on one row desktop/mobile', style.includes('repeat(9,30px)') && style.includes('repeat(9,28px)')],
  ['custom color stays separate below swatches', style.includes('.staff-color-custom') && style.includes('margin-top:9px')],
  ['captain and vice are dropdowns', squad.includes('data-leadership-select="captain"') && squad.includes('data-leadership-select="vice_captain"')],
  ['dropdowns are populated from current starting XI', legacy.includes('refreshLeadershipSelects') && legacy.includes('starter_${index}')],
  ['canonical leadership fields remain on visible selectors', squad.includes('name="captain" data-leadership-select="captain"') && squad.includes('name="vice_captain" data-leadership-select="vice_captain"')],
  ['workspace own-team label uses configured identity', workspace.includes("section.key === 'our-team' ? ourName : section.label")],
  ['native Match nav receives configured team name through shell', native.includes('teamName: ownTeamName') && native.includes('matchWorkspaceShellHtml')],
  ['own/opponent surfaces share mobile width contract', responsive.includes('.match-native-legacy-host--our-team') && responsive.includes('.match-native-legacy-host--opponent')],
  ['token visual language is shared through one canonical Match renderer', sharedTokenCss.includes('.staff-match-token__shell') && tokenMarkup.includes('matchTokenShellHtml') && squad.includes('matchTokenShellHtml') && opponentView.includes('matchTokenShellHtml')],
  ['captain highlight remains cyan rather than gold', squadCss.includes('background: #38bdf8;') && !squadCss.includes('background: #ffd66b;')],
]

let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok) passed++
}
console.log(`\nM1.3G Match Team Visual Unification: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
