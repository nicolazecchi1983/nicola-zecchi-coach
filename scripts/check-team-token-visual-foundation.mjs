import fs from 'node:fs'

const shared = fs.readFileSync('src/shared/ui/teamToken.css', 'utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const settings = fs.readFileSync('src/modules/settings/teamSettingsView.js', 'utf8')
const tokenMarkup = fs.readFileSync('src/modules/match/ui/matchTokenMarkup.js', 'utf8')
const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const opponentCss = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const globalCss = fs.readFileSync('src/style.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const doc = fs.readFileSync('docs/TEAM_TOKEN_AND_SETTINGS_ARCHITECTURE.md', 'utf8')

const checks = [
  ['shared premium token shell exists', shared.includes('.staff-team-token') && shared.includes('outline:') && shared.includes('inset 0 -7px 12px')],
  ['canonical Match token markup helper exists', tokenMarkup.includes('matchTokenShellHtml') && tokenMarkup.includes('staff-match-token__shell') && tokenMarkup.includes('staff-match-token__number')],
  ['own-team field tokens consume canonical Match shell', squad.includes('matchTokenShellHtml') && squad.includes("shellClass: 'token-photo'")],
  ['opponent field tokens consume canonical Match shell', opponent.includes('matchTokenShellHtml') && opponent.includes("numberClass: 'opponent-token-number'")],
  ['opponent preview consumes shared physical shell', opponent.includes('opponent-token-mini-preview staff-team-token')],
  ['settings preview consumes shared physical shell', settings.includes('staff-team-token staff-team-token--preview')],
  ['field kit patterns are rendered only by shared foundation', shared.includes('[data-staff-token-pattern="vertical"] .staff-match-token__shell') && shared.includes('[data-staff-token-pattern="horizontal"] .staff-match-token__shell')],
  ['own-team consumer no longer renders kit gradients', !squadCss.includes('repeating-linear-gradient') && !squadCss.includes('data-own-token-pattern="vertical"')],
  ['opponent field consumer no longer renders token kit gradients', !opponentCss.includes('.match-opponent-step .opponent-token {\n  background:')],
  ['shared token css loads before native match owners', main.indexOf("shared/ui/teamToken.css") >= 0 && main.indexOf("shared/ui/teamToken.css") < main.indexOf("matchSquad.css") && main.indexOf("shared/ui/teamToken.css") < main.indexOf("matchOpponent.css")],
  ['legacy global css no longer owns own-team token appearance', !globalCss.includes('.match-squad-step .token-photo') && !globalCss.includes('data-own-token-pattern')],
  ['shared shell resolves contextual colors through generic variables', shared.includes('--staff-token-primary-resolved') && shared.includes('--staff-token-secondary-resolved')],
  ['architecture document records canonical renderer ownership', doc.includes('canonical Match token shell markup') && doc.includes('same `staff-match-token__shell`')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed++
}
console.log(`\nTeam Token Visual Foundation: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
