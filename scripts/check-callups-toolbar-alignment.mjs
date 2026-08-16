import fs from 'node:fs'

const css = fs.readFileSync(new URL('../src/modules/match/ui/callups.css', import.meta.url), 'utf8')
const checks = [
  ['toolbar remains a grid', /\.callups-toolbar\s*\{[^}]*display:\s*grid/s.test(css)],
  ['toolbar aligns controls to bottom edge', /\.callups-toolbar\s*\{[^}]*align-items:\s*end/s.test(css)],
  ['PDF button has explicit 50px height', /\[data-callups-pdf\]\s*\{[^}]*height:\s*50px/s.test(css)],
  ['PDF button min-height matches fields', /\[data-callups-pdf\]\s*\{[^}]*min-height:\s*50px/s.test(css)],
  ['PDF button bottom aligned', /\[data-callups-pdf\]\s*\{[^}]*align-self:\s*end/s.test(css)],
  ['callups inputs remain 50px', /\.callups-toolbar input\s*\{[^}]*height:\s*50px/s.test(css)],
]
let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) failed++
}
console.log(`\nCallups Toolbar Alignment: ${checks.length-failed}/${checks.length}`)
if (failed) process.exit(1)
