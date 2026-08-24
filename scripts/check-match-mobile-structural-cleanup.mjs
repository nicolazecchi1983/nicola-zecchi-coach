import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const squad = read('src/modules/match/ui/matchSquad.css')
const responsive = read('src/design-system/responsive.css')
const opponent = read('src/modules/match/ui/matchOpponent.css')
const callupsView = read('src/modules/match/ui/callupsView.js')
const callupsCss = read('src/modules/match/ui/callups.css')
const runtime = read('src/modules/match/events/legacyMatchEditorEvents.js')

const checks = [
  ['starter row remains a two-control domain layout', /grid-template-columns:\s*64px\s+minmax\(0,\s*1fr\)/.test(squad)],
  ['compact starter row remains two-control', /grid-template-columns:\s*60px\s+minmax\(0,\s*1fr\)/.test(squad)],
  ['global responsive no longer owns starter row columns', !/\.match-squad-step \.lineup-list--selection \.lineup-row\s*\{/.test(responsive)],
  ['global responsive no longer owns starter row control sizing', !/\.match-squad-step \.lineup-list--selection \.lineup-row (?:input|select)/.test(responsive)],
  ['opponent compact appearance has explicit grid areas', /grid-template-areas:\s*\n\s*"toggle preview"\s*\n\s*"action action"/.test(opponent)],
  ['opponent color action spans its mobile row', /\.opponent-appearance-disclosure\s*\{[^}]*grid-area:\s*action[^}]*width:\s*100%/s.test(opponent)],
  ['callups save consumes canonical secondary button', /class="staff-button staff-button--secondary"[^>]*data-callups-save/.test(callupsView)],
  ['callups no longer uses undefined secondary-action class', !/secondary-action/.test(callupsView)],
  ['callups actions stack on compact mobile', /@media \(max-width: 520px\)[\s\S]*?\.callups-toolbar-actions\s*\{\s*grid-template-columns:\s*1fr/.test(callupsCss)],
  ['opponent persisted image has bounded signed-url retry', /applySignedPreviewUrl\(false\)/.test(runtime) && /applySignedPreviewUrl\(true\)/.test(runtime)],
  ['broken opponent image is hidden after failed retry', /opponentSheetPreview\.removeAttribute\('src'\)[\s\S]*?opponentSheetPreview\.hidden = true/.test(runtime)],
  ['opponent image failure uses canonical stage feedback', /stage:\s*'match-opponent-lineup-load'/.test(runtime)],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) { console.log('PASS ', label); passed += 1 }
  else console.error('FAIL ', label)
}
console.log(`R3.4A Match Mobile Structural Cleanup: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
