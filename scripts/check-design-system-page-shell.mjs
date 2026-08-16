import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const pageShell = read('src/design-system/pageShell.css')
const main = read('src/main.js')
const tokens = read('src/design-system/tokens.css')

const checks = [
  ['page shell layer exists', pageShell.includes('DS1.2 Page Shell & Visual Hierarchy')],
  ['page shell loaded after Product UI', main.indexOf("productUi.css") < main.indexOf("pageShell.css")],
  ['page shell loaded before final responsive layer', main.indexOf("pageShell.css") < main.indexOf("responsive.css")],
  ['canonical page root uses content max token', pageShell.includes('max-width: var(--staff-content-max)')],
  ['page header consumes page title token', pageShell.includes('font-size: var(--staff-font-page-title)')],
  ['page metadata consumes secondary typography token', pageShell.includes('font-size: var(--staff-font-secondary)')],
  ['page header spacing consumes STAFF spacing scale', pageShell.includes('--staff-page-header-gap: var(--staff-space-4)')],
  ['canonical shared section header exists', pageShell.includes('.staff-section-head')],
  ['mobile page hierarchy has explicit adaptive layout', pageShell.includes('@media (max-width: 760px)') && pageShell.includes('flex-direction: column')],
  ['no raw hex colors in page shell', !/#(?:[0-9a-fA-F]{3}){1,2}\b/.test(pageShell)],
  ['no important escalation in page shell', !pageShell.includes('!important')],
  ['foundation page widths remain token-owned', tokens.includes('--staff-content-readable:') && tokens.includes('--staff-content-standard:') && tokens.includes('--staff-product-content-max:')],
]

let passed=0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nDS1.2 Page Shell & Visual Hierarchy: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
