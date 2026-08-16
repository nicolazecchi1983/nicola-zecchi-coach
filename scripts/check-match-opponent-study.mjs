import fs from 'node:fs'

const model = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyModel.js', import.meta.url), 'utf8')
const repository = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyRepository.js', import.meta.url), 'utf8')
const service = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyService.js', import.meta.url), 'utf8')
const view = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyView.js', import.meta.url), 'utf8')
const controller = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyController.js', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const calendarService = fs.readFileSync(new URL('../src/modules/match/matchCalendarService.js', import.meta.url), 'utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js', 'utf8')

const checks = [
  ['Studio avversario ha modello dedicato', model.includes('normalizeMatchOpponentStudy') && model.includes('MATCH_OPPONENT_STUDY_SCHEMA_VERSION')],
  ['Studio vive nei notes canonici dello stesso Match', model.includes('opponent_study') && model.includes('mergeMatchOpponentStudyIntoEventNotes')],
  ['Materiale tecnico distingue report, video e documenti', model.includes("'report'") && model.includes("'video'") && model.includes("'document'")],
  ['Categorie tecniche canoniche', ['possession', 'non-possession', 'transitions', 'set-pieces'].every((value) => model.includes(value))],
  ['Link esterni validati come http/https', model.includes("['http:', 'https:']") && model.includes('validateExternalStudyLink')],
  ['Repository gestisce solo asset privati, non una seconda fonte dati', repository.includes('createMatchOpponentStudyAssetRepository') && !repository.includes('localStorage')],
  ['Service rilegge evento fresco prima di mutare', service.includes('await getEvent(matchId)') && service.includes('mergeMatchOpponentStudyIntoEventNotes(event.notes, next)')],
  ['Service gestisce upload, replace report e cleanup', service.includes('uploadAsset') && service.includes("kind === 'report'") && service.includes('previousPath')],
  ['Rimozione aggiorna prima i metadati e poi pulisce storage', service.includes('const saved = await mutate') && service.includes('File Match orfano non rimosso')],
  ['Video grandi indirizzati verso link esterni', service.includes('MAX_VIDEO_BYTES') && service.includes('Per video più grandi usa un link esterno')],
  ['UI contiene report, materiali, link e lettura tecnica', ['Report Match Analyst', 'Video e documenti', 'Link esterni', 'Lettura tecnica'].every((label) => view.includes(label))],
  ['Controller protegge doppio invio durante upload', controller.includes('setBusy(form, true)') && controller.includes('disabled = busy')],
  ['Controller apre asset privati tramite signed URL', controller.includes('getAssetUrl') && controller.includes('window.open(url')],
  ['App usa evento Calendario come sorgente dello studio', adapters.includes('appState.calendarEvents.find') && adapters.includes('createMatchOpponentStudyService') && adapters.includes('getEvent: getCalendarEvent')],
  ['Pubblicazione Match preserva metadata già presenti', calendarService.includes('existingNotes') && calendarService.includes('...parseMatchEventNotes(existingNotes)')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed) process.exit(1)
console.log(`\nMatch opponent study contract: ${checks.length}/${checks.length} controlli superati.`)
