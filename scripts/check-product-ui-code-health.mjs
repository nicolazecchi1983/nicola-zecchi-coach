import fs from 'node:fs'
import path from 'node:path'

const product=fs.readFileSync('src/design-system/productUi.css','utf8')
const match=fs.readFileSync('src/modules/match/workspace/matchWorkspace.css','utf8')
const style=fs.readFileSync('src/style.css','utf8')
const polish=fs.readFileSync('src/design-system/polish.css','utf8')

const checks=[
 ['One canonical Product UI file owns shared shell/stepper/surface',product.includes('.product-page-shell')&&product.includes('.product-section-nav')&&product.includes('.product-surface')],
 ['Match domain aliases shared Product tokens instead of redefining palette',match.includes('var(--product-surface)')&&match.includes('var(--product-border)')],
 ['Legacy style no longer owns match-context-navigation visuals',!style.includes('.match-context-navigation button{display:inline-flex')],
 ['Legacy style no longer owns Training active step color',!style.includes('.ts-step-nav button.is-active{')],
 ['Polish remains owner of legacy editor stepper only',polish.includes('.match-step-nav button')&&!polish.includes('.ts-step-nav button')],
 ['No new database or service dependency introduced by UI foundation',!product.includes('supabase')&&!match.includes('supabase')],
 ['Responsive behavior is structural in Product UI',product.includes('@media(max-width:1180px)')&&product.includes('@media(max-width:760px)')],
 ['Shared nav never gives a named tab special width',!product.includes('Convocazioni')&&!product.includes('Studio avversario')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nProduct UI Code Health: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
