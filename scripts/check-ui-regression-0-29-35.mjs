import fs from 'node:fs'

const shell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const markup = fs.readFileSync('src/modules/match/ui/matchPitchMarkup.js', 'utf8')
const squad = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')

const checks = [
  ['sidebar remains vertically scrollable', /\.sidebar-nav\s*\{[\s\S]*?overflow-y:\s*auto;/.test(shell)],
  ['desktop sidebar scrollbar is visually hidden', /\.sidebar-nav\s*\{[\s\S]*?scrollbar-width:\s*none;/.test(shell) && /\.sidebar-nav::\-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/.test(shell)],
  ['desktop sidebar no longer reserves scrollbar gutter', !/\.sidebar-nav\s*\{[\s\S]*?scrollbar-gutter:\s*stable;/.test(shell)],
  ['mobile drawer remains vertically scrollable', /\.mobile-drawer-nav\s*\{[\s\S]*?overflow-y:\s*auto;/.test(responsive)],
  ['mobile drawer scrollbar is visually hidden', /\.mobile-drawer-nav\s*\{[\s\S]*?scrollbar-width:\s*none;/.test(responsive) && /\.mobile-drawer-nav::\-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/.test(responsive)],
  ['pitch clip IDs are instance-scoped', markup.includes("const topArcClipId = `${idPrefix}-top-arc-clip`") && markup.includes("const bottomArcClipId = `${idPrefix}-bottom-arc-clip`")],
  ['static duplicate pitch clip IDs are retired', !markup.includes('id="pitch-top-arc-clip"') && !markup.includes('id="pitch-bottom-arc-clip"')],
  ['own-team pitch uses its own clip namespace', squad.includes("matchPitchMarkingsHtml({ idPrefix: 'match-squad-pitch' })")],
  ['opponent pitch uses its own clip namespace', opponent.includes("matchPitchMarkingsHtml({ idPrefix: 'match-opponent-pitch' })")],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.29.35 UI REGRESSION: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
