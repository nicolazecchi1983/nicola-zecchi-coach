import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const heavy = fs.readFileSync('src/app/appHeavyFeatureEvents.js', 'utf8')

const checks = [
  ['heavy feature loader exists', fs.existsSync('src/app/appHeavyFeatureEvents.js')],
  ['Training Editor is no longer statically imported by controller', !app.includes("import { wireTrainingEditorEvents } from '../modules/training/events/trainingEditorEvents.js'")],
  ['Training Draft/Voice is no longer statically imported by controller', !app.includes("import { wireTrainingDraftAndVoiceEvents } from '../modules/training/events/trainingDraftAndVoiceEvents.js'")],
  ['Legacy Match Editor is no longer statically imported by controller', !app.includes("import { wireLegacyMatchEditorEvents } from '../modules/match/events/legacyMatchEditorEvents.js'")],
  ['Training Editor has a real dynamic import boundary', heavy.includes("import('../modules/training/events/trainingEditorEvents.js')")],
  ['Training Draft/Voice has a real dynamic import boundary', heavy.includes("import('../modules/training/events/trainingDraftAndVoiceEvents.js')")],
  ['Legacy Match Editor has a real dynamic import boundary', heavy.includes("import('../modules/match/events/legacyMatchEditorEvents.js')")],
  ['Training heavy binders load only for training-sheet', heavy.includes("'training-sheet': () => Promise.all")],
  ['Legacy Match heavy binder loads for our-team', heavy.includes("'our-team': () => Promise.all")],
  ['Legacy Match heavy binder loads for opponent', heavy.includes("opponent: () => Promise.all")],
  ['Dashboard has no heavy feature loader', !heavy.includes("dashboard:" )],
  ['workspace activation passes active key into dynamic binding', app.includes('afterActivate: async ({ key }) =>') && app.includes('await bindDynamic(key)')],
  ['internal rebind resolves active workspace key', app.includes("workspaceEngine.getActiveKey?.() || 'dashboard'")],
  ['feature wiring receives performance timing marks', app.includes('staff:feature-wire:${activeKey}:start') && app.includes('staff:feature-wire:${activeKey}:end')],
  ['lazy loader is imported from app-owned boundary', app.includes("import { loadHeavyFeatureEventBinders } from './appHeavyFeatureEvents.js'")],
  ['lazy loader merges only loaded modules', heavy.includes('Object.assign({}, ...modules)')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}

console.log(`\nR2.1D Feature Code Splitting Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
