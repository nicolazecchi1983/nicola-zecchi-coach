import fs from 'node:fs'

const view = fs.readFileSync('src/modules/settings/teamSettingsView.js', 'utf8')
const css = fs.readFileSync('src/modules/settings/teamSettings.css', 'utf8')
const events = fs.readFileSync('src/modules/team/events/teamRosterEvents.js', 'utf8')
const doc = fs.readFileSync('docs/TEAM_TOKEN_AND_SETTINGS_ARCHITECTURE.md', 'utf8')

const checks = [
  ['settings has semantic Identity section', view.includes('team-identity-heading') && view.includes('Dati squadra')],
  ['settings has semantic Appearance section', view.includes('team-appearance-heading') && view.includes('Identità visiva')],
  ['identity fields live inside their section grid', view.includes('team-settings-section-grid team-settings-identity-grid')],
  ['appearance fields live inside a dedicated grid', view.includes('team-settings-section-grid team-appearance-grid')],
  ['appearance keeps primary and secondary color as sibling fields', view.indexOf("name: 'primaryColor'") < view.indexOf("name: 'secondaryColor'") && view.indexOf("name: 'secondaryColor'") < view.indexOf('class="team-appearance-final-row')],
  ['kit style and premium preview are one intentional row', view.includes('class="team-appearance-final-row') && view.includes('class="team-kit-control"') && view.includes('data-team-token-preview')],
  ['desktop section grids use two equal columns', css.includes('.team-settings-section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))') && css.includes('.team-appearance-grid{grid-template-columns:repeat(2,minmax(0,1fr))')],
  ['semantic sections have their own surface owner', css.includes('.team-settings-section{') && css.includes('.team-settings-section-head{')],
  ['responsive collapses semantic grids to one column', css.includes('.team-settings-section-grid,.team-appearance-grid{grid-template-columns:1fr}')],
  ['preview refresh preserves shared token classes', events.includes('staff-team-token staff-team-token--preview')],
  ['facilities remain full-width after semantic sections', view.indexOf('team-facilities-field') > view.indexOf('team-appearance-grid')],
  ['architecture document forbids root-grid append-only growth', doc.includes('New fields must be placed inside the correct semantic section')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed++
}
console.log(`\nTeam Settings Grid v2: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
