import fs from 'node:fs'

const tokens = fs.readFileSync('src/design-system/tokens.css', 'utf8')
const css = fs.readFileSync('src/design-system/typographyDensity.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['Typography density layer esiste', css.includes('DS1.6 Typography & Information Density')],
  ['Typography layer è caricato dopo surfaces', main.indexOf("surfaces.css") < main.indexOf("typographyDensity.css")],
  ['Typography layer precede responsive finale', main.indexOf("typographyDensity.css") < main.indexOf("responsive.css")],
  ['Foundation possiede line-height heading', tokens.includes('--staff-line-height-heading: 1.2;')],
  ['Foundation possiede line-height secondary', tokens.includes('--staff-line-height-secondary: 1.42;')],
  ['Titoli sezione convergono sui token', css.includes('font-size: var(--staff-font-section-title);') && css.includes('var(--staff-line-height-heading)')],
  ['Supporting copy usa ruolo secondary', css.includes('font-size: var(--staff-font-secondary);') && css.includes('var(--staff-line-height-secondary)')],
  ['Metadata usa caption canonica', css.includes('font-size: var(--staff-font-caption);')],
  ['Numeri usano tabular nums', css.includes('font-variant-numeric: tabular-nums;')],
  ['Match section marker è quieto e tokenizzato', css.includes('.match-editor .section-title > span') && css.includes('background: var(--staff-color-bg-panel-raised);')],
  ['Touch target non viene ridotto dalla density layer', !css.includes('min-height: 32px') && !css.includes('min-height: 36px') && !css.includes('min-height: 40px')],
  ['Nessun important o colore raw nel nuovo layer', !css.includes('!important') && !/#(?:[0-9a-fA-F]{3,8})\b/.test(css)],
  ['Responsive usa breakpoint canonico 760', css.includes('@media (max-width: 760px)') && !css.includes('@media (max-width: 720px)')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`DS1.6 Typography & Information Density: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
