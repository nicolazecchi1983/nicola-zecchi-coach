import fs from 'node:fs'
import assert from 'node:assert/strict'

const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8')
const command = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')

const checks = [
  ['header mantiene CREAZIONE SEDUTA nel metadata canonico', view.includes('<p class="ts-editor-meta"><span>CREAZIONE SEDUTA</span>')],
  ['copy PDF ridondante rimossa', !view.includes('Compila e genera il PDF')],
  ['separator bullet collega funzione e stato documento', view.includes('<span>CREAZIONE SEDUTA</span><b>•</b><span class="ts-draft-state ts-draft-state--inline"')],
  ['selector CSS ritirato', !command.includes('.ts-open-sheet')],
  ['Open TS CSS ritirato', !command.includes('.ts-open-button')],
  ['command owner e content-driven', command.includes('grid-template-columns: auto') && command.includes('width: max-content') && command.includes('max-width: 100%')],
  ['More resta azione canonica 44px', command.includes('.ts-more-menu') && command.includes('.ts-more-button') && command.includes('width: 44px') && command.includes('height: 44px')],
  ['Bozza lascia il command owner e vive nel metadata header', !command.includes('.ts-draft-state--compact') && view.includes('ts-draft-state--inline')],
  ['patch 390px legata al selector ritirata', !command.includes('@media (max-width: 390px)')],
  ['nessun important introdotto', !command.includes('!important')],
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
console.log(`R36.1B Training Header Residual Cleanup: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
