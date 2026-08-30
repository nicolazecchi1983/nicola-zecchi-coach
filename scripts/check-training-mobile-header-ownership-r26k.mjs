import fs from 'node:fs'

const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')

const commandBar = fs.readFileSync('src/modules/training/trainingCommandBar.css', 'utf8').replace(/\r\n/g, '\n')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const marker = 'R2.6K — TRAINING MOBILE HEADER OWNERSHIP · CLUSTER 2'
const ownerStart = polish.indexOf(marker)
const owner = ownerStart >= 0 ? polish.slice(ownerStart) : ''
const commandStart = commandBar.indexOf('R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8')
const command = commandStart >= 0 ? commandBar.slice(commandStart) : ''
const checks = [
  ['R2.6K Training header owner exists', ownerStart >= 0],
  ['mobile titlebar spacing is Training-domain owned', owner.includes('.ts-manual-editor .ts-editor-titlebar') && owner.includes('margin-bottom: var(--staff-space-3)')],
  ['mobile subtitle typography is Training-domain owned', owner.includes('.ts-editor-titlebar > div:first-child > p') && owner.includes('font-size: .79rem')],
  ['compact subtitle tier is Training-domain owned', owner.includes('@media (max-width: 390px)') && owner.includes('font-size: .73rem')],
  ['global DS2.3 adaptation no longer owns titlebar geometry', !responsive.slice(responsive.indexOf('DS2.3 — TRAINING POLISH MOBILE ADAPTATION')).includes('.ts-editor-titlebar')],
  ['command layer no longer owns titlebar or subtitle', !command.includes('.ts-editor-titlebar')],
  ['command layer still owns mobile command geometry', command.includes('.ts-editor-actions-wrap') && command.includes('.ts-command-actions')],
  ['no important escalation in Training polish', !polish.includes('!important')],
]
let passed=0
for (const [label,ok] of checks) { console.log(`${ok?'✓':'✗'} ${label}`); if(ok) passed++ }
console.log(`\nR2.6K Training Mobile Header Ownership: ${passed}/${checks.length}`)
if (passed!==checks.length) process.exit(1)
