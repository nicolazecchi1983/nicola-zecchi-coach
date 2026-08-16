import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/workspace/matchWorkspace.css', 'utf8')
const shell = fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js', 'utf8')
const product = fs.readFileSync('src/design-system/productUi.css', 'utf8')

const checks = [
  ['shell exposes one dedicated intro block', shell.includes('match-workspace-shell__intro')],
  ['shell exposes one Match Workspace eyebrow', shell.includes('match-workspace-shell__eyebrow">MATCH WORKSPACE')],
  ['shell description is no longer mixed with bullet metadata', !shell.includes('<p><span>MATCH WORKSPACE</span><b>•</b>')],
  ['Match header has domain-scoped surface hierarchy', css.includes('.match-workspace-shell__header{') && css.includes('border:1px solid var(--match-workspace-border)')],
  ['Match header accent uses canonical token', css.includes('background:var(--match-workspace-accent)')],
  ['Match navigation remains scoped to product navigation', css.includes('.match-workspace-shell > .product-section-nav')],
  ['desktop Match navigation is compacted below shared 64px baseline', css.includes('height:58px!important') && product.includes('height:64px!important')],
  ['active Match step has one accent rail', css.includes('button.is-active::after') && css.includes('background:var(--match-workspace-accent)')],
  ['shared Product UI geometry remains untouched', product.includes('grid-template-columns:repeat(var(--product-nav-columns, 6),minmax(0,1fr))!important')],
  ['tablet hierarchy has an explicit adaptation', css.includes('@media(max-width:1180px) and (min-width:761px)')],
  ['mobile hierarchy has an explicit adaptation', css.includes('@media(max-width:760px)') && css.includes('height:54px!important')],
  ['no new horizontal Match navigation is introduced', !css.includes('.match-workspace-shell > .product-section-nav{overflow-x:auto')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nMatch Workspace Shell Polish: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
