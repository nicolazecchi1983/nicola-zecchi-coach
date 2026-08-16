import fs from 'node:fs'

const read = p => fs.readFileSync(p, 'utf8')
const legacy = read('src/style.css')
const owner = read('src/modules/profile/profile.css')
const controls = read('src/design-system/controls.css')
const main = read('src/main.js')

const checks = [
  ['profile owner exists', owner.length > 1200],
  ['profile owner imported', main.includes("./modules/profile/profile.css")],
  ['profile grid owned by profile module', owner.includes('.profile-page-grid {')],
  ['profile avatar owned by profile module', owner.includes('.profile-page-avatar {')],
  ['profile responsive owned by profile module', owner.includes('@media (max-width: 760px)') && owner.includes('@media (max-width: 480px)')],
  ['shared form stack owned by controls', controls.includes('.form-field {') && controls.includes('display: grid;')],
  ['shared form feedback owned by controls', controls.includes('.form-message {') && controls.includes('.form-message.is-error') && controls.includes('.form-message.is-success')],
  ['legacy has no profile selectors', !/\.profile-(?:page-grid|page-avatar|card-head|card)(?:\b|\s|\{|:)/.test(legacy)],
  ['legacy has no generic form-field control owner', !/\.form-field\s+(?:input|select|textarea)/.test(legacy)],
  ['legacy has no generic form-message state owner', !/\.form-message\.is-(?:error|success)/.test(legacy)],
  ['legacy records migration boundary', legacy.includes('PROFILE — ownership migrated to src/modules/profile/profile.css in 0.27.25.')],
  ['legacy remains below 4600 lines', legacy.split(/\r?\n/).length < 4600],
]

let ok = 0
for (const [name, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${name}`)
  if (pass) ok++
}
console.log(`\nDS Legacy Cleanup Pass 12: ${ok}/${checks.length}`)
if (ok !== checks.length) process.exit(1)
