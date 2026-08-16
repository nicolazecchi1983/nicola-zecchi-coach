import fs from 'node:fs'
const app=fs.readFileSync('src/app/appController.js','utf8')
const staff=fs.readFileSync('src/modules/staff/events/staffEvents.js','utf8')
const checks=[
 ['Staff wiring physically extracted',app.includes("import { wireStaffEvents }")&&!app.includes('function wireStaffEvents()')],
 ['Create Staff permission preserved',staff.includes('capabilities.STAFF_CREATE')&&staff.includes('showAccessNotice()')],
 ['Temporary password generation preserved',staff.includes('generateTemporaryPassword()')],
 ['Create user flow preserved',staff.includes('await createStaffUser({')&&staff.includes('await loadStaffProfiles()')],
 ['Update Staff permission preserved',staff.includes('capabilities.STAFF_UPDATE')&&staff.includes('await updateStaffProfile({')],
 ['Current user access-role refresh preserved',staff.includes('setAccessRole(payload.app_role)')&&staff.includes('syncProfileHeader()')],
 ['Delete Staff permission preserved',staff.includes('capabilities.STAFF_DELETE')&&staff.includes('await deleteStaffUser({')],
 ['Delete confirmation preserved',staff.includes('confirmUser?.(`Eliminare definitivamente')],
 ['Password update preserved',staff.includes('data-password-form')&&staff.includes('supabase.auth.updateUser({ password })')],
 ['Capabilities injected instead of imported',staff.includes('capabilities,')&&!staff.includes('ACCESS_CAPABILITIES')],
 ['Controller remains composition root',app.includes('wireStaffEvents({')&&app.includes('createStaffUser,')&&app.includes('deleteStaffUser,')&&app.includes('supabase,')],
 ['No repository/appState import shortcut',!staff.includes('repository')&&!staff.includes("import ")],
]
let n=0
for(const [label,ok] of checks){console.log(`${ok?'✓':'✗'} ${label}`);if(ok)n++}
console.log(`\nArchitecture Decomposition Phase 10: ${n}/${checks.length}`)
if(n!==checks.length)process.exit(1)
