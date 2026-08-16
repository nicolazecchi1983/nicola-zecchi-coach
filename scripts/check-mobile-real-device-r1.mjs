import fs from 'node:fs'
const productUi=fs.readFileSync('src/design-system/productUi.css','utf8')

const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const dashboard = fs.readFileSync('src/modules/dashboard/dashboardView.js','utf8')
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'))
const printPage = fs.readFileSync('public/print.html','utf8')
const boardEvents = fs.readFileSync('src/modules/board/events/boardEvents.js','utf8')

const r1 = responsive.slice(responsive.indexOf('M1.2-R1 — REAL DEVICE MOBILE CORRECTIVE'))
const releaseVersion = String(pkg.version || '').replace(/-.+$/, '')
const checks = [
  ['versione R1 o successiva', /^0\.(?:18\.(?:4[0-9]|[5-9][0-9])|(?:19|[2-9][0-9])\.\d+)$/.test(releaseVersion)],
  ['dashboard mostra identità squadra', dashboard.includes("team.name || 'Squadra'")],
  ['Altro forza label visibili', r1.includes('.mobile-more-grid .mobile-more-item .mobile-nav-label') && r1.includes('visibility: visible !important')],
  ['Match Day senza scroll orizzontale', r1.includes('.ts-md-selector') && r1.includes('grid-template-columns: repeat(3') && r1.includes('overflow: visible !important')],
  ['Match navigation non scrollabile', productUi.includes('.product-section-nav') && productUi.includes('display:grid!important') && productUi.includes('overflow:visible!important')],
  ['counter convocazioni in flow', r1.includes('.callups-counter') && r1.includes('position: static !important')],
  ['pitch sfrutta tutta larghezza', r1.includes('.pitch-panel [data-football-pitch]') && r1.includes('width: 100% !important')],
  ['pedine campo scalano su mobile', r1.includes('.token-photo') && r1.includes('clamp(30px, 9.4vw, 38px)')],
  ['board pedine scalano', r1.includes('.board-token') && r1.includes('clamp(30px, 9vw, 38px)')],
  ['colore board supporta change Android', boardEvents.includes("input.addEventListener('input', applyBoardColor)") && boardEvents.includes("input.addEventListener('change', applyBoardColor)")],
  ['minuti leggibili senza barre compresse', r1.includes('.match-minutes-row > div') && r1.includes('display: none !important')],
  ['staff actions compatte', r1.includes('.staff-member-action-row') && r1.includes('flex-wrap: nowrap !important')],
  ['report bench mobile una colonna', r1.includes('.report-bench-strip ol') && r1.includes('grid-template-columns: 1fr !important')],
  ['stampa mobile attende layout stabile', printPage.includes('mobilePrintSettleDelay') && printPage.includes('Android|iPhone|iPad|iPod')],
]
let pass=0
for (const [label, ok] of checks) {
  console.log(`${ok?'✓':'✗'} ${label}`)
  if(ok) pass++
}
console.log(`\nM1.2-R1 real-device corrective: ${pass}/${checks.length}`)
if(pass!==checks.length) process.exit(1)
