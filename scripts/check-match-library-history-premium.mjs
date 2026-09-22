import fs from 'node:fs'
import assert from 'node:assert/strict'

const view = fs.readFileSync(new URL('../src/modules/match/ui/matchLibraryView.js', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')
const events = fs.readFileSync(new URL('../src/modules/match/events/matchLibraryEvents.js', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')
const css = fs.readFileSync(new URL('../src/modules/match/ui/matchLibrary.css', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')

const checks = [
  ['header summary duplicato rimosso', !view.includes('match-library-heading-meta') && !view.includes('match-library-heading-stat')],
  ['scope operational possiede il conteggio visibile', view.includes('data-match-library-scope="operational"') && view.includes('data-match-library-visible-count')],
  ['scope history possiede il conteggio storico', view.includes('data-match-library-scope="history"') && view.includes('data-match-library-history-count')],
  ['una sola ricerca nella Library', (view.match(/data-match-library-search/g) || []).length === 1],
  ['ricerca dichiara scope globale in semantica accessibile', view.includes('aria-label="Cerca in tutta la Match Library per avversario, competizione o impianto"')],
  ['global search riusa lo scope ALL', events.includes("setMatchLibraryScope('all')") && events.includes("matchLibrary.dataset.matchLibrarySearchMode = 'global'")],
  ['global search conserva scope di ritorno', events.includes('matchLibrary.dataset.matchLibrarySearchReturnScope = matchLibrary.dataset.matchLibraryScope') && events.includes('const returnScope = matchLibrary.dataset.matchLibrarySearchReturnScope')],
  ['clear search ripristina scope precedente', events.includes('delete matchLibrary.dataset.matchLibrarySearchReturnScope') && events.includes('setMatchLibraryScope(returnScope)')],
  ['cambio scope chiude la ricerca globale senza duplicare risultati', events.includes("if (searchInput && readSearchQuery()) searchInput.value = ''")],
  ['nessun quarto pannello search', (view.match(/data-match-library-scope-panel=/g) || []).length === 3],
  ['filtri restano sul solo pannello effettivo', events.includes("activePanel.querySelectorAll('[data-match-library-card]')")],
  ['history density resta scoped', css.includes('[data-match-library-scope-panel="history"] .match-library-card')],
  ['hidden card contract prevale sul display grid', css.includes('.match-library-card[hidden] {\n  display: none;\n}') && (css.match(/\.match-library-card\[hidden\]/g) || []).length === 1],
  ['history card compatta desktop', css.includes('min-height: 76px;') && css.includes('grid-template-columns: 112px minmax(0, 1fr) auto;')],
  ['history status ridondante nascosto', css.includes('[data-match-library-scope-panel="history"] .match-library-status {\n  display: none;\n}')],
  ['history mobile resta leggibile', css.includes('grid-template-columns: 1fr;') && css.includes('min-height: 40px;')],
  ['vecchio CSS header metriche rimosso', !css.includes('STAFF R34.1 Match Library premium header metrics')],
  ['R35.2 CSS senza important', !css.split('STAFF R35.2 Global Search + Compact Historical Workspace')[1].includes('!important')],
  ['controller legacy resta non montato', !app.includes('matchLibraryController') && !app.includes('bindMatchLibrary')],
  ['nessun accesso Supabase diretto', !view.toLowerCase().includes('supabase') && !events.toLowerCase().includes('supabase')],
]

let passed = 0
for (const [label, ok] of checks) {
  try { assert.equal(Boolean(ok), true); console.log('PASS', label); passed += 1 }
  catch { console.error('FAIL', label) }
}
console.log(`R35.2 Match Library Global Search + Compact History: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
