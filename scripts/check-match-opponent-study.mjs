import fs from 'node:fs'

const model = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyModel.js', import.meta.url), 'utf8')
const repository = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyRepository.js', import.meta.url), 'utf8')
const service = fs.readFileSync(new URL('../src/modules/match/matchOpponentStudyService.js', import.meta.url), 'utf8')
const view = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyView.js', import.meta.url), 'utf8')
const controller = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyController.js', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const calendarService = fs.readFileSync(new URL('../src/modules/match/matchCalendarService.js', import.meta.url), 'utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchOpponentStudy.css', 'utf8')
const resourceCss = fs.readFileSync('src/design-system/resourceComponents.css', 'utf8')
const components = fs.readFileSync('src/design-system/uiComponents.js', 'utf8')

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
  ['UI converge report e materiali senza perdere file/link', view.includes("titleHtml: 'Report'") && view.includes("titleHtml: 'Materiali'") && view.includes("'data-study-toggle-form': 'asset'") && view.includes("'data-study-toggle-form': 'link'") && view.includes('Lettura tecnica')],
  ['Premium UI rimuove il subtitle ridondante di Lettura tecnica', !view.includes('Quattro macroaree di partenza. Apri, modifica o salva il tuo template personale.')],
  ['R2.2 Lettura tecnica usa superficie esterna neutra', css.includes('STAFF R2.2 — Technical Reading Density canonical owner') && css.includes('.match-opponent-study .match-study-analysis-panel{') && css.includes('background:transparent')],
  ['R2.2 toolbar template e una command row senza box annidato', css.includes('.match-study-analysis-panel .analysis-template-toolbar{') && css.includes('border:0') && css.includes('box-shadow:none')],
  ['R2.2 label Template di partenza resta accessibile ma non visibile', css.includes('.analysis-template-apply label>span') && css.includes('clip:rect(0,0,0,0)')],
  ['R2.2 helper statico toolbar e soppresso senza nascondere form-message', css.includes('.analysis-template-toolbar>p:not(.form-message)') && css.includes('.analysis-template-toolbar>small')],
  ['Premium UI mostra sorgente link leggibile senza perdere URL reale', view.includes('linkSourceLabel') && view.includes('metaHtml: `<span title="${escapeHtml(link.url)}">') && view.includes('href: escapeHtml(link.url)')],
  ['R2.1 Compact Resource condiviso è il physical owner', resourceCss.includes('.staff-resource-section') && resourceCss.includes('.staff-resource-row') && !css.includes('.match-study-resource{')],
  ['R2.1 simmetria header azioni senza footer isolati', view.includes('reportHeaderAction') && view.includes('materialsHeaderActions') && !view.includes('match-study-card-footer')],
  ['R2.1 indici 01/02 passano dalla primitiva condivisa', /index:\s*'01'/.test(view) && /index:\s*'02'/.test(view) && resourceCss.includes('.staff-resource-index')],
  ['R2.1 rimozione vive nel menu overflow', view.includes('overflowActionMenuHtml') && /iconName:\s*'trash'/.test(view)],
  ['R2.1 shared UI resta domain-neutral', components.includes('resourceSectionHeaderHtml') && !resourceCss.includes('.match-study-')],
  ['Controller protegge doppio invio durante upload', controller.includes('setBusy(form, true)') && controller.includes('disabled = busy')],
  ['Controller serializza note prima del busy', /const form = event\.currentTarget\s+const data = Object\.fromEntries\(new FormData\(form\)\.entries\(\)\)\s+setBusy\(form, true\)\s+setMessage\(section, 'notes', ''\)/.test(controller)],
  ['Controller serializza link prima del busy', /const form = event\.currentTarget\s+const data = Object\.fromEntries\(new FormData\(form\)\.entries\(\)\)\s+setBusy\(form, true\)\s+setMessage\(section, 'link', ''\)/.test(controller)],
  ['Controller fotografa metadata upload prima del busy', /const file = form\.elements\.file\?\.files\?\.\[0\]\s+const data = Object\.fromEntries\(new FormData\(form\)\.entries\(\)\)\s+setBusy\(form, true\)/.test(controller)],
  ['Link persistence viene awaited', controller.includes('await service.addLink(matchId, data)')],
  ['Refresh link non puo mentire sul salvataggio canonico', controller.includes('Link salvato. Aggiorna la pagina per visualizzarlo.')],
  ['Link salvati si aprono in nuova scheda in sicurezza', view.includes('href: escapeHtml(link.url)') && view.includes("target: '_blank'") && view.includes("rel: 'noopener noreferrer'") && components.includes('return `<a ${attrs}>')],
  ['Persistenza Studio risolve dopo update e reload canonici', service.includes('await updateEvent(event.id') && service.includes("if (typeof reloadEvents === 'function') await reloadEvents()")],
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
