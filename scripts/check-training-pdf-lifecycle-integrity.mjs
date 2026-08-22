import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const service = read('src/modules/training/trainingSheetService.js')
const repo = read('src/modules/training/trainingSheetRepository.js')
const storage = read('src/core/storage/teamStorage.js')
const events = read('src/modules/training/events/trainingEditorEvents.js')
const calendar = read('src/modules/calendar/events/calendarRuntimeActions.js')

const checks = [
  ['private storage download exists', storage.includes('export async function downloadPrivateDocument')],
  ['training repository downloads canonical PDF', repo.includes('export async function downloadTrainingSheetPdf')],
  ['service exposes published PDF download', service.includes('export async function downloadPublishedTrainingSheetPdf')],
  ['published PDF path is required', service.includes('TRAINING_PUBLISHED_PDF_PATH_MISSING')],
  ['canonical download filename is derived without regenerating PDF', service.includes('buildTrainingSheetFileName(normalizeTrainingSheetData(rawData))') && !events.includes('const { fileName } = await createTrainingSheetPdfOutput({ rawData, previewElement: preview })\n            const canonical')],
  ['previous PDF cleanup result is checked', service.includes('const removed = await removeTrainingSheetPdf(previousPath)')],
  ['cleanup failure becomes warning', service.includes('TRAINING_PREVIOUS_PDF_CLEANUP_FAILED')],
  ['editor receives canonical download service', events.includes('downloadPublishedTrainingSheetPdf')],
  ['clean published sheet uses canonical stored PDF', events.includes('canUseCanonicalPublishedPdf') && events.includes('publishedEvent.trainingSheetPath')],
  ['dirty published sheet is explicitly local-only', events.includes('PDF locale generato dalle modifiche correnti')],
  ['blob download revokes object URL', events.includes('URL.revokeObjectURL(objectUrl)')],
  ['calendar viewer refreshes signed URL on demand', calendar.includes("createSignedFileUrl('training-sheets', event.trainingSheetPath, 3600)")],
  ['fresh signed URL is used for viewer and download', calendar.includes('url: freshUrl') && calendar.includes('downloadUrl: freshUrl')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} - ${label}`)
  if (!ok) failed += 1
}
if (failed) {
  console.error(`TRAINING PDF LIFECYCLE: ${failed}/${checks.length} controlli falliti`)
  process.exit(1)
}
console.log(`TRAINING PDF LIFECYCLE: ${checks.length}/${checks.length} OK`)
