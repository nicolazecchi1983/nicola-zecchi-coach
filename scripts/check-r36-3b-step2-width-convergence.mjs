import fs from 'node:fs'

const css = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8').replace(/\r\n?/g, '\n')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8').replace(/\r\n?/g, '\n')

const block = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}', 's'))?.[1] || ''
}

const roster = block('.ts-manual-editor .ts-roster-workspace')
const session = block('.ts-manual-editor .ts-session-grid')
const phases = block('.ts-manual-editor .ts-phases-editor')

const checks = [
  ['Step 02 retains one canonical roster workspace', (view.match(/data-roster-workspace/g) || []).length === 1],
  ['Step 02 width is bounded by Training canonical section max', roster.includes('width: min(100%, var(--training-section-max));')],
  ['Step 02 canonical workspace is centered', roster.includes('margin-inline: auto;')],
  ['Step 02 keeps min-width zero for responsive safety', roster.includes('min-width: 0;')],
  ['Step 02 is no longer desktop full-width', !/^\s*width:\s*100%;/m.test(roster)],
  ['Step 01 uses the same canonical width token', session.includes('width: min(100%, var(--training-section-max));')],
  ['Step 03 uses the same canonical width token', css.includes('.ts-manual-editor .ts-step[data-ts-step="3"] .ts-match-day-block,\n.ts-manual-editor .ts-step[data-ts-step="3"] .ts-load-grid {\n  width: min(100%, var(--training-section-max));')],
  ['Step 04 uses the same canonical width token', phases.includes('width: min(100%, var(--training-section-max));')],
  ['R36.3A child geometry remains full-width inside the bounded workspace', css.includes('.ts-manual-editor .ts-roster-workspace__summary {') && css.includes('.ts-manual-editor .ts-roster-list-shell {') && css.includes('.ts-manual-editor .ts-roster-list {')],
  ['Aggregati remains inside bounded Step 02 workspace after R36.3C', view.indexOf('ts-roster-aggregated') > view.indexOf('ts-roster-list-toolbar') && view.indexOf('ts-roster-aggregated') < view.indexOf('data-roster-list')],
  ['No important escalation in R36.3A/R36.3B roster owner', !(css.split('/* R36.3A — STEP 02 ROSTER WORKSPACE SINGLE OWNER */')[1] || '').includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3B Step 02 Width Convergence: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
