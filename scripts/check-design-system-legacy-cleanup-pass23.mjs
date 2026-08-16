import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const editor = fs.readFileSync('src/design-system/training-editor.css', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const command = fs.readFileSync('src/modules/training/trainingCommandBar.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')

const checks = [
  ['legacy V6.1 marker removed', !style.includes('/* TRAINING SHEET EDITOR V6.1 */')],
  ['legacy voice marker removed', !style.includes('/* V6.2 — Dettatura vocale Training Sheet */')],
  ['dead ts-editor-grid removed from monolith', !style.includes('.ts-editor-grid')],
  ['dead ts-editor-panel removed from monolith', !style.includes('.ts-editor-panel')],
  ['dead narration presentation removed from monolith', !style.includes('.ts-narration')],
  ['dead voice toolbar presentation removed from monolith', !style.includes('.ts-voice-toolbar')],
  ['dead record button presentation removed from monolith', !style.includes('.ts-record-button')],
  ['current editor is manual step workflow', view.includes('ts-manual-editor') && view.includes('ts-workspace--steps')],
  ['canonical editor owner exists', editor.includes('.ts-workspace--steps') && editor.includes('.ts-phases-editor')],
  ['training polish owner exists', polish.includes('.ts-manual-editor')],
  ['command bar owner exists', command.includes('.ts-command-actions')],
  ['responsive remains final adaptive owner', responsive.includes('.ts-manual-editor') || responsive.includes('.ts-editor-actions')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`PASS: ${label}`)
    passed += 1
  } else {
    console.error(`FAIL: ${label}`)
  }
}
console.log(`DS Legacy Cleanup Pass 23: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
