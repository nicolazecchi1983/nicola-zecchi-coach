import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const workspace=fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js','utf8')
const checks=[
 ['Match Workspace physically extracted',app.includes("import { wireMatchWorkspaceEvents }")&&!app.includes('function wireMatchWorkspaceEvents()')],
 ['Workspace navigation actions preserved',workspace.includes("action === 'our-team'")&&workspace.includes("action === 'opponent'")&&workspace.includes("action === 'analysis'")&&workspace.includes("action === 'post-match'")&&workspace.includes("action === 'statistics'")],
 ['Callups navigation preserved',workspace.includes("action === 'callups'")&&workspace.includes("data-callups-match")],
 ['Report print interaction preserved',workspace.includes('data-match-report-workspace-print')&&workspace.includes('printMatchReport(')],
 ['Report to Analysis preserved',workspace.includes('data-match-report-open-analysis')&&workspace.includes("setView('analysis', 'Analisi gara')")],
 ['Post-match save flow preserved',workspace.includes('data-post-match-form')&&workspace.includes('createMatchPostMatchService')&&workspace.includes("Post gara salvato.")],
 ['Calendar services injected',workspace.includes('getCalendarEvent,')&&workspace.includes('updateCalendarEvent,')&&workspace.includes('loadCalendarEvents,')],
 ['Navigation storage injected',workspace.includes('storage = globalThis.localStorage')&&workspace.includes("storage?.setItem('nz-active-section'")],
 ['No Supabase/repository/appState shortcut',!workspace.includes('supabase')&&!workspace.includes('repository')&&!workspace.includes('appState')],
 ['Controller remains composition root',app.includes('wireMatchWorkspaceEvents({')&&app.includes('printMatchReport,')&&app.includes('createMatchPostMatchService,')],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 8: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
