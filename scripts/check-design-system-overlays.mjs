import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const overlay = read('src/design-system/overlays.css')
const main = read('src/main.js')

const checks = [
  ['overlay layer is loaded after typography density', main.indexOf("./design-system/typographyDensity.css") < main.indexOf("./design-system/overlays.css")],
  ['overlay layer stays before responsive final', main.indexOf("./design-system/overlays.css") < main.indexOf("./design-system/responsive.css")],
  ['modal backdrop has one canonical token', overlay.includes('--staff-overlay-backdrop:') && overlay.includes('.new-event-modal-backdrop')],
  ['modal panels consume canonical surfaces', overlay.includes('--staff-overlay-panel: var(--staff-color-bg-panel)')],
  ['modal close controls share one rule', overlay.includes('.new-event-modal__close,') && overlay.includes('.analysis-template-manager-close,') && overlay.includes('.drawer-head button')],
  ['calendar drawer consumes canonical overlay surface', overlay.includes('.event-drawer') && overlay.includes('background: var(--staff-overlay-panel)')],
  ['modal footer uses canonical border hierarchy', overlay.includes('border-top: 1px solid var(--staff-color-border-subtle)')],
  ['mobile overlays use adaptive bottom/full-height treatment', overlay.includes('@media (max-width: 760px)') && overlay.includes('max-height: 94dvh')],
  ['mobile footer accounts for safe area', overlay.includes('env(safe-area-inset-bottom)')],
  ['overlay layer introduces no important overrides', !overlay.includes('!important')],
  ['overlay layer introduces no raw hex palette', !/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(overlay)],
  ['overlay layer introduces no new breakpoint', [...overlay.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].every(([,bp]) => ['760'].includes(bp))],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nDS1.7 Modals, Drawers & Overlays: ${checks.length-failed}/${checks.length}`)
if (failed) process.exit(1)
