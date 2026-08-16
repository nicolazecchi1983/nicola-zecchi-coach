import fs from 'node:fs'

const app=fs.readFileSync('src/app/appController.js','utf8')
const shell=fs.readFileSync('src/app/events/globalShellEvents.js','utf8')
const docs=fs.readFileSync('docs/ARCHITECTURE_DECOMPOSITION_PHASE_13.md','utf8')

const checks=[
 ['Global shell wiring physically extracted',app.includes("import { wireGlobalShellEvents } from './events/globalShellEvents.js'")],
 ['Controller composes global shell wiring',app.includes('wireGlobalShellEvents({')],
 ['Legacy inline global navigation function removed',!app.includes('function wireGlobalNavigationEvents()')],
 ['Legacy inline profile/drawer function removed',!app.includes('function wireGlobalProfileAndDrawerEvents()')],
 ['Shell module owns sidebar navigation',shell.includes("querySelectorAll('.nav-item')")&&shell.includes('workspaceEngine.getActiveKey()')],
 ['Shell module owns mobile drawer lifecycle',shell.includes("[data-mobile-drawer-shell]")&&shell.includes('toggleMobileDrawer')],
 ['Shell module owns profile menu lifecycle',shell.includes('#profileMenuButton')&&shell.includes('toggleProfileMenu')],
 ['Access guard remains injected',shell.includes('bindGlobalAccessGuard')&&!shell.includes("from '../../core/accessGuard")],
 ['No appState shortcut introduced',!shell.includes('appState')],
 ['No Supabase/repository dependency introduced',!shell.includes('supabase')&&!shell.includes('Repository')],
 ['Controller remains composition root',docs.includes('appController.js` remains the composition root')],
 ['Legacy Match and Training editor boundaries intentionally untouched',docs.includes('does not touch the Legacy Match Editor or Training Editor')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`); if(ok)passed++}
console.log(`\nArchitecture Decomposition Phase 13: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
