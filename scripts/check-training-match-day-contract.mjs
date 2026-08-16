import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [view, model, migration, matchCalendar] = await Promise.all([
  readFile(new URL('../src/modules/training/ui/trainingSheetEditorPageView.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/training/trainingSheetModel.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/20260812_training_match_day_constraint_r3.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/match/matchCalendarService.js', import.meta.url), 'utf8'),
])

const values = ['PREPARAZIONE','MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD']
const checks = [
  ['Training UI exposes canonical MD values', values.every((value) => view.includes(`'${value}'`))],
  ['Training payload persists match_day canonically', model.includes('match_day: data.match_day || null')],
  ['Migration replaces events_match_day_check', migration.includes('drop constraint if exists events_match_day_check') && migration.includes('add constraint events_match_day_check')],
  ['Migration accepts every Training MD value', values.every((value) => migration.includes(`'${value}'`))],
  ['Migration keeps NULL valid', /match_day is null/i.test(migration)],
  ['Match domain never writes league round to events.match_day', matchCalendar.includes('match_day: null')],
  ['Migration documents Training-only ownership', migration.includes('Training domain')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 } else console.error(`✗ ${label}`)
}
console.log(`\nTraining Match Day Contract: ${passed}/${checks.length}`)
assert.equal(passed, checks.length)
