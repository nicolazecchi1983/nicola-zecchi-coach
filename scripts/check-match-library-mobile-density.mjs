import fs from 'node:fs'
import assert from 'node:assert/strict'

const view = fs.readFileSync(new URL('../src/modules/match/ui/matchLibraryView.js', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')
const css = fs.readFileSync(new URL('../src/modules/match/ui/matchLibrary.css', import.meta.url), 'utf8').replace(/\\r\\n?/g, '\\n')

const checks = [
  ['search placeholder mobile compatto', view.includes('placeholder="Cerca nella Library"')],
  ['search mantiene semantica globale accessibile', view.includes('aria-label="Cerca in tutta la Match Library per avversario, competizione o impianto"')],
  ['una sola search surface resta canonica', (view.match(/data-match-library-search/g) || []).length === 1],
  ['mobile scope owner usa griglia a tre colonne', css.includes('grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr) minmax(0, .82fr);')],
  ['mobile scope row non usa scroll orizzontale', css.includes('.match-library-scopes {\n    display: grid;') && css.includes('overflow: visible;')],
  ['scope mobile puo restringersi', css.includes('.match-library-scope {\n    min-width: 0;\n    width: 100%;')],
  ['scope label resta su una riga', css.includes('white-space: nowrap;')],
  ['compact mobile ha tuning dedicato', css.includes('@media (max-width: 420px)') && css.includes('minmax(0, 1.34fr)')],
  ['search mobile conserva touch floor', css.includes('.match-library-search input {\n    min-height: 44px;')],
  ['R35.3 non usa important', !css.split('STAFF R35.3 Match Library mobile density')[1].includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  try { assert.equal(Boolean(ok), true); console.log('PASS', label); passed += 1 }
  catch { console.error('FAIL', label) }
}
console.log(`R35.3 Match Library Mobile Density: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
