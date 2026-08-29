import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const protocol = fs.readFileSync('docs/UI_COMPONENT_DESIGN_PROTOCOL.md', 'utf8')
const tokenCss = fs.readFileSync('src/shared/ui/teamToken.css', 'utf8')
const pitchCss = fs.readFileSync('src/modules/match/ui/matchPitch.css', 'utf8')

const checks = [
  ['core desktop uses exact equal columns', css.includes('.match-squad-step .match-lineup-layout--master {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}')],
  ['leadership remains lineup-owned as one full-width premium row per role', css.includes('.lineup-list--selection .lineup-leadership {') && css.includes('grid-template-columns: minmax(0, 1fr);') && css.includes('.leadership-role-badge')],
  ['pitch is proportioned inside its half column', css.includes('width: min(92%, 530px);') && pitchCss.includes('aspect-ratio: 68 / 105;')],
  ['desktop player tokens use shared re-proportioned size', tokenCss.includes('--staff-token-size: 36px;') && !css.includes('--staff-token-size:')],
  ['player labels are scaled with tokens', css.includes('max-width: 92px;') && css.includes('font-size: .63rem;')],
  ['lineup identity keeps flexible remaining width', css.includes('grid-template-columns: 64px minmax(0, 1fr);')],
  ['tablet preserves equal core before stack breakpoint', css.includes('@media (max-width: 1180px)') && css.includes('.match-squad-step [data-football-pitch] { width: min(92%, 500px); }')],
  ['core stacks only at explicit geometry breakpoint', css.includes('@media (max-width: 1040px)') && css.includes('max-width: 720px;')],
  ['canonical refinement is single latest visual layer', css.includes('0.29.15 — Match Squad Core Geometry & Soccer Board Premium') && !css.includes('0.29.14 — Match Squad visual convergence')],
  ['design protocol requires approved geometry before polish', protocol.includes('Mock approvato → contratto di geometria → owner unico → responsive → polish')],
  ['design protocol forbids stacked corrective overrides', protocol.toLowerCase().includes('non aggiungere una nuova generazione di override per correggere quella precedente')],
  ['premium geometry adds no important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad Core Geometry Premium: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
