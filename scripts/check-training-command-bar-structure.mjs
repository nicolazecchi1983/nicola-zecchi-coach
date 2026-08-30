import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const main = fs.readFileSync('src/main.js','utf8')
const base = fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const legacyEditor = fs.readFileSync('src/design-system/training-editor.css','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))

const marker = 'R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8'
const mobile = base.slice(base.indexOf(marker))
const canonicalIndex = responsive.length
const responsiveBeforeCanonical = responsive
const forbiddenLegacyGeometry = [
  'grid-template-columns: 1fr 48px',
  'grid-template-columns: 1fr 44px',
  'grid-template-columns: minmax(0, 1fr) 46px',
  'grid-template-columns: minmax(0, 1fr) 96px',
]

const legacyMarkers = [
  'M1.3D — TRAINING HEADER FINAL MOBILE ALIGNMENT',
  'DS2.3-R5 — Training header density refinement',
  'DS2.3-R6 — TRAINING MOBILE ELASTIC COMMAND ROW',
  'DS2.3-R7 — TRAINING MOBILE OPEN ACTION ICON',
]

const checks = [
  ['dedicated command-bar owner exists', fs.existsSync('src/modules/training/trainingCommandBar.css')],
  ['command-bar owner loads after Training polish and before responsive final', main.indexOf("./modules/training/trainingPolish.css") < main.indexOf("./modules/training/trainingCommandBar.css") && main.indexOf("./modules/training/trainingCommandBar.css") < main.indexOf("./design-system/responsive.css")],
  ['desktop command row has one elastic selector plus indivisible action cluster', base.includes('grid-template-columns: minmax(0, 1fr) auto') && base.includes('.ts-command-actions')],
  ['desktop selector can shrink without overflow', base.includes('.ts-open-sheet') && base.includes('min-width: 0')],
  ['desktop draft is a separate status row', base.includes('grid-column: 1 / -1') && base.includes('grid-row: 2')],
  ['one canonical mobile owner exists exactly once', base.split(marker).length - 1 === 1],
  ['global responsive no longer owns command selectors', !responsive.includes('.ts-manual-editor .ts-editor-actions-wrap') && !responsive.includes('.ts-manual-editor .ts-command-actions') && !responsive.includes('.ts-manual-editor .ts-open-sheet')],
  ['legacy mobile command owners were removed', legacyMarkers.every((item) => !responsive.includes(item))],
  ['pre-canonical responsive layer no longer owns command geometry', forbiddenLegacyGeometry.every((item) => !responsiveBeforeCanonical.includes(item))],
  ['legacy Training editor no longer owns command grid geometry', !legacyEditor.includes('grid-template-columns: 1fr 48px') && !legacyEditor.includes('grid-template-columns: 1fr 44px') && !legacyEditor.includes('grid-template-columns: minmax(300px, 1fr) 96px 44px')],
  ['base owner resets wrapper grid state explicitly', base.includes('grid-template-columns: minmax(0, 1fr)') && base.includes('justify-items: stretch')],
  ['mobile row is structural elastic-select + action-cluster', mobile.includes('grid-template-columns: minmax(0, 1fr) auto') && mobile.includes('.ts-command-actions')],
  ['mobile selector owns all residual width', mobile.includes('.ts-open-sheet select') && mobile.includes('width: 100%') && mobile.includes('max-width: none') && mobile.includes('min-width: 0')],
  ['mobile open and more controls preserve 44px touch geometry', mobile.includes('.ts-open-button') && mobile.includes('.ts-more-button') && mobile.includes('width: 44px') && mobile.includes('height: 44px')],
  ['mobile draft remains below and right aligned', mobile.includes('grid-column: 1 / -1') && mobile.includes('grid-row: 2') && mobile.includes('justify-self: end')],
  ['structural owner introduces no important overrides', !base.includes('!important') && !mobile.includes('!important')],
  ['structural check is included in release gate', releaseGateIncludes(pkg, 'check:training-command-bar-structure')],
]

let passed=0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nTraining Command Bar Structure: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
