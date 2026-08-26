import fs from 'node:fs'
const view=fs.readFileSync('src/modules/match/ui/callupsView.js','utf8')
const events=fs.readFileSync('src/modules/match/events/callupsEvents.js','utf8')
const css=fs.readFileSync('src/modules/match/ui/callups.css','utf8')
const model=fs.readFileSync('src/modules/match/matchCallupsModel.js','utf8')
const service=fs.readFileSync('src/modules/match/matchCallupsService.js','utf8')
const checks=[
 ['redundant Lista convocati retired',!view.includes('Lista convocati')],
 ['redundant full-roster instruction retired',!view.includes('Tutta la rosa parte selezionata')],
 ['redundant inner CONVOCAZIONI eyebrow retired',!view.includes('<span>CONVOCAZIONI</span>')],
 ['structural callups-head owner preserved',view.includes('callups-head callups-selection-bar')&&css.includes('.callups-head,')],
 ['old copy-specific callups-head CSS retired',!css.includes('.callups-head h2')&&!css.includes('.callups-head p')&&!css.includes('.callups-head span')],
 ['select-all exists',view.includes('data-callups-select-all')],
 ['clear-all exists',view.includes('data-callups-clear-all')],
 ['counter restores persisted selection',view.includes('activePlayers.filter(isSelected).length')],
 ['bulk controls wired',events.includes("selectAllButton?.addEventListener('click'")&&events.includes("clearAllButton?.addEventListener('click'")],
 ['bulk helper reuses canonical update',events.includes('const setAllCallups = (checked)')&&events.includes('check.checked = checked')&&events.includes('updateCallups()')],
 ['zero selections saveable when match exists',!events.includes('saveButton.disabled = selected.length === 0 || !activeMatch?.id')&&events.includes('saveButton.disabled = !activeMatch?.id')],
 ['zero selections disable PDF only',events.includes('pdfButton.disabled = selected.length === 0')],
 ['service accepts empty arrays',service.includes('async save(matchId, players = [])')],
 ['persisted empty snapshot remains valid',model.includes('persisted: Boolean(persisted)')&&model.includes('persisted: exists')],
 ['persisted empty snapshot filters Nostra squadra',model.includes('if (!callups?.persisted) return rosterPlayers')&&model.includes('return rosterPlayers.filter')],
 ['dirty state has rendered selection baseline',events.includes('let cleanSelectionKey = selectionKey()')],
 ['initial hydration is clean',events.includes('alertEl.hidden = !dirty')&&events.includes("alertEl.textContent = dirty ? 'Modifiche non salvate.' : ''")],
 ['successful save rebases exact submitted selection',events.includes('const selectionKeyToSave = selectionKey()')&&events.includes('cleanSelectionKey = selectionKeyToSave')],
 ['changes during save remain dirty',events.includes('selectionKey() === cleanSelectionKey')&&events.includes('playersToSave = selectedPlayers()')],
 ['compact mobile keeps both bulk actions together',/@media \(max-width: 520px\)[\s\S]*?\.callups-bulk-actions[\s\S]*?grid-template-columns:\s*1fr 1fr/.test(css)],
]
let p=0;for(const [l,o] of checks){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.5C1-R1 Callups Selection Controls: ${p}/${checks.length}`)
if(p!==checks.length)process.exit(1)
