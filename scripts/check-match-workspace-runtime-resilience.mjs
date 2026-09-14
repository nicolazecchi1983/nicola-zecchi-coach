import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const analysis = fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js', 'utf8')
const workspaceEvents = fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js', 'utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')

const checks = [
  ['Shared Match navigation owner is wired before Analysis and Legacy Match runtime', controller.indexOf('wireMatchWorkspaceEvents({') < controller.indexOf('wireMatchAnalysisEvents({') && controller.indexOf('wireMatchAnalysisEvents({') < controller.indexOf('wireLegacyMatchEditorEvents({')],
  ['workspace navigation is delegated by the shared Match owner', workspaceEvents.includes("event.target.closest('[data-workspace-action]')") && workspaceEvents.includes('data-return-to-match-workspace')],
  ['Analysis no longer owns workspace navigation bindings', !analysis.includes('data-match-context-section') && !analysis.includes('data-return-to-match-workspace')],
  ['analysis schema failure is isolated from shared workspace navigation', /try \{[\s\S]*?bindMatchAnalysisSchemaEditors\(root[\s\S]*?catch \(error\)/.test(analysis)],
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
