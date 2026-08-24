import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/ui/matchSquad.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')

const checks = [
  ['single R3.4C canonical marker exists', (css.match(/R3\.4C Match Squad Cross-Viewport Alignment/g) || []).length === 1],
  ['desktop pitch and lineup headers share one height contract', /\.pitch-panel-head,\s*\n\.match-squad-step \.lineup-list--selection \.lineup-list-head\s*\{[\s\S]*?min-height:\s*74px/.test(css)],
  ['desktop pitch header uses structural title-actions grid', /\.pitch-panel-head\s*\{[\s\S]*?grid-template-columns:\s*minmax\(max-content,\s*1fr\)\s+auto/.test(css)],
  ['pitch title cannot collapse into accidental two-line geometry', /\.pitch-panel-title\s*\{[\s\S]*?min-width:\s*max-content/.test(css)],
  ['both canonical titles stay single-line where desktop has room', /\.pitch-panel-title h3,[\s\S]*?\.lineup-list--selection \.lineup-list-head h3\s*\{[\s\S]*?white-space:\s*nowrap/.test(css)],
  ['lineup header content explicitly owns full row width', /\.lineup-list--selection \.lineup-list-head > div\s*\{[\s\S]*?width:\s*100%/.test(css)],
  ['lineup header is explicitly left aligned', /\.lineup-list--selection \.lineup-list-head > div\s*\{[\s\S]*?text-align:\s*left/.test(css)],
  ['mobile resets desktop shared header height', /@media \(max-width:\s*760px\)[\s\S]*?\.pitch-panel-head,[\s\S]*?\.lineup-list--selection \.lineup-list-head\s*\{[\s\S]*?min-height:\s*0/.test(css)],
  ['mobile pitch header stacks structurally', /@media \(max-width:\s*760px\)[\s\S]*?\.pitch-panel-head\s*\{[\s\S]*?flex-direction:\s*column/.test(css)],
  ['mobile lineup heading remains left aligned', /@media \(max-width:\s*760px\)[\s\S]*?\.lineup-list--selection \.lineup-list-head[\s\S]*?align-items:\s*flex-start/.test(css)],
  ['R3.4C does not use important escalation', !alignmentHasImportant(css)],
  ['global responsive layer still does not own starter row columns', !/\.match-squad-step\s+\.lineup-row[\s\S]{0,180}grid-template-columns/.test(responsive)],
]

function alignmentHasImportant(source) {
  const marker = source.indexOf('0.29.61 — R3.4C Match Squad Cross-Viewport Alignment')
  if (marker < 0) return true
  return source.slice(marker).includes('!important')
}

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`FAIL  ${label}`)
    process.exitCode = 1
  } else {
    console.log(`PASS  ${label}`)
    passed += 1
  }
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`R3.4C Match Squad Cross-Viewport Alignment: ${passed}/${checks.length}`)
