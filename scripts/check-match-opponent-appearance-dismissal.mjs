import fs from 'node:fs'

const view = fs.readFileSync('src/modules/match/ui/matchOpponentView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchOpponent.css', 'utf8')
const runtime = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')

const checks = [
  ['popover exposes an explicit close action', /data-close-opponent-appearance/.test(view)],
  ['close action is a real button', /<button[^>]+data-close-opponent-appearance/.test(view)],
  ['close action has accessible copy', /aria-label="Chiudi pannello colori"/.test(view)],
  ['runtime resolves canonical disclosure owner', /querySelector\('\.opponent-appearance-disclosure'\)/.test(runtime)],
  ['runtime closes native details state', /opponentAppearanceDisclosure\.open = false/.test(runtime)],
  ['runtime restores focus to disclosure summary', /opponentAppearanceSummary\?\.focus\?\.\(\)/.test(runtime)],
  ['Escape is supported while popover is open', /event\.key !== 'Escape'/.test(runtime) && /preventDefault\(\)/.test(runtime)],
  ['mobile popover is bounded by viewport top', /top:\s*max\(12px,\s*env\(safe-area-inset-top\)\)/.test(css)],
  ['mobile popover is bounded by viewport bottom', /bottom:\s*max\(12px,\s*env\(safe-area-inset-bottom\)\)/.test(css)],
  ['mobile popover owns vertical scrolling', /overflow-y:\s*auto/.test(css)],
  ['popover header remains reachable while scrolling', /position:\s*sticky/.test(css) && /opponent-appearance-popover-head/.test(css)],
  ['dismissal stays inside Match opponent domain', !/data-close-opponent-appearance/.test(fs.readFileSync('src/design-system/responsive.css', 'utf8'))],
]

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`FAIL  ${label}`)
    process.exitCode = 1
  } else {
    console.log(`PASS  ${label}`)
    passed += 1
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`R3.4B Opponent Appearance Mobile Dismissal: ${passed}/${checks.length}`)
