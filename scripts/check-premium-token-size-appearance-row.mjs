import fs from 'node:fs'

const shared = fs.readFileSync('src/shared/ui/teamToken.css', 'utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const settingsCss = fs.readFileSync('src/modules/settings/teamSettings.css', 'utf8')
const settingsView = fs.readFileSync('src/modules/settings/teamSettingsView.js', 'utf8')
const doc = fs.readFileSync('docs/TEAM_TOKEN_AND_SETTINGS_ARCHITECTURE.md', 'utf8')

const checks = [
  ['field token canonical size is 36px', shared.includes('.staff-team-token {') && shared.includes('--staff-token-size: 36px;')],
  ['settings preview canonical size is 38px', shared.includes('.staff-team-token--preview {') && shared.includes('--staff-token-size: 38px;')],
  ['own-team consumer does not redefine physical size', !squadCss.includes('--staff-token-size:')],
  ['opponent consumer does not redefine physical size', !opponentCss.includes('--staff-token-size:')],
  ['settings consumer does not redefine physical size', !settingsCss.includes('--staff-token-size:')],
  ['appearance final row spans both appearance columns', settingsView.includes('team-appearance-final-row team-settings-span-2') && settingsCss.includes('.team-appearance-final-row{') && settingsCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))')],
  ['kit and logo are sibling appearance blocks', settingsView.includes('team-appearance-block team-kit-block') && settingsView.includes('team-appearance-block team-logo-upload')],
  ['kit control aligns select and preview on one control row', settingsCss.includes('.team-kit-control{display:grid;grid-template-columns:minmax(0,1fr) 64px') && settingsCss.includes('height:56px')],
  ['appearance sibling blocks share equal minimum height', settingsCss.includes('.team-appearance-block{') && settingsCss.includes('min-height:132px') && settingsCss.includes('grid-template-rows:auto 56px auto')],
  ['responsive collapses final appearance row without offsets', settingsCss.includes('.team-appearance-final-row{grid-column:auto;grid-template-columns:1fr}') && !settingsCss.includes('transform: translate')],
  ['architecture documents shared size ownership', doc.includes('Match field token: `36px`') && doc.includes('Settings preview token: `38px`')],
  ['architecture forbids contextual token size redefinition', doc.includes('Context owners must not redefine `--staff-token-size`')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed++
}
console.log(`\nPremium Token Size + Appearance Row: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
