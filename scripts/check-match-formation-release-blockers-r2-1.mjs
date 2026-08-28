import fs from 'node:fs'

const callups = fs.readFileSync('src/modules/match/events/callupsEvents.js', 'utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js', 'utf8')
const printPage = fs.readFileSync('public/print.html', 'utf8')

const checks = [
  ['callups deselected marker is valid em dash', callups.includes("textContent = '—'") && !callups.includes('â€”')],
  ['callups saved feedback encoding is valid', callups.includes('Nostra squadra userà questa selezione.') && !callups.includes('userÃ')],
  ['formation PDF no longer renders tactical module', !legacy.includes('Modulo ${escapeHtml(formation)}')],
  ['formation PDF no longer computes unused formation label', !legacy.includes('const formation = form.elements.formation')],
  ['starter PDF row renders shirt number before player name only', legacy.includes('<div class=\"player\"><b>${escapeHtml(item.number)}</b><span>${escapeHtml(item.name)}</span></div>')],
  ['starter PDF removes duplicate ordinal on the right', !legacy.includes('<small>${index+1}</small>')],
  ['formation PDF player grid has two canonical columns', legacy.includes('grid-template-columns:34px minmax(0,1fr)')],
  ['formation PDF shirt number has contrast-safe fixed ink', legacy.includes('.lineup-tm-print .player>b{font-size:15px;color:#07194f;font-weight:800}')],
  ['formation PDF leadership resolves slot identity to player name', legacy.includes('const resolveLeadershipName = (slot) => currentStarterEntries().find((item) => item.index === String(slot || \'\'))?.name || \'—\'') && legacy.includes('const captain = resolveLeadershipName(form.elements.captain?.value)') && legacy.includes('const vice = resolveLeadershipName(form.elements.vice_captain?.value)')],
  ['native reset action no longer carries legacy formation-reset owner class', !view.includes("className: 'formation-reset-button formation-reset-button--field match-squad-field-action'") && view.includes("className: 'formation-reset-button--field match-squad-field-action'")],
  ['print preparation keeps screen content offscreen', printPage.includes('body.print-engine-preparing #printRoot') && printPage.includes('left: -10000px')],
  ['print preparation uses A4 content width before handoff', printPage.includes('width: 190mm') && printPage.includes("classList.add('print-engine-preparing')")],
  ['print status remains visible until native print handoff', printPage.includes("status.textContent = 'Preparazione del documento…'") && !printPage.includes('status.remove()')],
  ['print shield still restores printable root for print media', printPage.includes('#printRoot, #printRoot * { visibility: visible !important; }')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nR2.1 Formation release blockers: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
