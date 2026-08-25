import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/callupsView.js', 'utf8')
const owner = fs.readFileSync('src/modules/match/ui/callups.css', 'utf8')

const checks = [
  ['toolbar is action-only after context extraction', view.includes('callups-toolbar callups-toolbar--actions') && !view.includes('<label><span>Partita') && !view.includes('type="date"')],
  ['match metadata moved above bulk actions', view.indexOf('callups-match-context') >= 0 && view.indexOf('callups-match-context') < view.indexOf('callups-selection-bar')],
  ['PDF button has explicit 50px height', /\.callups-toolbar \[data-callups-pdf\]\s*\{[\s\S]*?height:\s*50px/.test(owner)],
  ['PDF button min-height matches actions', /\.callups-toolbar \[data-callups-pdf\]\s*\{[\s\S]*?min-height:\s*50px/.test(owner)],
  ['action cluster aligns to bottom edge', /\.callups-toolbar-actions\s*\{[\s\S]*?align-items:\s*end/.test(owner)],
  ['toolbar contains no retired visible match inputs', !owner.includes('.callups-toolbar input') && !owner.includes('.callups-toolbar label') && view.includes('type="hidden" name="callups_match"') && view.includes('type="hidden" name="callups_date"')],
]

let passed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (ok) passed += 1
}
console.log(`\nCallups Toolbar Alignment (C3 action-only): ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
