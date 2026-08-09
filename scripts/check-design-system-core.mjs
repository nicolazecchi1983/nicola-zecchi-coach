import fs from 'node:fs'

const main = fs.readFileSync('src/main.js','utf8')
const tokens = fs.readFileSync('src/design-system/tokens.css','utf8')
const polish = fs.readFileSync('src/design-system/polish.css','utf8')
const style = fs.readFileSync('src/style.css','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')

const checks = [
  ['Polish layer caricato dopo i moduli legacy', main.indexOf("matchOpponentStudy.css") < main.indexOf("design-system/polish.css")],
  ['Nessuna seconda famiglia token nei layer canonici', !polish.includes('--ui-') && !tokens.includes('--ui-')],
  ['Alias legacy --ui collegati ai token STAFF', style.includes('--ui-border:var(--staff-color-border)') && style.includes('--ui-accent:var(--staff-color-primary)')],
  ['Token STAFF estesi', tokens.includes('--staff-content-max') && tokens.includes('--staff-color-bg-sidebar')],
  ['Topbar strutturale usa il token header canonico', polish.includes('Permanent App Shell') && polish.includes('background: var(--staff-color-bg-header)') && tokens.includes('--staff-color-bg-header: #061522')],
  ['Sidebar nasconde categoria', polish.includes('.sidebar-brand span') && polish.includes('display: none')],
  ['Sidebar usa nome squadra risolto', shell.includes('resolveSidebarTeamName(team)')],
  ['Nome breve troppo corto usa nome squadra', shell.includes('shortName.length >= 5')],
  ['Button system impedisce testo multilinea', polish.includes('white-space: nowrap')],
  ['Form system centralizzato', polish.includes('#viewRoot input:not([type="checkbox"])') && polish.includes('#viewRoot select')],
  ['Focus accessibile centralizzato', polish.includes('var(--staff-shadow-focus)')],
  ['Page rhythm centralizzato', polish.includes('max-width: var(--staff-content-max)')],
  ['Match e Training stepper convergono', polish.includes('.match-step-nav button') && polish.includes('.ts-step-nav button')],
  ['R20.1 non aggiunge !important', !polish.includes('!important')],
  ['Layer provvisorio R20 rimosso da style.css', !style.includes('R20 · UI POLISH 1.0 — FOUNDATION')],
]

let passed=0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode=1 }
}
console.log(`\nDesign System Core: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
