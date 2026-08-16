import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const legacy = fs.readFileSync('src/style.css', 'utf8')
const pageShell = fs.readFileSync('src/design-system/pageShell.css', 'utf8')
const controls = fs.readFileSync('src/design-system/controls.css', 'utf8')
const surfaces = fs.readFileSync('src/design-system/surfaces.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['legacy no longer owns #viewRoot page padding', !legacy.includes('#viewRoot {\n  padding: 22px 26px 28px;')],
  ['legacy no longer owns page-head typography/layout', !legacy.includes('.page-head {\n  display: flex;\n  align-items: flex-end;') && !legacy.includes('.page-head h1 {\n  margin: 0;\n  font-size: 2.15rem;')],
  ['mobile legacy page-shell overrides removed', !legacy.includes('.page-view {\n    padding-left: 14px !important;') && !legacy.includes('font-size: clamp(2rem, 11vw, 3rem) !important')],
  ['pageShell is canonical owner of page geometry', pageShell.includes('#viewRoot {') && pageShell.includes('.page-head,') && pageShell.includes('@media (max-width: 760px)')],
  ['legacy shared primary/secondary button visual block removed', !legacy.includes('background:linear-gradient(180deg,#249ce8,#1588d6)') && !legacy.includes('.ghost-button:hover,.secondary-button:hover,.portal-action-button--secondary:hover')],
  ['legacy danger important override removed', !legacy.includes('.button--danger{border-color:rgba(255,100,100,.42)!important')],
  ['controls owns shared button geometry and icons', controls.includes('.staff-button,') && controls.includes('.primary-action svg,') && controls.includes('.team-settings-actions [type="button"]')],
  ['legacy panel visual owner removed', !legacy.includes('.panel {\n  border: 1px solid var(--border);') && !legacy.includes('.panel-head {\n  display: flex;')],
  ['surfaces owns panel geometry and hierarchy', surfaces.includes('.panel {') && surfaces.includes('border: 1px solid var(--staff-surface-border);') && surfaces.includes('.panel-head {') && surfaces.includes('.panel-head span {')],
  ['retired stat-card layout no longer depends on legacy style', !legacy.includes('.stat-card {\n  display: flex;\n  gap: 13px;') && surfaces.includes('.stat-card,')],
  ['pass3 check is included in release gate', releaseGateIncludes(pkg, 'check:design-system-legacy-cleanup-pass3')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nDS Legacy Cleanup Pass 3: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
