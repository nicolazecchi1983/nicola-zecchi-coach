import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/modules/training/events/trainingEditorEvents.js', import.meta.url), 'utf8')
const controller = await readFile(new URL('../src/app/appController.js', import.meta.url), 'utf8')

const checks = [
  ['Training runtime imports the canonical HTML escape helper', (text) => text.includes("import { escapeHtml } from '../../../shared/html/escapeHtml.js'") && !text.includes("const escape = (value='') => String(value).replace")],
  ['PDF preview escapes the generated filename with the canonical helper', /ANTEPRIMA DI STAMPA<\/span><strong>\$\{escapeHtml\(fileName\)\}<\/strong>/],
  ['Stale tsEscapeHtml reference is absent', (text) => !text.includes('tsEscapeHtml')],
  ['PDF preview uses the dedicated PDF output path', /const \{ blob, fileName \} = await createTrainingSheetPdfOutput\(\{ rawData, previewElement: preview \}\)/],
  ['Mobile PDF preview opens a fresh browsing target per attempt', /const mobileTarget = isMobile[\s\S]*?staff-training-pdf-\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(36\)\.slice\(2\)\}[\s\S]*?window\.open\('about:blank', mobileTarget\)/],
  ['Mobile PDF preview replaces the placeholder with the generated blob URL', /mobileWindow\.location\.replace\(objectUrl\)/],
  ['Publish path still awaits publishTrainingSheet', /const result = await publishTrainingSheet\(/],
  ['Successful publish still persists local Training Sheet state', /localStorage\.setItem\(`nz-training-sheet:\$\{result\.filePath\}`/],
  ['Training runtime declares Calendar reload as an explicit dependency', /export function wireTrainingEditorEvents\(\{[\s\S]*?loadCalendarEvents,[\s\S]*?\}\)/],
  ['Composition root injects Calendar reload into Training runtime', (text) => /wireTrainingEditorEvents\(\{[\s\S]*?loadCalendarEvents,[\s\S]*?\}\)/.test(controller)],
  ['Successful publish still reloads Calendar events', /await loadCalendarEvents\(\)/],
  ['Publish failure remains surfaced to the user', /Errore pubblicazione Training Sheet:/],
]

let passed = 0
for (const [label, expectation] of checks) {
  const ok = typeof expectation === 'function' ? expectation(source) : expectation.test(source)
  if (ok) {
    console.log(`✓ ${label}`)
    passed += 1
  } else {
    console.error(`✗ ${label}`)
  }
}

console.log(`\nTraining Publish Runtime: ${passed}/${checks.length}`)
assert.equal(passed, checks.length)
