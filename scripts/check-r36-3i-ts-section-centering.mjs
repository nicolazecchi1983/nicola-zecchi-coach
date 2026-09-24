import fs from 'node:fs'

const css = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8').replace(/\r\n?/g, '\n')
const view = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8').replace(/\r\n?/g, '\n')
const legacy = fs.readFileSync('src/design-system/training-editor.css', 'utf8').replace(/\r\n?/g, '\n')

function block(selector) {
  const start = css.indexOf(selector)
  if (start < 0) return ''
  const brace = css.indexOf('{', start + selector.length)
  if (brace < 0) return ''
  let depth = 0
  for (let i = brace; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(brace + 1, i)
    }
  }
  return ''
}

const workspace = block('.ts-manual-editor .ts-workspace--steps')
const active = block('.ts-manual-editor .ts-step.is-active')
const footer = block('.ts-manual-editor .ts-step-footer')
const summary = block('.ts-manual-editor .ts-roster-workspace__summary')
const present = block('.ts-manual-editor .ts-present-count')
const totals = block('.ts-manual-editor .ts-roster-status-totals')

const checks = [
  ['Training still exposes exactly six editor steps', (view.match(/data-ts-step="[1-6]"/g) || []).length === 6],
  ['Training step workspace explicitly retires generic grid geometry', workspace.includes('display: block;') && workspace.includes('width: 100%;') && workspace.includes('min-width: 0;') && workspace.includes('margin: 0;')],
  ['All active steps use canonical Training section width', active.includes('width: min(100%, var(--training-section-max));') && active.includes('max-width: var(--training-section-max);')],
  ['All active steps are centered by their structural owner', active.includes('margin-inline: auto;') && active.includes('min-width: 0;')],
  ['Footer uses the same canonical Training width', footer.includes('width: min(100%, var(--training-section-max));') && footer.includes('max-width: var(--training-section-max);')],
  ['Footer shares the same center axis', footer.includes('margin-inline: auto;') && footer.includes('min-width: 0;')],
  ['Footer is structurally inside the Training workspace', /<div class="ts-workspace ts-workspace--steps">[\s\S]*<footer class="ts-step-footer" data-ts-step-footer>[\s\S]*<\/footer>\s*<\/div>/.test(view)],
  ['Training footer no longer inherits Match footer ownership', !view.includes('match-form-footer ts-step-footer') && !view.includes('class="match-form-footer')],
  ['Legacy footer important geometry is retired', !legacy.split('\n').some((line) => line.includes('ts-step-footer') && line.includes('!important'))],
  ['Canonical Training footer keeps centered section geometry', footer.includes('width: min(100%, var(--training-section-max));') && (footer.includes('margin: var(--staff-space-4) auto 0;') || footer.includes('margin-inline: auto;'))],
  ['Step 01 child still derives from canonical section token', css.includes('.ts-manual-editor .ts-session-grid {') && css.includes('width: min(100%, var(--training-section-max));')],
  ['Step 02 roster workspace remains canonical-width', css.includes('.ts-manual-editor .ts-roster-workspace {') && css.includes('width: min(100%, var(--training-section-max));')],
  ['Step 03 load surfaces still use canonical section token', css.includes('.ts-manual-editor .ts-step[data-ts-step="3"] .ts-match-day-block') && css.includes('.ts-manual-editor .ts-step[data-ts-step="3"] .ts-load-grid')],
  ['Step 04 phases editor remains Training-owned', css.includes('.ts-manual-editor .ts-phases-editor {')],
  ['Step 05 objective surfaces remain Training-owned', css.includes('.ts-manual-editor .ts-step[data-ts-step="5"] .ts-pillars') && css.includes('.ts-manual-editor .ts-step[data-ts-step="5"] .ts-analysis-fields')],
  ['Presenti summary is vertically centered', summary.includes('align-items: center;') && present.includes('align-self: center;')],
  ['Availability totals share the same vertical center', totals.includes('align-self: center;')],
  ['Presenti helper copy is retired after manual acceptance', !view.includes('Calcolati automaticamente dalla Rosa') && view.includes('data-present-count-display')],
  ['No domain or persistence hooks were changed', view.includes('name="present"') && view.includes('data-roster-status-count') && view.includes('data-player-search')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3I TS Section Centering: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
