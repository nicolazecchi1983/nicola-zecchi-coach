import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n')
const presentation = read('src/modules/training/ui/trainingPresentationBuilders.js')
const view = read('src/modules/training/ui/trainingSheetEditorPageView.js')
const polish = read('src/modules/training/trainingPolish.css')
const r36 = polish.split('/* R36.3 — ROSTER STATUS LIST + LOAD INDEX */')[1] || ''

const checks = [
  ['Training roster displays canonical player full_name order', presentation.includes('displayName: canonicalName,')],
  ['Surname-first display reconstruction is retired', !presentation.includes('displayName: `${surname} ${firstName}`.trim(),') && !presentation.includes("const firstName = parts.join(' ')")],
  ['Compound names are not hardcoded', !presentation.includes('Di Lieto')],
  ['Redundant per-player helper copy is absent', !view.includes('Per ogni giocatore scegli Presente, Assente, Infortunato o Differenziato.')],
  ['Roster toolbar has search plus Aggregati utility track', r36.includes('grid-template-columns: repeat(2, minmax(0, 1fr));') && r36.includes('align-items: stretch;') && r36.includes('R36.3D — ROSTER UTILITY ROW ALIGNMENT')],
  ['Roster helper-specific CSS is retired', !r36.includes('.ts-manual-editor .ts-roster-list-toolbar > small')],
  ['Roster clear control has compact Training-owned geometry', r36.includes('.ts-manual-editor .ts-player-search--roster [data-clear-player-search]') && r36.includes('width: 40px;') && r36.includes('height: 40px;') && r36.includes('padding: 0;')],
  ['Cleanup preserves R36.3 roster/load contract', view.includes('data-player-status') && view.includes('data-roster-list') && view.includes('data-load-score') && view.includes('<option>Recupero</option>') && view.includes('<option>Aerobico</option>')],
  ['R36.3 presentation still avoids important escalation', !r36.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label)
  if (ok) passed += 1
}
console.log('R36.3 Acceptance Cleanup: ' + passed + '/' + checks.length)
if (passed !== checks.length) process.exit(1)
