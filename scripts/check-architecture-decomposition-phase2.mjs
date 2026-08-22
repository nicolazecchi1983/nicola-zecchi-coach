import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const docs = fs.readFileSync('docs/ARCHITECTURE_DECOMPOSITION_PHASE_2.md', 'utf8')
const staffEvents=fs.readFileSync('src/modules/staff/events/staffEvents.js','utf8')
const trainingDraftEvents=fs.readFileSync('src/modules/training/events/trainingDraftAndVoiceEvents.js','utf8')
const globalShellEvents=fs.readFileSync('src/app/events/globalShellEvents.js','utf8')
const heavy=fs.readFileSync('src/app/appHeavyFeatureEvents.js','utf8')

const dynamicBoundaries = [
  'wireMatchLibraryEvents',
  'wireOpponentStudyEvents',
  'wireMatchWorkspaceEvents',
  'wireTeamAndRosterEvents',
  'wireCallupsEvents',
  'wireBoardEvents',
  'wireLegacyMatchEditorEvents',
  'wireTrainingEditorEvents',
  'wireCalendarEvents',
  'wireProfileEvents',
  'wireMatchAnalysisEvents',
  'wireStaffEvents',
  'wireTrainingDraftAndVoiceEvents',
  'wirePlayerProfileEvents',
  'wireDashboardEvents',
  'wireTrainingLibraryEvents',
]

const checks = [
  ['all dynamic domains have an explicit wire boundary',
    dynamicBoundaries.every((name) => app.includes(`function ${name}()`) || app.includes(`import { ${name} }`) || app.includes(`heavyBinders.${name}(`))],
  ['all dynamic wire functions are orchestrated by bindDynamic',
    dynamicBoundaries.every((name) => app.includes(`${name}()`) || app.includes(`${name}({`))],
  ['Training draft/voice preserves async initialization',
    heavy.includes("import('../modules/training/events/trainingDraftAndVoiceEvents.js')") &&
    app.includes('await heavyBinders.wireTrainingDraftAndVoiceEvents({') &&
    trainingDraftEvents.includes('await restoreLatestTsDraft()')],
  ['Match Library remains segmented', app.includes('function wireMatchLibraryEvents()') || app.includes('import { wireMatchLibraryEvents }')],
  ['Team and Roster share one ownership boundary',
    (app.includes('function wireTeamAndRosterEvents()') || app.includes('import { wireTeamAndRosterEvents }'))],
  ['Calendar wiring has an explicit boundary',
    (app.includes('function wireCalendarEvents()') || app.includes('import { wireCalendarEvents }')) &&
    (app.includes("data-calendar-prev") || fs.readFileSync('src/modules/calendar/events/calendarEvents.js','utf8').includes("data-calendar-prev")) &&
    (app.includes("data-import-season-calendar") || fs.readFileSync('src/modules/calendar/events/calendarEvents.js','utf8').includes("data-import-season-calendar"))],
  ['Staff administration has an explicit boundary',
    (app.includes('function wireStaffEvents()') || app.includes('import { wireStaffEvents }')) &&
    staffEvents.includes("data-create-staff-form") &&
    staffEvents.includes("data-password-form")],
  ['Training Library wiring has an explicit boundary',
    (app.includes('function wireTrainingLibraryEvents()') || app.includes('import { wireTrainingLibraryEvents }')) &&
    (app.includes("data-library-feedback-save") || fs.readFileSync('src/modules/training/events/trainingLibraryEvents.js','utf8').includes("data-library-feedback-save"))],
  ['global shell boundaries from Phase 1 remain',
    app.includes('import { wireGlobalShellEvents }') &&
    app.includes('wireGlobalShellEvents({') &&
    globalShellEvents.includes("querySelectorAll('.nav-item')") &&
    globalShellEvents.includes('#profileMenuButton') &&
    globalShellEvents.includes('[data-mobile-drawer-shell]')],
  ['phase documentation defines extraction order',
    docs.includes('Physical extraction order') &&
    docs.includes('do not move multiple high-risk domains in one commit')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nArchitecture Decomposition Phase 2: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
