import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const component = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const settings = fs.readFileSync('src/modules/settings/teamSettingsView.js', 'utf8')
const doc = fs.readFileSync('docs/MATCH_TOKEN_APPEARANCE_ARCHITECTURE.md', 'utf8')

const checks = [
  ['Nostra squadra consumes shared token display component', view.includes("tokenDisplayControlHtml") && !view.includes('class="token-display-options"')],
  ['shared component owns canonical three visibility fields', component.includes('name="token_number"') && component.includes('name="token_surname"') && component.includes('name="token_photo"')],
  ['shared component is not scoped to own-team page', component.includes('match-token-display') && !component.includes('match-squad-step')],
  ['toggle presentation is compact rather than one large nested control surface', css.includes('.match-token-toggle') && css.includes('height: 40px;') && !css.includes('border-radius: 13px;\n  background: rgba(8, 29, 42, .70);')],
  ['active toggle has explicit visual state', css.includes(':has(input:checked)') && css.includes("content: '✓'" )],
  ['keyboard focus is visible', css.includes(':has(input:focus-visible)')],
  ['shared component css is loaded after squad owner', main.indexOf("matchSquad.css") >= 0 && main.indexOf("matchTokenDisplayControl.css") > main.indexOf("matchSquad.css")],
  ['own-team appearance remains configured in team settings', settings.includes("name: 'primaryColor'") && settings.includes("name: 'secondaryColor'") && settings.includes('name="kitPattern"')],
  ['architecture separates display content from token appearance', doc.includes('Token Display Control') && doc.includes('Token Appearance Source') && doc.includes('Token Renderer')],
  ['own-team settings are the global appearance source', doc.includes('global defaults come from `Impostazioni → Squadra`')],
  ['opponent appearance is explicitly match-scoped', doc.includes('appearance is match-scoped')],
  ['foundation does not introduce important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Token Display Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
