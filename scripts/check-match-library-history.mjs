import fs from 'node:fs'
import assert from 'node:assert/strict'
import { getMatchLibraryHistoricalMatches, groupLibraryMatchesForArchive } from '../src/modules/match/ui/matchLibraryView.js'

const view = fs.readFileSync(new URL('../src/modules/match/ui/matchLibraryView.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')
const events = fs.readFileSync(new URL('../src/modules/match/events/matchLibraryEvents.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')
const css = fs.readFileSync(new URL('../src/modules/match/ui/matchLibrary.css', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n')

const sample = [
  { id: 'future', date: '2026-09-23' },
  { id: 'today', date: '2026-09-22' },
  { id: 'past-new', date: '2026-09-20' },
  { id: 'past-old', date: '2026-08-30' },
  { id: 'undated', date: '' },
]
const historical = getMatchLibraryHistoricalMatches(sample, '2026-09-22')
const grouped = groupLibraryMatchesForArchive([sample[3], sample[2], sample[4]])

const checks = [
  ['storico esclude oggi e futuro', historical.map((m) => m.id).join(',') === 'past-new,past-old'],
  ['storico ordina recente-prima', historical[0]?.id === 'past-new' && historical.at(-1)?.id === 'past-old'],
  ['archive grouping ordina mesi', grouped[0]?.key === '2026-09' && grouped[1]?.key === '2026-08'],
  ['undated resta in coda', grouped.at(-1)?.key === 'undated'],
  ['R33 operational owner preservato', view.includes('const operationalMatches = monthGroups.flatMap((group) => group.items)')],
  ['storico deriva da matches canonici', view.includes('const historicalMatches = getMatchLibraryHistoricalMatches(matches)')],
  ['tutte deriva dallo stesso dataset', view.includes('const allGroups = groupLibraryMatchesForArchive(matches)')],
  ['scope operational presente', view.includes('data-match-library-scope="operational"')],
  ['scope history presente', view.includes('data-match-library-scope="history"')],
  ['scope all presente', view.includes('data-match-library-scope="all"')],
  ['tre scope panel presenti', (view.match(/data-match-library-scope-panel=/g) || []).length === 3],
  ['header espone storico', view.includes('data-match-library-history-count')],
  ['filtri limitati al panel attivo', events.includes("activePanel.querySelectorAll('[data-match-library-card]')")],
  ['scope owner negli events canonici', events.includes('const setMatchLibraryScope = (requestedScope) => {')],
  ['controller legacy resta non montato', !app.includes('matchLibraryController') && !app.includes('bindMatchLibrary')],
  ['nessun accesso Supabase diretto', !view.toLowerCase().includes('supabase') && !events.toLowerCase().includes('supabase')],
  ['CSS scope foundation presente', css.includes('STAFF R35.1 Match Library Historical Workspace foundation')],
  ['CSS stato attivo accessibile', css.includes('.match-library-scope[aria-pressed="true"]')],
  ['CSS mobile presente', css.includes('.match-library-scope { min-height: 44px; padding-inline: 12px; }')],
  ['R35 CSS senza important', !css.split('STAFF R35.1 Match Library Historical Workspace foundation')[1].includes('!important')],
]
let passed = 0
for (const [label, ok] of checks) {
  try { assert.equal(Boolean(ok), true); console.log('PASS', label); passed += 1 }
  catch { console.error('FAIL', label) }
}
console.log(`R35.1 Match Library Historical Workspace: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
