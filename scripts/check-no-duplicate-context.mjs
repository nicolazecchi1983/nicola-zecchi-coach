import fs from 'node:fs'

const controller=fs.readFileSync('src/app/appController.js','utf8')
const page=fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const product=fs.readFileSync('src/design-system/productUi.css','utf8')
const combined=`${page}\n${controller}`

const labels=[
 ['01','Informazioni seduta'],
 ['02','Rosa e presenze'],
 ['03','Carico e focus fisico'],
 ['04','Fasi allenamento'],
 ['05','Obiettivo e principi'],
 ['06','Riepilogo'],
]

const checks=[
 ['Training Sheet keeps one canonical section navigation',page.includes('ts-step-nav product-section-nav')],
 ['No TS step repeats the navigation title in ts-card-head',labels.every(([n,label])=>!combined.includes(`<div class="ts-card-head"><span>${n}</span><div><h2>${label}</h2>`))],
 ['Step 1 operational content remains',page.includes('name="date"')&&page.includes('name="time"')&&page.includes('name="location"')],
 ['Step 2 operational content remains',page.includes("['absent','Assenti'")&&page.includes("['injured','Infortunati'")&&page.includes('data-player-select="${type}"')],
 ['Step 3 operational content remains',page.includes('Match Day')&&page.includes('Focus fisico')],
 ['Step 4 operational content remains',page.includes('data-ts-phases')&&page.includes('data-add-phase')],
 ['Step 5 operational content remains',page.includes('name="objective"')&&page.includes('data-ts-pillars')],
 ['Product UI codifies No Duplicate Context fallback',product.includes('No Duplicate Context')&&product.includes('.ts-step > .ts-card-head')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)passed++}
console.log(`\nNo Duplicate Context: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
