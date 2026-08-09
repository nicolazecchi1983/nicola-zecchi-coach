import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const model = await readFile(new URL('../src/modules/training/trainingSheetModel.js', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/modules/training/trainingSheetService.js', import.meta.url), 'utf8')
const controller = await readFile(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const libraryView = await readFile(new URL('../src/modules/training/ui/trainingLibraryView.js', import.meta.url), 'utf8')
const calendarView = await readFile(new URL('../src/modules/calendar/ui/calendarView.js', import.meta.url), 'utf8')

assert.doesNotMatch(model, /ARCHIVED:\s*['"]archived['"]/)
assert.doesNotMatch(model, /export function archiveTrainingSheetData/)
assert.doesNotMatch(service, /export async function archiveTrainingSheet/)
assert.doesNotMatch(controller, /Archiviata · sola lettura/)
assert.doesNotMatch(controller, /TRAINING_SHEET_STATUS\.ARCHIVED/)
assert.doesNotMatch(libraryView, /Semaforo/i)
assert.match(libraryView, /Valutazione seduta|Valutazione e note/)
assert.match(calendarView, /training-evaluation-dot|evaluation/i)
assert.match(model, /status === 'archived'\) return TRAINING_SHEET_STATUS\.PUBLISHED/)

console.log('TRAINING PRODUCT REVIEW CHECK: OK (8/8)')
