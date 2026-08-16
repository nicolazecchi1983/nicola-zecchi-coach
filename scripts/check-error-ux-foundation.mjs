import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const read = (file) => fs.readFileSync(file, 'utf8')
const feedback = read('src/infrastructure/dataAccess/dataAccessUserFeedback.js')
const controller = read('src/app/appController.js')
const training = read('src/modules/training/events/trainingEditorEvents.js')
const matchLibrary = read('src/modules/match/events/matchLibraryEvents.js')
const roster = read('src/modules/team/events/teamRosterEvents.js')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['Feedback helper canonical exists', feedback.includes('export function getDataAccessUserMessage')],
  ['Feedback normalizes data access errors', feedback.includes('normalizeDataAccessError')],
  ['Existing AppError userMessage wins', feedback.includes('getUserErrorMessage')],
  ['Composition root imports feedback helper', controller.includes("dataAccessUserFeedback.js")],
  ['Training publish receives centralized feedback', training.includes("stage: 'training-publish'")],
  ['Match create receives centralized feedback', matchLibrary.includes("stage: 'match-create'")],
  ['Team settings uses centralized feedback', roster.includes("stage: 'team-settings-save'")],
  ['Roster save uses centralized feedback', roster.includes("stage: 'roster-player-save'")],
  ['Roster remove uses centralized feedback', roster.includes("stage: 'roster-player-remove'")],
  ['Domain test exists', fs.existsSync('tests/domain/dataAccessUserFeedback.test.js')],
  ['Check registered', Boolean(pkg.scripts['check:error-ux-foundation'])],
  ['Check included in npm run check', releaseGateIncludes(pkg, 'check:error-ux-foundation')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exit(1)
console.log(`ERROR UX FOUNDATION: OK (${checks.length}/${checks.length})`)
