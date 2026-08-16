import fs from 'node:fs'
import path from 'node:path'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const ROOT = 'src'
const JS_RE = /\.js$/
const RAW_ERROR_RE = /(?:error|err|response\.error)(?:\?\.)?\.message/
const USER_SINK_RE = /(?:textContent|innerHTML|alertUser|showAccessNotice|setMessage|setTemplateMessage|setTsSaveState)/

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return JS_RE.test(entry.name) ? [full] : []
  })
}

const violations = []
for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    if (RAW_ERROR_RE.test(line) && USER_SINK_RE.test(line)) {
      violations.push(`${file}:${index + 1}: ${line.trim()}`)
    }
  })
}

const feedback = fs.readFileSync('src/infrastructure/dataAccess/dataAccessUserFeedback.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const checks = [
  ['No raw error.message is written directly to known user-facing sinks', violations.length === 0],
  ['Canonical user-feedback adapter remains present', feedback.includes('export function getDataAccessUserMessage')],
  ['Existing AppError userMessage remains authoritative', feedback.includes("getUserErrorMessage(error, '')")],
  ['Unknown raw errors fall back instead of exposing their message', feedback.includes('DATA_ACCESS_ERROR_CODES.UNKNOWN) return resolvedFallback')],
  ['Guard registered in package scripts', Boolean(pkg.scripts['check:raw-error-message-exposure'])],
  ['Guard included in npm run check', releaseGateIncludes(pkg, 'check:raw-error-message-exposure')],
]

for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (violations.length) {
  console.error('\nRaw user-facing error.message exposure detected:')
  violations.forEach((item) => console.error(`- ${item}`))
}
const failed = checks.filter(([, ok]) => !ok)
if (failed.length) process.exit(1)
console.log(`RAW ERROR MESSAGE EXPOSURE: OK (${checks.length}/${checks.length})`)
