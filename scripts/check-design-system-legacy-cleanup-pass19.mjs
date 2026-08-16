import fs from 'node:fs'

const main = fs.readFileSync('src/main.js', 'utf8')
const owner = fs.readFileSync('src/modules/board/board.css', 'utf8')
const legacy = fs.readFileSync('src/style.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const controls = fs.readFileSync('src/design-system/controls.css', 'utf8')

const legacyBoardOwner = /\.board-(?:toolbar|color-controls|pitch|token|help)\b/

const checks = [
  ['Board owner is loaded', main.includes("./modules/board/board.css")],
  ['Board owner loads after legacy stylesheet', main.indexOf("./style.css") < main.indexOf("./modules/board/board.css")],
  ['Toolbar geometry is canonically owned', owner.includes('.board-toolbar') && owner.includes('grid-template-columns: 1fr 1fr auto')],
  ['Pitch geometry is canonically owned', owner.includes('.board-pitch') && owner.includes('aspect-ratio: 68 / 105')],
  ['Home and away token presentation is canonically owned', owner.includes('.board-token--home') && owner.includes('.board-token--away')],
  ['Board helper presentation is canonically owned', owner.includes('.board-help')],
  ['Existing 900px Board layout behavior is retained', owner.includes('@media (max-width: 900px)') && owner.includes('.board-toolbar { grid-template-columns: 1fr; }')],
  ['Legacy style no longer owns Board selectors', !legacyBoardOwner.test(legacy)],
  ['Shared controls still own Board field-label convergence', controls.includes('.board-toolbar label')],
  ['Final responsive layer still owns real-device Board geometry', responsive.includes('BOARD: fit the whole tactical board') && responsive.includes('.board-token small')],
  ['Board owner contains no runtime or Match Sheet responsibilities', !owner.includes('.match-score') && !owner.includes('.opponent-token') && !owner.includes('.callups-')],
  ['Board owner adds no !important overrides', !owner.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log(`✓ ${label}`); passed += 1 }
  else { console.error(`✗ ${label}`); process.exitCode = 1 }
}
console.log(`\nDS Legacy Cleanup Pass 19: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
