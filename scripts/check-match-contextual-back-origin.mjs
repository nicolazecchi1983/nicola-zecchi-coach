import fs from 'node:fs'
const dashboard=fs.readFileSync('src/app/events/dashboardEvents.js','utf8')
const library=fs.readFileSync('src/modules/match/events/matchLibraryEvents.js','utf8')
const analysis=fs.readFileSync('src/modules/match/events/matchAnalysisEvents.js','utf8')
const ui=fs.readFileSync('src/design-system/uiComponents.js','utf8')
const app=fs.readFileSync('src/app/appController.js','utf8')
const session=fs.readFileSync('src/app/appSessionRestore.js','utf8')
const workspaceEvents=fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js','utf8')
const directEntryGate=fs.readFileSync('scripts/check-match-direct-entry.mjs','utf8')
const opponentLineupGate=fs.readFileSync('scripts/check-match-opponent-lineup-persistence.mjs','utf8')
const phase21Gate=fs.readFileSync('scripts/check-architecture-decomposition-phase21.mjs','utf8')
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
const gate='check:match-contextual-back-origin'
const canonicalSections=['opponent-study','callups','our-team','opponent','analysis','match-statistics','match-report-workspace','post-match']
const checks=[
 ['dashboard owns dashboard origin',dashboard.includes("storage?.setItem('staff-match-entry-origin', 'dashboard')")],
 ['dashboard mount clears stale origin',dashboard.includes("const dashboardCalendar = root.querySelector('[data-dashboard-calendar]')") && dashboard.includes("if (dashboardCalendar) storage?.removeItem('staff-match-entry-origin')")],
 ['match library owns library origin',library.includes("storage?.setItem('staff-match-entry-origin', 'match-library')")],
 ['origin writers remain entry-point only',(dashboard.match(/setItem\('staff-match-entry-origin'/g)||[]).length===1 && (library.match(/setItem\('staff-match-entry-origin'/g)||[]).length===1 && !analysis.includes("setItem('staff-match-entry-origin'") && !workspaceEvents.includes("staff-match-entry-origin")],
 ['shared back reads origin',analysis.includes("storage?.getItem('staff-match-entry-origin') === 'dashboard'")],
 ['dashboard destination',analysis.includes("['dashboard', 'Dashboard']")],
 ['library destination',analysis.includes("['match-library', 'Match Library']")],
 ['shared label hook',ui.includes('data-match-context-back-label') && analysis.includes("button.querySelector('[data-match-context-back-label]')")],
 ['contextual label',analysis.includes('`Torna alla ${destination[1]}`')],
 ['contextual navigation',analysis.includes('setActiveNavigation(destination[0])') && analysis.includes("storage?.setItem('nz-active-section', destination[0])") && analysis.includes('await setView(destination[0], destination[1])')],
 ['app controller imports canonical Match context',app.includes("import { MATCH_CONTEXT_SECTIONS, resolveWorkspaceRestore } from './appSessionRestore.js'")],
 ['canonical Match context is reused',app.includes("if (!MATCH_CONTEXT_SECTIONS.includes(key)) localStorage.removeItem('staff-match-entry-origin')")],
 ['cleanup lives in afterActivate',app.indexOf("localStorage.removeItem('staff-match-entry-origin')") > app.indexOf('afterActivate: async ({ key }) => {')],
 ['setView remains pure workspace delegation',app.includes("async function setView(key, label) {\n    return workspaceEngine.open(key, label)\n  }") || app.includes("async function setView(key, label) {\r\n    return workspaceEngine.open(key, label)\r\n  }")],
 ['controller remains below one thousand lines',app.split('\n').length < 1000],
 ['internal Match navigation never clears origin',!analysis.includes("removeItem('staff-match-entry-origin')") && !workspaceEvents.includes("staff-match-entry-origin")],
 ['all operational Match sections remain canonical',canonicalSections.every((key)=>session.includes(`'${key}'`))],
 ['fallback remains Match Library',analysis.includes("? 'dashboard' : 'match-library'")],
 ['design system does not read storage',!ui.includes('staff-match-entry-origin')],
 ['no database persistence',!analysis.includes("from('staff-match-entry-origin')") && !dashboard.includes("from('staff-match-entry-origin')") && !library.includes("from('staff-match-entry-origin')")],
 ['direct-entry gate validates contextual back',directEntryGate.includes('section back action is contextual') && directEntryGate.includes('back control exposes contextual copy hook') && !directEntryGate.includes("analysis.includes(\"setView('match-library', 'Match Library')\")")],
 ['opponent-lineup gate validates current canonical dependencies',opponentLineupGate.includes("app.includes('createMatchOpponentStudyService,')") && opponentLineupGate.includes("app.includes('getCalendarEvent,')") && opponentLineupGate.includes("app.includes('updateCalendarEvent,')") && opponentLineupGate.includes("app.includes('loadCalendarEvents,')") && !opponentLineupGate.includes("getCalendarEvent,\\n      createCalendarEvent")],
 ['phase21 gate is line-ending agnostic',phase21Gate.includes('/formationOptionsHtml,\\r?\\n\\s+bindStaffColorPickers,/.test(app)')],
 ['npm script registration',pkg.scripts?.[gate]==='node scripts/check-match-contextual-back-origin.mjs'],
 ['canonical suite registration',Array.isArray(pkg.staffCheckSuite) && pkg.staffCheckSuite.includes(gate)],
 ['suite registration unique',Array.isArray(pkg.staffCheckSuite) && pkg.staffCheckSuite.filter(x=>x===gate).length===1],
 ['suite grows exactly to 256',Array.isArray(pkg.staffCheckSuite) && pkg.staffCheckSuite.length===256],
]
let failed=0
for(const [name,ok] of checks){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failed++}
if(failed)process.exit(1)
console.log('RESULT=PASS '+checks.length+'/'+checks.length)