import fs from 'node:fs'

const css=fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')
const product=fs.readFileSync('src/design-system/productUi.css','utf8')
const shell=fs.readFileSync('src/modules/match/workspace/matchWorkspaceShell.js','utf8')
const main=fs.readFileSync('src/main.js','utf8')

const checks=[
 ['workspace has a dedicated domain shell',shell.includes('matchWorkspaceShellHtml')],
 ['shell owns header',shell.includes('match-workspace-shell__header')],
 ['shell owns temporal navigation',shell.includes('matchTemporalNavigationHtml(activeSection)')&&shell.includes('data-match-temporal-navigation')],
 ['temporal navigation has three domain-owned moments',css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')&&css.includes('.match-temporal-navigation__item.is-active')],
 ['temporal mobile geometry stays domain-owned without horizontal overflow',css.includes('@media(max-width:760px)')&&css.includes('.match-temporal-navigation__copy')&&!css.includes('.match-temporal-navigation{overflow-x:auto')],
 ['shell owns navigation',shell.includes('matchContextNavigationHtml(activeSection')],
 ['shell owns content root',shell.includes('match-workspace-shell__content')],
 ['workspace CSS participates before canonical responsive layer',main.indexOf('matchWorkspace.css') < main.indexOf('responsive.css')],
 ['one shared max-width token governs workspace',css.includes('--match-workspace-max:var(--product-page-max)')&&product.includes('--product-page-max:var(--staff-product-content-max)')],
 ['desktop navigation uses seven equal columns',css.includes('--product-nav-columns:7')&&product.includes('grid-template-columns:repeat(var(--product-nav-columns, 6),minmax(0,1fr))!important')],
 ['labels remain inside their own tabs',product.includes('overflow:hidden!important')&&product.includes('white-space:normal!important')],
 ['native legacy geometry is neutralized inside shell',css.includes('R2.6C — runtime compatibility remains; page geometry does not.')&&/\.match-native-surface \.match-step\.staff-card\{[\s\S]*?padding:0!important[\s\S]*?border-radius:0!important/.test(css)],
 ['post-match workspace keeps canonical status surface while section owner is domain-local',css.includes('.match-workspace-shell .post-match-status-row')],
 ['report empty state uses canonical surface geometry',css.includes('.match-workspace-shell .match-report-workspace-empty')],
 ['medium navigation uses 4-column fallback',css.includes('--product-nav-tablet-columns:4')&&product.includes('var(--product-nav-tablet-columns, 4)')],
 ['mobile navigation uses 2-column fallback',css.includes('--product-nav-mobile-columns:2')&&product.includes('var(--product-nav-mobile-columns,2)')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nMatch Workspace Design Contract: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
