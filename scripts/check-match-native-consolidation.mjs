import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/app/appController.js', import.meta.url), 'utf8')
const nav = fs.readFileSync(new URL('../src/app/appNavigation.js', import.meta.url), 'utf8')
const access = fs.readFileSync(new URL('../src/core/accessControl.js', import.meta.url), 'utf8')
const nativeView = fs.readFileSync(new URL('../src/modules/match/ui/matchNativeSectionView.js', import.meta.url), 'utf8')
const studyView = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyView.js', import.meta.url), 'utf8')
const studyController = fs.readFileSync(new URL('../src/modules/match/ui/matchOpponentStudyController.js', import.meta.url), 'utf8')
const printEngine = fs.readFileSync(new URL('../src/shared/print/printEngine.js', import.meta.url), 'utf8')
const pdfService = fs.readFileSync(new URL('../src/services/pdfService.js', import.meta.url), 'utf8')

const checks = [
  ['Match Sheet Editor non registrato come route', !app.includes("'match-sheet': matchSheetEditorView") && !nav.includes("['match-sheet', 'Match Sheet Editor']")],
  ['Nostra squadra è route nativa', app.includes("'our-team': nativeOurTeamView") && access.includes("'our-team': ACCESS_CAPABILITIES.MATCH_SHEET_EDIT")],
  ['Avversario è route nativa', app.includes('opponent: nativeOpponentView') && access.includes('opponent: ACCESS_CAPABILITIES.MATCH_SHEET_EDIT')],
  ['Compatibilità legacy non espone header editor', nativeView.includes('match-native-legacy-host')],
  ['Materiali studio sono collezione aggiungibile', studyView.includes('data-study-toggle-form="asset"') && studyView.includes('＋ Aggiungi materiale')],
  ['Link studio sono collezione aggiungibile', studyView.includes('data-study-toggle-form="link"') && studyView.includes('＋ Aggiungi link')],
  ['Form opzionali possono aprire e chiudere', studyController.includes('setFormOpen') && studyController.includes('data-study-close-form')],
  ['Print Engine supporta CSS extra nel payload', printEngine.includes('normalizeExtraStyles') && printEngine.includes('extraStyles: styles')],
  ['PDF service non annida style nel contenuto', pdfService.includes('openPrintHtmlDocument({ title, html, className, styles })')],
  ['PDF convocazioni usa ruoli', app.includes("roleOrder = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante', 'Altro']") && app.includes('class="roles"')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed) process.exit(1)
console.log(`\nMatch native consolidation: ${checks.length}/${checks.length} controlli superati.`)
