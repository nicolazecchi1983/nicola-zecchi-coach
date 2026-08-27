import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js', 'utf8')
const colorPicker = fs.readFileSync('src/design-system/colorPickerController.js', 'utf8')
const teamEvents = fs.readFileSync('src/modules/team/events/teamRosterEvents.js', 'utf8')
const matchEvents = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js', 'utf8')

const checks = [
  ['Shared STAFF color picker controller exists', colorPicker.includes('export function bindStaffColorPickers')],
  ['Color picker binding no longer lives in appController', !app.includes('function bindStaffColorPickers(root)')],
  ['Controller imports shared color picker owner', app.includes("import { bindStaffColorPickers } from '../design-system/colorPickerController.js'")],
  ['Team/Roster still receives color picker dependency', app.includes('wireTeamAndRosterEvents({') && teamEvents.includes('bindStaffColorPickers')],
  ['Legacy Match declares color picker as explicit dependency', matchEvents.includes('formationOptionsHtml,\n  bindStaffColorPickers,')],
  ['Legacy Match receives color picker from composition root', app.includes('wireLegacyMatchEditorEvents({') && /formationOptionsHtml,\r?\n\s+bindStaffColorPickers,/.test(app)],
  ['Legacy Match no longer relies on an undeclared color-picker global', !/export function wireLegacyMatchEditorEvents\([\s\S]*?\) \{[\s\S]*?bindStaffColorPickers\(matchEditor\)/.test(matchEvents) || matchEvents.split('}) {')[0].includes('bindStaffColorPickers')],
  ['Shared color picker remains persistence-neutral', !colorPicker.includes('supabase') && !colorPicker.includes('localStorage')],
  ['Shared color picker remains domain-neutral', !colorPicker.includes('match') && !colorPicker.includes('roster')],
  ['Composition root remains below one thousand lines', app.split('\n').length < 1000],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nArchitecture Decomposition Phase 21: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
