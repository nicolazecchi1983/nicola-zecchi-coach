import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const draft=fs.readFileSync('src/modules/training/events/trainingDraftAndVoiceEvents.js','utf8')
const checks=[
 ['Training Draft/Voice physically extracted',app.includes("import { wireTrainingDraftAndVoiceEvents }")&&!app.includes('async function wireTrainingDraftAndVoiceEvents()')],
 ['Async initialization preserved',app.includes('await wireTrainingDraftAndVoiceEvents({')],
 ['SpeechRecognition support preserved',draft.includes('SpeechRecognition')&&draft.includes('webkitSpeechRecognition')],
 ['Microphone start/stop preserved',draft.includes('data-ts-record')&&draft.includes('data-ts-stop')&&draft.includes('stopTsRecognition')],
 ['Live transcription preserved',draft.includes('recognition.onresult')&&draft.includes("dispatchEvent(new EventCtor('input'")],
 ['Draft autosave preserved',draft.includes('saveTsDraft')&&draft.includes("from('training_sheet_drafts')")&&draft.includes('scheduleTsAutosave')],
 ['Latest draft restore preserved',draft.includes('restoreLatestTsDraft')&&draft.includes("eq('status', 'draft')")],
 ['Narration parser preserved',draft.includes('parseTrainingSheetNarration(')&&draft.includes('activePlayers()')],
 ['Clear draft UI preserved',draft.includes('data-ts-clear')&&draft.includes("tsStatus.textContent = 'In attesa'")],
 ['Analyze action preserved',draft.includes('data-ts-analyze')&&draft.includes('await saveTsDraft()')],
 ['Dependencies injected',draft.includes('appState,')&&draft.includes('supabase,')&&draft.includes('trainingSheetResultHtml,')],
 ['Controller remains composition root',app.includes('wireTrainingDraftAndVoiceEvents({')&&app.includes('FormDataCtor: FormData')],
 ['No repository/application import shortcut',!draft.includes('repository')&&!draft.includes("import ")],
]
let n=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 12: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
