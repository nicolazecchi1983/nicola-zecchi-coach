import fs from 'node:fs'
import { groupMatchesByMonth } from '../src/modules/match/ui/matchLibraryView.js'
import { normalizeMatchRecord } from '../src/modules/match/matchLibraryModel.js'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')
const matchLibraryEvents = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js','utf8')

const groups = groupMatchesByMonth([
  { id:'3', date:'2026-09-22' },
  { id:'1', date:'2026-08-03' },
  { id:'2', date:'2026-08-18' },
  { id:'4', date:'' },
])

const neutral = normalizeMatchRecord({ id:'n', homeAway:'neutral' })

const checks = [
  ['Partite raggruppate per mese', groups.length === 3],
  ['Agosto contiene due partite', groups.find((group) => group.key === '2026-08')?.items.length === 2],
  ['Mesi ordinati dal più recente', groups[0]?.key === '2026-09'],
  ['Date mancanti isolate in gruppo dedicato', groups.at(-1)?.key === 'undated'],
  ['View usa details mensili', view.includes('data-match-library-month')],
  ['View mostra conteggio per mese', view.includes('data-match-month-visible-count')],
  ['Filtri nascondono mesi senza risultati', matchLibraryEvents.includes('month.hidden = visibleCards.length === 0')],
  ['Filtri aggiornano conteggio mensile', matchLibraryEvents.includes('count.textContent = String(visibleCards.length)')],
  ['Mese con risultati filtrati viene aperto', matchLibraryEvents.includes('month.open = true')],
  ['Campo neutro resta neutral nel modello', neutral.homeAway === 'neutral'],
  ['Filtro location può distinguere neutral', view.includes('value="neutral">Campo neutro')],
  ['Ricerca competizione canonica evita collisione con nomi avversari', matchLibraryEvents.includes('canonicalCompetitionQuery') && matchLibraryEvents.includes('cardCompetition === canonicalCompetitionQuery')],
  ['Contatore globale segue i risultati visibili', matchLibraryEvents.includes('totalVisible.textContent = String(visible)')],
  ['Apertura partita resta sulla card originale', view.includes('data-open-match-workspace')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nMatch Library Monthly Grouping: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
