import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js','utf8')
const presentation = fs.readFileSync('src/modules/training/ui/trainingPresentationBuilders.js','utf8')
const draftEvents = fs.readFileSync('src/modules/training/events/trainingDraftAndVoiceEvents.js','utf8')
const editorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const calendarViews = fs.readFileSync('src/modules/calendar/ui/calendarEventViewBuilders.js','utf8')

const checks = [
  ['Training presentation builders physically extracted', presentation.includes('export function createTrainingPresentationBuilders')],
  ['Controller composes Training presentation owner', app.includes('createTrainingPresentationBuilders({')],
  ['Roster projection moved out of controller', presentation.includes('function getTrainingSheetRosterPlayers()') && !app.includes('function getTrainingSheetRosterPlayers()')],
  ['Voice result markup moved out of controller', presentation.includes('function trainingSheetResultHtml(result)') && !app.includes('function trainingSheetResultHtml(result)')],
  ['Calendar Training preview moved out of controller', presentation.includes('function trainingSheetPreviewHtml(event)') && !app.includes('function trainingSheetPreviewHtml(event)')],
  ['Calendar structured Training view moved out of controller', presentation.includes('function trainingSheetStructuredHtml(event)') && !app.includes('function trainingSheetStructuredHtml(event)')],
  ['Training draft runtime still receives result renderer by injection', draftEvents.includes('trainingSheetResultHtml,') && app.includes('trainingSheetResultHtml,')],
  ['Training editor runtime still receives roster projection by injection', editorEvents.includes('getTrainingSheetRosterPlayers,') && app.includes('getTrainingSheetRosterPlayers,')],
  ['Calendar view owner still receives Training presentation hooks', calendarViews.includes('trainingSheetStructuredHtml, trainingSheetPreviewHtml') && app.includes('trainingSheetStructuredHtml,') && app.includes('trainingSheetPreviewHtml,')],
  ['Presentation owner has no persistence calls', !presentation.includes('supabase') && !presentation.includes('updateCalendarEvent(') && !presentation.includes('createCalendarEvent(')],
  ['Presentation owner is UI-only with explicit runtime dependency and canonical HTML safety', presentation.includes('{ activePlayers }') && presentation.includes("import { escapeHtml } from '../../../shared/html/escapeHtml.js'")],
  ['Controller reduced below Phase 17 size', app.split('\n').length < 1200],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nArchitecture Decomposition Phase 18: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
