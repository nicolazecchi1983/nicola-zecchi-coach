import fs from 'node:fs'
import path from 'node:path'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const ROOT = 'src'
const JS_RE = /\.js$/
const STAGED_EXPLICIT_FALLBACK_RE = /getDataAccessUserMessage(?:\?\.)?\([^\n]*?,\s*['"`][^\n]*?['"`]\s*,\s*\{\s*stage:/

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return JS_RE.test(entry.name) ? [full] : []
  })
}

const feedback = fs.readFileSync('src/infrastructure/dataAccess/dataAccessUserFeedback.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const violations = []
for (const file of walk(ROOT)) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
    if (STAGED_EXPLICIT_FALLBACK_RE.test(line)) violations.push(`${file}:${index + 1}: ${line.trim()}`)
  })
}

const requiredStages = [
  'calendar-event-create', 'calendar-event-update', 'calendar-event-delete',
  'team-settings-save', 'roster-player-save', 'player-profile-save',
  'staff-user-create', 'match-create', 'training-publish', 'training-draft-save',
]
const checks = [
  ['Canonical stage fallback map exists', feedback.includes('export const DATA_ACCESS_USER_FALLBACKS')],
  ['Canonical fallback resolver exists', feedback.includes('export function getDataAccessUserFallback')],
  ['Unknown stage has generic fallback', feedback.includes("DATA_ACCESS_USER_FALLBACKS['data-access']")],
  ['Migrated staged calls do not duplicate literal fallbacks', violations.length === 0],
  ...requiredStages.map((stage) => [`Fallback map contains ${stage}`, feedback.includes(`'${stage}':`)]),
  ['Guard registered', Boolean(pkg.scripts['check:error-ux-stage-fallbacks'])],
  ['Guard included in npm run check', releaseGateIncludes(pkg, 'check:error-ux-stage-fallbacks')],
]

for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (violations.length) {
  console.error('\nDuplicated staged fallback literals detected:')
  violations.forEach((item) => console.error(`- ${item}`))
}
const failed = checks.filter(([, ok]) => !ok)
if (failed.length) process.exit(1)
console.log(`ERROR UX STAGE FALLBACKS: OK (${checks.length}/${checks.length})`)
