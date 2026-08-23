import fs from 'node:fs'
import { groupMatchesByMonth } from '../src/modules/match/ui/matchLibraryView.js'
import { normalizeMatchRecord } from '../src/modules/match/matchLibraryModel.js'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')
const matchLibraryEvents = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js','utf8')

const groups = groupMatchesByMonth([
  { id:'past-far', date:'2026-07-10' },
  { id:'past-near', date:'2026-08-22' },
  { id:'today', date:'2026-08-23' },
  { id:'future-near', date:'2026-08-24' },
  { id:'future-same-distance', date:'2026-08-22' },
  { id:'future-month', date:'2026-09-02' },
  { id:'undated', date:'' },
], '2026-08-23')

const tieGroups = groupMatchesByMonth([
  { id:'past', date:'2026-08-22' },
  { id:'future', date:'2026-08-24' },
], '2026-08-23')


const neutral = normalizeMatchRecord({ id:'n', homeAway:'neutral' })

const checks = [
  ['Partite raggruppate per mese', groups.length === 4],
  ['Mese con la gara più vicina viene mostrato per primo', groups[0]?.key === '2026-08'],
  ['Dentro il mese la gara di oggi viene mostrata per prima', groups[0]?.items[0]?.id === 'today'],
  ['A pari distanza viene preferita la gara futura', tieGroups[0]?.items[0]?.id === 'future'],
  ['Il mese successivo vicino precede un mese passato più lontano', groups[1]?.key === '2026-09' && groups[2]?.key === '2026-07'],
  ['Date mancanti isolate in gruppo dedicato', groups.at(-1)?.key === 'undated'],
  ['View apre di default il primo gruppo per prossimità', view.includes('const defaultOpenKey = monthGroups[0]?.key')],
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
console.log(`\nMatch Library Proximity Ordering: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
