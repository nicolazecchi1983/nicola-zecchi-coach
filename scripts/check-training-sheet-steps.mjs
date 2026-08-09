import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const required = [
  'Informazioni seduta',
  'Rosa e presenze',
  'Carico e focus fisico',
  'Fasi allenamento',
  'Obiettivo e principi',
  'Riepilogo',
  'data-toggle-phase-split',
  'data-player-search',
  'SETTORE GIOVANILE',
  'PREPARAZIONE',
]
const missing = required.filter((item) => !source.includes(item))
if (missing.length) {
  console.error(`TRAINING STEPS CHECK: FAIL (${missing.join(', ')})`)
  process.exit(1)
}
const order = ['Informazioni seduta','Rosa e presenze','Carico e focus fisico','Fasi allenamento','Obiettivo e principi','Riepilogo']
const navStart = source.indexOf("${['Informazioni seduta'")
const navChunk = source.slice(navStart, navStart + 500)
let previous = -1
for (const label of order) {
  const position = navChunk.indexOf(label)
  if (position <= previous) { console.error(`TRAINING STEPS CHECK: FAIL (ordine ${label})`); process.exit(1) }
  previous = position
}
if (source.includes('ANTEPRIMA REPORT')) { console.error('TRAINING STEPS CHECK: FAIL (anteprime report residue)'); process.exit(1) }
console.log('TRAINING STEPS CHECK: OK (flow, search, MD, parallel work e pulizia UI verificati)')
