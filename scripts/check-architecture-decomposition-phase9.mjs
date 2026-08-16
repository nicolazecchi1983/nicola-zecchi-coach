import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const library=fs.readFileSync('src/modules/match/events/matchLibraryEvents.js','utf8')
const checks=[
 ['Match Library physically extracted',app.includes("import { wireMatchLibraryEvents }")&&!app.includes('function wireMatchLibraryEvents()')],
 ['Library service injected',library.includes('createMatchLibraryService,')&&library.includes('createMatchCalendarService,')],
 ['Calendar source mode preserved',library.includes('data-match-calendar-source')&&library.includes("data.sourceMode !== 'new'")],
 ['Create-new Match flow preserved',library.includes('await calendarService.createMatch(data)')&&library.includes('created.eventId')],
 ['Existing Calendar match flow preserved',library.includes("item.type === 'match'")&&library.includes('calendarEventId')],
 ['Active Match storage preserved',library.includes("storage?.setItem('staff-active-match'")&&library.includes("storage?.setItem('nz-active-section'")],
 ['Library filters preserved',library.includes('data-match-library-search')&&library.includes('data-match-library-competition')&&library.includes('data-match-library-outcome')],
 ['Open Match direct-entry preserved',library.includes('data-open-match-workspace')&&library.includes("setView('opponent-study', 'Studio avversario')")],
 ['Delete flow preserved',library.includes('data-delete-library-match')&&library.includes('service.remove(')&&library.includes('confirmUser?.(')],
 ['No Supabase/repository imports',!library.includes('supabase')&&!library.includes('repository')&&!library.includes('import ')],
 ['Controller remains composition root',app.includes('wireMatchLibraryEvents({')&&app.includes('createCalendarEvent,')&&app.includes('getUserErrorMessage,')],
]
let n=0;for(const[label,ok]of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 9: ${n}/${checks.length}`);if(n!==checks.length)process.exit(1)
