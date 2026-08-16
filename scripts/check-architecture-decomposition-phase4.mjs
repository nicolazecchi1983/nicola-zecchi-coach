import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const callups=fs.readFileSync('src/modules/match/events/callupsEvents.js','utf8')
const board=fs.readFileSync('src/modules/board/events/boardEvents.js','utf8')
const checks=[
 ['Callups extracted',app.includes("import { wireCallupsEvents }")&&!app.includes('function wireCallupsEvents()')],
 ['Board extracted',app.includes("import { wireBoardEvents }")&&!app.includes('function wireBoardEvents()')],
 ['Callups DI explicit',callups.includes('getTeamProfile,')&&callups.includes('printHtmlDocument,')&&callups.includes('escapeHtml,')],
 ['Callups PDF role grouping preserved',callups.includes('check.dataset.callupRole')&&callups.includes("Portiere:'PORTIERI'")],
 ['Board pitch DI explicit',board.includes('createPitchState,')&&board.includes('createPitchController,')&&board.includes('bindPitchTokenDragging,')],
 ['Board Android color change preserved',board.includes("input.addEventListener('input', applyBoardColor)")&&board.includes("input.addEventListener('change', applyBoardColor)")],
 ['Board local persistence preserved',board.includes("readLocalJson('nz-board-v1'")&&board.includes("storage?.setItem('nz-board-v1'")],
 ['No app state or Supabase imports',!callups.includes('appState')&&!board.includes('appState')&&!callups.includes('supabase')&&!board.includes('supabase')],
 ['Controller composes Callups',app.includes('wireCallupsEvents({')&&app.includes('printHtmlDocument,')],
 ['Controller composes Board',app.includes('wireBoardEvents({')&&app.includes('pitchPositionMode: PITCH_POSITION_MODE')],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 4: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
