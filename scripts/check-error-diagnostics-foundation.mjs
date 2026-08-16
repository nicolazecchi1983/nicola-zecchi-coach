import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const feedback = fs.readFileSync('src/infrastructure/dataAccess/dataAccessUserFeedback.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['diagnostic reporter is exported', feedback.includes('export function reportDataAccessDiagnostic')],
  ['diagnostic reporter normalizes errors centrally', feedback.includes('normalizeDataAccessError(error, { stage })')],
  ['diagnostic output carries stage', feedback.includes('stage: normalized.stage || stage')],
  ['diagnostic output carries classified code', feedback.includes('dataAccessCode: normalized.dataAccessCode')],
  ['diagnostic output carries retryability', feedback.includes('retryable: Boolean(normalized.retryable)')],
  ['diagnostic output carries HTTP status', feedback.includes('status: normalized.status ?? null')],
  ['diagnostic output carries source code', feedback.includes('sourceCode: normalized.sourceCode ?? null')],
  ['technical message is bounded', /value\.length > 500/.test(feedback)],
  ['console.error is the default sink', feedback.includes("globalThis.console?.error")],
  ['logger remains injectable', feedback.includes("logger = null") && feedback.includes('reportDataAccessDiagnostic(error, { stage, logger })')],
  ['diagnostic failures never break user feedback', /catch \{\s*return null\s*\}/.test(feedback)],
  ['user-facing fallback still protects unknown errors', feedback.includes('normalized.dataAccessCode === DATA_ACCESS_ERROR_CODES.UNKNOWN) return resolvedFallback')],
  ['release gate includes diagnostics foundation', releaseGateIncludes(pkg, 'check:error-diagnostics-foundation')],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) failed += 1
}
if (failed) {
  console.error(`Error Diagnostics Foundation: ${checks.length - failed}/${checks.length}`)
  process.exit(1)
}
console.log(`Error Diagnostics Foundation: ${checks.length}/${checks.length}`)
