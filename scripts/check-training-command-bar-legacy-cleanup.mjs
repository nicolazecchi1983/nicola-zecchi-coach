import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const style = read('src/style.css')
const editor = read('src/design-system/training-editor.css')
const polish = read('src/modules/training/trainingPolish.css')
const owner = read('src/modules/training/trainingCommandBar.css')
const responsive = read('src/design-system/responsive.css')
const main = read('src/main.js')

const legacy = `${style}\n${editor}\n${polish}`
const forbidden = [
  '.ts-editor-actions-wrap',
  '.ts-editor-actions',
  '.ts-open-sheet',
  '.ts-open-button',
  '.ts-draft-state--compact',
  '.ts-command-actions',
]

const checks = [
  ['legacy layers no longer own Training command selectors', forbidden.every((s) => !legacy.includes(s))],
  ['canonical desktop owner exists', owner.includes('.ts-manual-editor .ts-editor-actions-wrap') && owner.includes('.ts-manual-editor .ts-command-actions')],
  ['canonical mobile owner exists', responsive.includes('.ts-manual-editor .ts-command-actions') && responsive.includes('grid-template-columns: minmax(0, 1fr) auto')],
  ['command owner loads after Training polish', main.indexOf("./modules/training/trainingCommandBar.css") > main.indexOf("./modules/training/trainingPolish.css")],
  ['responsive final loads after command owner', main.indexOf("./design-system/responsive.css") > main.indexOf("./modules/training/trainingCommandBar.css")],
  ['canonical owner has no important overrides', !owner.includes('!important')],
  ['legacy style no longer defines open button visuals', !style.includes('.ts-open-button {')],
  ['legacy Training editor no longer sizes command wrapper', !editor.includes('.ts-manual-editor .ts-editor-actions-wrap')],
  ['Training polish no longer sizes command wrapper', !polish.includes('.ts-manual-editor .ts-editor-actions-wrap')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nTraining Command Bar Legacy Cleanup: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
