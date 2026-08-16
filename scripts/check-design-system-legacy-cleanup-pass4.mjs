import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const legacy = read('src/style.css')
const overlays = read('src/design-system/overlays.css')
const controls = read('src/design-system/controls.css')
const calendarEventPresentation = read('src/modules/calendar/calendarEventPresentation.css')

const checks = [
  ['legacy drawer shell owner removed', !legacy.includes('/* DRAWER */') && !legacy.includes('.drawer-backdrop {\n  position: fixed')],
  ['canonical overlay owns drawer positioning', overlays.includes('.drawer-backdrop {') && overlays.includes('.event-drawer {') && overlays.includes('position: fixed;')],
  ['legacy new-event modal shell removed', !/^\.new-event-modal-backdrop\s*\{/m.test(legacy) && !/^\.new-event-modal__head\s*\{/m.test(legacy) && !/^\.new-event-modal__close\s*\{/m.test(legacy)],
  ['canonical overlay owns new-event modal geometry', overlays.includes('.new-event-modal-backdrop,') && overlays.includes('max-height: calc(100dvh - (2 * var(--staff-space-4)))')],
  ['new-event domain form content is retained by Calendar owner', calendarEventPresentation.includes('.new-event-form__row') && calendarEventPresentation.includes('.new-event-form__message')],
  ['new-event secondary action moved to controls', controls.includes('.new-event-modal__secondary')],
  ['legacy match-report overlay shell removed', !legacy.includes('.match-report-dialog{position:fixed') && !legacy.includes('.match-report-dialog-panel{display:grid')],
  ['canonical overlay owns match-report shell', overlays.includes('.match-report-dialog-panel {') && overlays.includes('grid-template-rows: auto minmax(0, 1fr) auto;')],
  ['canonical overlay owns generic modal actions', overlays.includes('.modal-actions,')],
  ['mobile drawer bottom-sheet geometry is canonical', overlays.includes('height: min(88dvh, 720px);') && overlays.includes('border-radius: var(--staff-radius-large) var(--staff-radius-large) 0 0;')],
  ['cleanup adds no important to overlay owner', !overlays.includes('!important')],
  ['cleanup keeps overlay owner on canonical breakpoint only', [...overlays.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].every(([,bp]) => bp === '760')],
]

let failed=0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nDS Legacy Cleanup Pass 4: ${checks.length-failed}/${checks.length}`)
if (failed) process.exit(1)
