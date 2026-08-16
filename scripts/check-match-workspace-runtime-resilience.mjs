import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const analysis = fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js', 'utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')

const navBinding = "root.querySelectorAll('[data-match-context-section]').forEach"
const checks = [
  ['Match navigation owner is wired before Legacy Match runtime', controller.indexOf('wireMatchAnalysisEvents({') < controller.indexOf('wireLegacyMatchEditorEvents({')],
  ['workspace section navigation binds before analysis schema widgets', analysis.indexOf(navBinding) < analysis.indexOf('bindMatchAnalysisSchemaEditors(root')],
  ['analysis schema failure is isolated from workspace navigation', /try \{[\s\S]*?bindMatchAnalysisSchemaEditors\(root[\s\S]*?catch \(error\)/.test(analysis)],
  ['core lineup binding occurs before optional legacy analysis binding', legacy.indexOf('bindCoreSquadControls()') < legacy.indexOf('bindMatchAnalysisSchemaEditors(matchEditor')],
  ['legacy analysis schema failure cannot abort core lineup', /Match analysis schema binding failed; core lineup remains active/.test(legacy)],
  ['starter selects use explicit idempotent runtime ownership', /starterRuntimeBound/.test(legacy)],
  ['starter number inputs use explicit idempotent runtime ownership', /starterNumberRuntimeBound/.test(legacy)],
]
let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Workspace Runtime Resilience: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
