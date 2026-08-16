import fs from 'node:fs'

const style = fs.readFileSync('src/style.css', 'utf8')
const login = fs.readFileSync('src/modules/auth/login.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['login owner exists', login.includes('.login-page')],
  ['login card owned by login.css', login.includes('.login-card')],
  ['password field owned by login.css', login.includes('.password-field')],
  ['auth message owned by login.css', login.includes('.auth-message')],
  ['style has no login page owner', !/\.login-page\s*\{/.test(style)],
  ['style has no login card owner', !/\.login-card\s*\{/.test(style)],
  ['style has no password field owner', !/\.password-field\s*\{/.test(style)],
  ['style has no auth message owner', !/\.auth-message\s*\{/.test(style)],
  ['style no longer owns shared primary button', !/\.primary-button\s*,?\s*(?:\n\s*)?\.primary-action\s*\{/.test(style) && !/\.primary-button\s*\{/.test(style)],
  ['login owner imported', main.includes("import './modules/auth/login.css'")],
  ['login owner does not redefine shared primary button', !/\.primary-button\s*\{/.test(login)],
  ['login owner does not redefine primary action', !/\.primary-action\s*\{/.test(login)],
]

let passed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (ok) passed++
}
console.log(`DS Legacy Cleanup Pass 20: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
