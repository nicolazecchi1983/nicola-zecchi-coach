import fs from 'node:fs'

const files = {
  view: fs.readFileSync('src/modules/training/ui/trainingLibraryView.js', 'utf8'),
  service: fs.readFileSync('src/modules/training/trainingLibraryService.js', 'utf8'),
  gateway: fs.readFileSync('src/app/appDataGateway.js', 'utf8'),
  controller: fs.readFileSync('src/app/appController.js', 'utf8'),
}

const checks = [
  ['feedback service', files.service.includes('saveTrainingLibraryFeedback')],
  ['feedback preserved in event notes', files.service.includes('library_feedback')],
  ['session evaluation in library', files.view.includes('data-feedback-value="green"') && files.view.includes('data-feedback-value="yellow"') && files.view.includes('data-feedback-value="red"') && files.view.includes('Valutazione e note')],
  ['optional notes in library', files.view.includes('data-library-feedback-notes')],
  ['MD filter', files.view.includes('data-library-md-filter')],
  ['feedback filter', files.view.includes('data-library-feedback-filter')],
  ['search indexes technical content', files.view.includes('objective') && files.view.includes('principles') && files.view.includes('notes')],
  ['gateway exposes feedback', files.gateway.includes('libraryFeedback: readTrainingLibraryFeedback')],
  ['controller persists feedback', files.controller.includes('saveTrainingLibraryFeedback')],
  ['no popup workflow', !files.view.includes('alert(') && !files.view.includes('confirm(')],
]

const failed = checks.filter(([, ok]) => !ok)
checks.forEach(([name, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`))
if (failed.length) process.exit(1)
console.log(`Training Library Evolution: ${checks.length}/${checks.length}`)
