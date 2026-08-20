import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/modules/training/events/trainingEditorEvents.js', import.meta.url), 'utf8')
const controller = await readFile(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/modules/training/trainingSheetService.js', import.meta.url), 'utf8')

const checks = [
  ['Training runtime imports the canonical HTML escape helper', (text) => text.includes("import { escapeHtml } from '../../../shared/html/escapeHtml.js'") && !text.includes("const escape = (value='') => String(value).replace")],
  ['PDF preview escapes the generated filename with the canonical helper', /ANTEPRIMA DI STAMPA<\/span><strong>\$\{escapeHtml\(fileName\)\}<\/strong>/],
  ['Stale tsEscapeHtml reference is absent', (text) => !text.includes('tsEscapeHtml')],
  ['PDF preview uses the dedicated PDF output path', /const \{ blob, fileName \} = await createTrainingSheetPdfOutput\(\{ rawData, previewElement: preview \}\)/],
  ['Mobile Training preview stays inside STAFF', /const openMobileTrainingPreview = \(\) => \{[\s\S]*?overlay\.className = 'ts-mobile-preview-overlay'[\s\S]*?preview\.cloneNode\(true\)/],
  ['Mobile preview does not open an external browser window', /if \(isMobile\) \{\s*openMobileTrainingPreview\(\)\s*return\s*\}/],
  ['Publish path still awaits publishTrainingSheet', /const result = await publishTrainingSheet\(/],
  ['Successful publish still persists local Training Sheet state', /cacheWrite\(`nz-training-sheet:\$\{result\.filePath\}`/],
  ['Training runtime declares Calendar reload as an explicit dependency', /export function wireTrainingEditorEvents\(\{[\s\S]*?loadCalendarEvents,[\s\S]*?\}\)/],
  ['Composition root injects Calendar reload into Training runtime', (text) => /wireTrainingEditorEvents\(\{[\s\S]*?loadCalendarEvents,[\s\S]*?\}\)/.test(controller)],
  ['Successful publish still reloads Calendar events', /await loadCalendarEvents\(\)/],
  ['Publish failure remains surfaced to the user', /Errore pubblicazione Training Sheet:/],
  ['Publish button label is stable and never rewritten through textContent', (text) => !/button\.textContent\s*=\s*['"]Pubblicazione/.test(text)],
  ['Post-publish local cache writes are isolated from the canonical publish result', /const cacheWrite = \(key, value, warningMessage\) => \{[\s\S]*?try \{[\s\S]*?localStorage\.setItem\(key, value\)[\s\S]*?postPublishWarnings\.push/],
  ['Calendar refresh failure after canonical publish becomes a warning, not publish failure', /try \{\s*await loadCalendarEvents\(\)\s*\} catch \(error\) \{[\s\S]*?TRAINING_POST_PUBLISH_CALENDAR_REFRESH_FAILED/],
  ['Published dirty state explicitly tells the user that local changes are not yet republished', /Hai modifiche locali non ancora pubblicate\. Premi Pubblica TS/],
  ['Clean published sheets short-circuit before generating or uploading another PDF', /const isPublishedAndClean = currentTrainingDocument\.status === TRAINING_SHEET_STATUS\.PUBLISHED && !hasUnpublishedChanges[\s\S]*?Training Sheet già aggiornata in STAFF, Calendario e Training Library\.[\s\S]*?return/],
  ['Publish is single-flight guarded in runtime state', /if \(!button \|\| publishInFlight\) return[\s\S]*?publishInFlight = true[\s\S]*?publishInFlight = false/],
  ['Pending autosave debounce is cancelled before taking the publish snapshot', /clearTimeout\(saveTimer\)\s*saveTimer = null\s*const publishRevision = editRevision\s*const rawData = collect\(\)/],
  ['Edits made while publish is in flight remain dirty after the canonical commit', /const changedDuringPublish = editRevision !== publishRevision[\s\S]*?setTrainingDocument\(result\.data, \{ dirty: changedDuringPublish \}\)/],
  ['Local storage preserves the newer form snapshot when edits happen during publish', /const localSnapshot = changedDuringPublish \? collect\(\) : result\.data[\s\S]*?cacheWrite\(storageKey, JSON\.stringify\(localSnapshot\)/],
  ['Post-publish helper text preserves dirty truth when edits happen during upload', /if \(changedDuringPublish\) \{\s*note\.textContent = 'Training Sheet pubblicata\. Hai modifiche locali successive non ancora pubblicate\.'/],
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

const serviceChecks = [
  ['Failed Calendar commit preserves the original failure even if uploaded-PDF cleanup also fails', /catch \(error\) \{\s*try \{\s*await removeTrainingSheetPdf\(filePath\)[\s\S]*?catch \(cleanupError\)[\s\S]*?throw new AppError/],
  ['Previous PDF cleanup after a successful Calendar commit is warning-only', /TRAINING_PREVIOUS_PDF_CLEANUP_FAILED/],
]
for (const [label, expectation] of serviceChecks) {
  const ok = typeof expectation === 'function' ? expectation(service) : expectation.test(service)
  if (ok) {
    console.log(`✓ ${label}`)
    passed += 1
  } else {
    console.error(`✗ ${label}`)
  }
}

const total = checks.length + serviceChecks.length
console.log(`\nTraining Publish Runtime: ${passed}/${total}`)
assert.equal(passed, total)
