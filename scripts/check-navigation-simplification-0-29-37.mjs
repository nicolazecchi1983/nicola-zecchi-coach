import fs from 'node:fs'

const nav = fs.readFileSync('src/app/appNavigation.js', 'utf8')
const access = fs.readFileSync('src/core/accessControl.js', 'utf8')
const shell = fs.readFileSync('src/design-system/appShell.css', 'utf8')
const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const checks = [
  ['Board is absent from active desktop/mobile navigation', !/\['board',\s*'Board'/.test(nav)],
  ['Metodologia is absent from active desktop/mobile navigation', !/\['methodology',\s*'Metodologia'/.test(nav)],
  ['Rosa remains in active navigation', /\['squad',\s*'Rosa',\s*'squad'\]/.test(nav)],
  ['Impostazioni remains in active navigation', /\['settings',\s*'Impostazioni',\s*'settings'\]/.test(nav)],
  ['frozen product contract explicitly names Board and Metodologia', /FROZEN_PRODUCT_SECTIONS\s*=\s*Object\.freeze\(\['board',\s*'methodology'\]\)/.test(access)],
  ['normal access is denied before capability resolution', /if \(FROZEN_PRODUCT_SECTION_SET\.has\(sectionKey\)\) return false/.test(access)],
  ['Board implementation is preserved in the repository', controller.includes('board: boardView') && main.includes("./modules/board/board.css")],
  ['desktop sidebar keeps safe scroll fallback', /\.sidebar-nav\s*\{[\s\S]*?overflow-y:\s*auto;/.test(shell)],
  ['desktop scrollbar chrome remains hidden', /\.sidebar-nav\s*\{[\s\S]*?scrollbar-width:\s*none;/.test(shell) && /\.sidebar-nav::\-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/.test(shell)],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.29.37 NAVIGATION SIMPLIFICATION: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
