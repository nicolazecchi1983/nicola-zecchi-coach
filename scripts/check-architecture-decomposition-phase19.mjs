import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/legacyMatchCompatibilityView.js', 'utf8')
const adapters = fs.readFileSync('src/app/appViewAdapters.js', 'utf8')
const opponent = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')

const checks = [
  ['Legacy Match compatibility view physically extracted', view.includes('export function createLegacyMatchCompatibilityView')],
  ['Controller composes compatibility view through factory', app.includes('createLegacyMatchCompatibilityView({')],
  ['Compatibility markup no longer lives in controller', !app.includes('<h1>Compatibilità Match</h1>') && view.includes('<h1>Compatibilità Match</h1>')],
  ['Legacy score controls moved with compatibility view', !app.includes('function scoreFieldsHtml(') && view.includes('function scoreFieldsHtml(')],
  ['Match Squad composition remains in Match UI owner', view.includes('renderMatchSquadStep({')],
  ['Opponent analysis schema remains in Match UI owner', opponent.includes("name: 'opponent_analysis_schema'") && opponent.includes('renderMatchAnalysisSchemaEditor({')],
  ['Controller injects only runtime/domain context', app.includes('canEditMatch: () => can(ACCESS_CAPABILITIES.MATCH_SHEET_EDIT)') && app.includes('getEditorIdentity: () => ({')],
  ['Compatibility view has no Supabase dependency', !view.includes('supabase')],
  ['Compatibility view has no appState dependency', !view.includes('appState')],
  ['App adapters still consume compatibility view contract', adapters.includes('legacyMatchCompatibilityView,') && adapters.includes('legacyEditorHtml: legacyMatchCompatibilityView()')],
  ['Legacy editor runtime owner remains separate', !view.includes('addEventListener(') && !view.includes('createMatchDraftService')],
  ['Controller reduced to about one thousand lines', app.split('\n').length < 1050],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nArchitecture Decomposition Phase 19: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
