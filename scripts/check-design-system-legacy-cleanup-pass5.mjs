import fs from 'node:fs'

const legacy = fs.readFileSync('src/style.css', 'utf8')
const owner = fs.readFileSync('src/modules/match/ui/analysisTemplateManager.css', 'utf8')
const overlay = fs.readFileSync('src/design-system/overlays.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')

const managerLegacySelectors = [
  '.analysis-template-manager{',
  '.analysis-template-manager {',
  '.analysis-template-manager-backdrop{',
  '.analysis-template-manager-head{',
  '.analysis-template-manager-toolbar{',
  '.analysis-template-manager-body{',
  '.analysis-template-manager-footer{',
  '.analysis-template-manager-phase{',
]

const checks = [
  ['legacy style no longer owns Template Manager geometry', managerLegacySelectors.every((selector) => !legacy.includes(selector))],
  ['dedicated Template Manager owner exists', owner.includes('.analysis-template-manager {') && owner.includes('.analysis-template-manager-body {')],
  ['domain owner loads after overlay shell', main.indexOf("./design-system/overlays.css") < main.indexOf("./modules/match/ui/analysisTemplateManager.css")],
  ['domain owner loads before final responsive layer', main.indexOf("./modules/match/ui/analysisTemplateManager.css") < main.indexOf("./design-system/responsive.css")],
  ['overlay layer keeps manager backdrop and shell geometry', overlay.includes('.analysis-template-manager-backdrop') && overlay.includes('max-height: min(90dvh, 920px)')],
  ['manager has one desktop scrolling body', owner.includes('overflow-y: auto') && owner.includes('min-height: 0')],
  ['mobile manager uses one natural viewport scroll', owner.includes('height: 100dvh') && owner.includes('overflow: visible')],
  ['manager subsections are two columns desktop and one mobile', owner.includes('repeat(2, minmax(0, 1fr))') && owner.includes('grid-template-columns: 1fr')],
  ['new owner introduces no important overrides', !owner.includes('!important')],
  ['new owner introduces no raw hex palette', !/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(owner)],
  ['new owner uses only canonical 760px breakpoint', [...owner.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].every(([, bp]) => bp === '760')],
  ['legacy obsolete manager generations are gone', !legacy.includes('0.20.4 — deterministic Template Manager accordion') && !legacy.includes('0.20.6 — Beyond the Bug: simple Template Manager cards') && !legacy.includes('0.20.7 — Template Manager mobile')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failed += 1
}
console.log(`\nDS Legacy Cleanup Pass 5: ${checks.length - failed}/${checks.length}`)
if (failed) process.exit(1)
