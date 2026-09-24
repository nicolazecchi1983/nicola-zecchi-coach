import fs from 'node:fs'
import assert from 'node:assert/strict'

const ts = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const tl = fs.readFileSync('src/modules/training/ui/trainingLibraryView.js','utf8')
const ml = fs.readFileSync('src/modules/match/ui/matchLibraryView.js','utf8')
const command = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8')
const mlCss = fs.readFileSync('src/modules/match/ui/matchLibrary.css','utf8')

const checks = [
  ['TS usa titolo + metadata canonico', ts.includes('<h1>Training Sheet Editor</h1>') && ts.includes('<p class="ts-editor-meta"><span>CREAZIONE SEDUTA</span>')],
  ['TS stato e inline accanto alla funzione', ts.includes('<span>CREAZIONE SEDUTA</span><b>•</b><span class="ts-draft-state ts-draft-state--inline" data-ts-draft-state')],
  ['TS stato non vive piu nel command group', !/<div class="ts-editor-actions">[\s\S]*data-ts-draft-state[\s\S]*<\/div>/.test(ts)],
  ['TS More resta overflow a destra', ts.includes('ts-editor-actions-wrap') && ts.includes('ts-more-menu') && ts.includes('aria-label="Altre azioni"')],
  ['TS helper progressivo ridondante rimosso', !ts.includes('Proposto automaticamente, modificabile')],
  ['Training Library usa header condiviso', tl.includes('page-head product-page-header training-library-head')],
  ['Training Library usa ARCHIVIO ALLENAMENTI', tl.includes('<h1>Training Library</h1><p><span>ARCHIVIO ALLENAMENTI</span></p>')],
  ['Training Library non espone creation entry point', !tl.includes('data-new-event') && !tl.includes('Nuova Training Sheet')],
  ['Match Library converge sul page header condiviso', ml.includes('page-head product-page-header match-library-heading')],
  ['Match Library usa GESTIONE PARTITE sotto al titolo', ml.includes('<h1>Match Library</h1>') && ml.includes('<p><span>GESTIONE PARTITE</span></p>')],
  ['MATCH ENGINE non e piu visibile', !ml.includes('MATCH ENGINE') && !mlCss.includes('.match-library-heading .eyebrow')],
  ['Match Library non espone creation entry point', !ml.includes('data-toggle-match-create') && !ml.includes('data-match-create-form') && !ml.includes('+ Crea partita')],
  ['command bar e action-only', !command.includes('.ts-draft-state--compact') && !command.includes('grid-template-rows: 44px 24px')],
  ['Training polish possiede metadata inline', polish.includes('R36.2A — CANONICAL TRAINING HEADER METADATA') && polish.includes('.ts-draft-state--inline')],
  ['nessun important introdotto dai nuovi owner', !polish.split('R36.2A — CANONICAL TRAINING HEADER METADATA')[1].includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  try {
    assert.equal(Boolean(ok), true)
    console.log('PASS', label)
    passed += 1
  } catch {
    console.error('FAIL', label)
  }
}
console.log(`R36.2A Canonical Page Header Contract: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
