import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const polish = read('src/modules/training/trainingPolish.css')
const legacy = read('src/design-system/training-editor.css')
const responsive = read('src/design-system/responsive.css')
const r36a = polish.split('/* R36.3A — STEP 02 ROSTER WORKSPACE SINGLE OWNER */')[1] || ''

const workspaceStart = view.indexOf('<div class="ts-roster-workspace" data-roster-workspace>')
const summaryPos = view.indexOf('ts-roster-workspace__summary', workspaceStart)
const searchPos = view.indexOf('ts-roster-list-shell', workspaceStart)
const aggregatedPos = view.indexOf('ts-roster-aggregated', workspaceStart)
const workspaceEnd = view.indexOf('</section>', workspaceStart)

const checks = [
  ['Step 02 has one canonical roster workspace', workspaceStart >= 0 && (view.match(/data-roster-workspace/g) || []).length === 1],
  ['Summary search list and aggregated belong to the same workspace', workspaceStart < summaryPos && summaryPos < searchPos && searchPos < aggregatedPos && aggregatedPos < workspaceEnd],
  ['Active markup no longer uses legacy roster-summary geometry', !view.includes('class="ts-roster-summary"') && !view.includes('class="ts-roster-grid')],
  ['Player status/search persistence hooks are unchanged', view.includes('data-player-status') && view.includes('data-player-search') && view.includes('data-clear-player-search') && view.includes('data-roster-list')],
  ['Training polish owns the canonical section-width workspace', /\.ts-manual-editor \.ts-roster-workspace\s*\{[^}]*width:\s*min\(100%, var\(--training-section-max\)\);[^}]*min-width:\s*0;[^}]*margin-inline:\s*auto;/s.test(r36a)],
  ['Canonical summary shares the same full-width axis', r36a.includes('.ts-manual-editor .ts-roster-workspace__summary {') && r36a.includes('justify-content: space-between;')],
  ['Desktop utility row aligns Search and Aggregati as equal peers', r36a.includes('grid-template-columns: repeat(2, minmax(0, 1fr));') && r36a.includes('align-items: stretch;') && r36a.includes('R36.3D — ROSTER UTILITY ROW ALIGNMENT')],
  ['Mobile derives from the same Training owner', r36a.includes('@media (max-width: 760px)') && r36a.includes('.ts-manual-editor .ts-roster-workspace__summary')],
  ['Legacy/global CSS do not know the new workspace selectors', !legacy.includes('ts-roster-workspace') && !responsive.includes('ts-roster-workspace')],
  ['Legacy roster-summary selectors are detached from active DOM', (legacy.includes('ts-roster-summary') || responsive.includes('ts-roster-summary') || polish.includes('ts-roster-summary')) && !view.includes('ts-roster-summary')],
  ['Structural convergence adds no important escalation', !r36a.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3A Roster Workspace Ownership: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
