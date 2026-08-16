import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const dashboard=fs.readFileSync('src/app/events/dashboardEvents.js','utf8')
const profile=fs.readFileSync('src/app/events/profileEvents.js','utf8')
const library=fs.readFileSync('src/modules/training/events/trainingLibraryEvents.js','utf8')
const checks=[
 ['Dashboard extracted',app.includes("import { wireDashboardEvents }")&&!app.includes('function wireDashboardEvents()')],
 ['Profile extracted',app.includes("import { wireProfileEvents }")&&!app.includes('function wireProfileEvents()')],
 ['Training Library extracted',app.includes("import { wireTrainingLibraryEvents }")&&!app.includes('function wireTrainingLibraryEvents()')],
 ['Dashboard dependencies injected',dashboard.includes('setActiveNavigation')&&dashboard.includes('setView')],
 ['Profile dependencies injected',profile.includes('supabase,')&&profile.includes('appState,')],
 ['Training Library persistence injected',library.includes('saveTrainingLibraryFeedback,')&&library.includes('updateCalendarEvent,')],
 ['No direct appState import in extracted modules',!dashboard.includes("import ")&&!profile.includes("import ")&&!library.includes("import ")],
 ['Controller remains composition root',app.includes('wireDashboardEvents({')&&app.includes('wireProfileEvents({')&&app.includes('wireTrainingLibraryEvents({')],
 ['Training Library filtering moved with its owner',library.includes('applyTrainingLibraryFilters')],
 ['No second data source introduced',!library.includes('localStorage')&&!profile.includes('localStorage')],
]
let n=0; for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`); if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 3: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
