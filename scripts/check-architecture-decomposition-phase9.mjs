import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const library=fs.readFileSync('src/modules/match/events/matchLibraryEvents.js','utf8')
const checks=[
 ['Match Library physically extracted',app.includes("import { wireMatchLibraryEvents }")&&!app.includes('function wireMatchLibraryEvents()')],
  ['Library consultation service injected without Calendar creation service',library.includes('createMatchLibraryService,')&&!library.includes('createMatchCalendarService,')],
  ['Library creation source mode retired',!library.includes('data-match-calendar-source')&&!library.includes("data.sourceMode !== 'new'")],
  ['Create-new Match flow retired from Library',!library.includes('calendarService.createMatch')&&!library.includes('created.eventId')],
  ['Library no longer owns Calendar match selection flow',!library.includes('calendarEventId')&&!library.includes("item.type === 'match'")],
 ['Active Match storage preserved',library.includes("storage?.setItem('staff-active-match'")&&library.includes("storage?.setItem('nz-active-section'")],
  ['Library search + three domain filters preserved',library.includes('data-match-library-search')&&library.includes('data-match-library-competition')&&library.includes('data-match-library-location')&&library.includes('data-match-library-outcome')&&library.includes('matchLibrarySearchMode')],
 ['Open Match direct-entry preserved',library.includes('data-open-match-workspace')&&library.includes("setView('opponent-study', 'Studio avversario')")],
 ['Delete flow preserved',library.includes('data-delete-library-match')&&library.includes('service.remove(')&&library.includes('confirmUser?.(')],
 ['No Supabase/repository imports',!library.includes('supabase')&&!library.includes('repository')&&!library.includes('import ')],
  ['Controller composes consultation-only Match Library',(() => { const call = app.match(/wireMatchLibraryEvents\(\{[\s\S]*?\n    \}\)/)?.[0] || ''; return Boolean(call) && call.includes('createMatchLibraryService,') && !call.includes('createMatchCalendarService,') && !call.includes('getDataAccessUserMessage,') })()],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 9: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
