import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')

function mediaBlocks(width) {
  const marker = `@media (max-width: ${width}px) {`
  const blocks = []
  let from = 0
  while (true) {
    const start = css.indexOf(marker, from)
    if (start < 0) break
    let depth = 0
    let bodyStart = -1
    let closed = false
    for (let i = start; i < css.length; i += 1) {
      if (css[i] === '{') {
        depth += 1
        if (bodyStart < 0) bodyStart = i + 1
      } else if (css[i] === '}') {
        depth -= 1
        if (depth === 0) {
          blocks.push(css.slice(bodyStart, i))
          from = i + 1
          closed = true
          break
        }
      }
    }
    if (!closed) break
  }
  return blocks
}

const b520 = mediaBlocks(520)
const compact = b520.join('\n')

const checks = [
  ['520 has one canonical media owner', b520.length === 1],
  ['compact root adds no page-like padding', !/\.match-squad-step\s*\{[\s\S]*?padding\s*:/.test(compact)],
  ['compact local surfaces keep 14px radius', /squad-command-strip,[\s\S]*?bench-block--full-width\s*\{[\s\S]*?border-radius:\s*14px/.test(compact)],
  ['compact command strip keeps 12px padding', /\.squad-command-strip\s*\{[\s\S]*?padding:\s*12px/.test(compact)],
  ['empty compact token-photo owner is gone', !/\.token-photo\s*\{\s*\}/.test(compact)],
  ['superseded .64rem player-label rule is gone', !compact.includes('font-size: .64rem')],
  ['canonical compact player label stays 76px', /\.player-token small\s*\{[\s\S]*?max-width:\s*76px/.test(compact)],
  ['canonical compact player label stays .58rem', /\.player-token small\s*\{[\s\S]*?font-size:\s*\.58rem/.test(compact)],
  ['compact starter row stays 60px + flexible player', /\.lineup-row\s*\{[\s\S]*?grid-template-columns:\s*60px minmax\(0,\s*1fr\)/.test(compact)],
  ['compact starter number stays 60px', /\.starter-number-input\s*\{[\s\S]*?width:\s*60px[\s\S]*?min-width:\s*60px/.test(compact)],
  ['R3.5A3 1180 command owner remains', css.includes('@media (max-width: 1180px)')],
  ['R3.5A2 1040 operational core owner remains', css.includes('@media (max-width: 1040px)')],
  ['R3.5A1 mobile geometry owner remains', css.includes('R3.5A1 — canonical mobile geometry owner.')],
  ['760 remains intentionally layered', mediaBlocks(760).length === 4],
  ['no important escalation', !css.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}
console.log(`R3.5A4 Match Squad Compact Breakpoint Owner: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
