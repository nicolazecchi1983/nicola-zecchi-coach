import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const legacyView = fs.readFileSync('src/modules/match/ui/legacyMatchCompatibilityView.js', 'utf8')
const events = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const legacyCss = fs.readFileSync('src/modules/match/ui/matchSheet.css', 'utf8')
const globalCss = fs.readFileSync('src/style.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const architecture = fs.readFileSync('docs/MATCH_OPPONENT_V2_ARCHITECTURE.md', 'utf8')

const checks = [
  ['opponent has dedicated native view owner', legacyView.includes("renderMatchOpponentStep") && view.includes('match-opponent-step')],
  ['initial system is a single top-level field', view.includes('name="opponent_system_0"') && view.includes('opponent-initial-system-control')],
  ['old standalone systems section is retired', !view.includes('Sistemi di gioco avversari') && !legacyView.includes('Sistemi di gioco avversari')],
  ['field and uploaded sheet share canonical 50/50 core', css.includes('.opponent-core-layout') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')],
  ['empty sheet does not stretch to pitch height', css.includes('align-items: start') && css.includes('.opponent-sheet-panel {\n  align-self: start;') && !css.includes('min-height: 420px') && !css.includes('border: 1px dashed') && !css.includes('flex: 1 1 auto')],
  ['empty sheet has premium document hierarchy', view.includes('opponent-sheet-acquisition__glyph') && view.includes('Carica la distinta avversaria') && view.includes('Fotografa il foglio oppure scegli un documento dal dispositivo.') && view.includes('JPG · PNG · PDF')],
  ['camera and file actions remain distinct inside one asset surface', view.includes('opponent-sheet-acquisition__action--primary') && view.includes('name="opponent_sheet_camera"') && view.includes('name="opponent_sheet_file"')],
  ['remove action is contextual and hidden by default', view.includes('opponent-sheet-panel__header-actions') && view.includes('data-remove-opponent-sheet hidden>Rimuovi</button>') && css.includes('.opponent-sheet-remove[hidden] {\n  display: none;')],
  ['loaded image and PDF have dedicated premium surfaces', css.includes('.opponent-sheet-upload img {') && css.includes('.opponent-sheet-document:hover') && view.includes('opponent-sheet-document__copy') && view.includes('Documento gara')],
  ['empty acquisition density is contract-bound', css.includes('min-height: 258px;\n  box-sizing: border-box;\n  display: grid;') && css.includes('.opponent-sheet-acquisition {\n    min-height: 0;')],
  ['loaded asset hides acquisition surface', view.includes('data-opponent-sheet-empty') && css.includes('.opponent-sheet-acquisition[hidden] {\n  display: none;\n}') && !css.includes('.opponent-sheet-acquisition[hidden] {\n  display: none !important;')],
  ['mobile empty state reflows without fake vertical filler', css.includes('grid-template-areas:\n      "glyph copy"\n      "actions actions"\n      "formats formats";') && css.includes('.opponent-sheet-acquisition__actions {\n    width: 100%;\n    grid-template-columns: 1fr;')],
  ['color palette is progressive disclosure', view.includes('opponent-appearance-disclosure') && view.includes('Cambia colori') && view.includes('<details')],
  ['persisted opponent appearance fields remain canonical', view.includes('opponent_token_primary') && view.includes('opponent_token_secondary') && view.includes('opponent_token_pattern')],
  ['system changes live inside opponent reading', view.includes('opponent-reading-surface') && view.includes('Lettura avversario') && view.includes('Registra cambio') && !view.includes('Variazioni sistema')],
  ['system-change runtime starts after initial index', events.includes('let opponentFormationCount = 1') && events.includes('requestedIndex >= 1')],
  ['initial formation drives field layout', events.includes('opponentInitialSystemSelect') && events.includes('updateOpponentPitch(opponentInitialSystemSelect.value)')],
  ['legacy opponent geometry removed from Match Sheet owner', !legacyCss.includes('.opponent-football-pitch') && !legacyCss.includes('.opponent-token{') && !legacyCss.includes('.opponent-formations-panel')],
  ['global style no longer owns opponent token geometry', !globalCss.includes('.opponent-token') && !globalCss.includes('.opponent-token-style')],
  ['global responsive layer no longer owns opponent native geometry', !responsive.includes('.opponent-top-grid--visual') && !responsive.includes('.opponent-token-style') && !responsive.includes('.opponent-football-pitch')],
  ['canonical opponent CSS is imported', main.includes("import './modules/match/ui/matchOpponent.css'")],
  ['architecture documents backward-compatible fields', architecture.includes('No new database table') && architecture.includes('opponent_system_1..5')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`Match Opponent v2 Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
