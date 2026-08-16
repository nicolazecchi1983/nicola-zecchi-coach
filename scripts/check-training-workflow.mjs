import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const controller = await readFile(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const trainingEditorEvents = await readFile(new URL('../src/modules/training/events/trainingEditorEvents.js', import.meta.url), 'utf8')
const runtime = `${controller}\n${trainingEditorEvents}`
const trainingPage = await readFile(new URL('../src/modules/training/ui/trainingSheetEditorPageView.js', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/modules/training/trainingSheetService.js', import.meta.url), 'utf8')
const model = await readFile(new URL('../src/modules/training/trainingSheetModel.js', import.meta.url), 'utf8')

assert.match(trainingPage, /data-status="draft"/)
assert.doesNotMatch(trainingPage, /data-archive-training-sheet/)
assert.match(runtime, /setTrainingDocument\(result\.data, \{ dirty: false \}\)/)
assert.match(runtime, /Pubblicata · modifiche locali/)
assert.match(service, /publishTrainingSheetData\(draftData\)/)
assert.match(model, /export function publishTrainingSheetData/)
assert.match(model, /TRAINING_SHEET_STATUS\.PUBLISHED/)

console.log('TRAINING WORKFLOW CHECK: OK')
