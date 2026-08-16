import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const style = read('src/style.css')
const roster = read('src/modules/roster/roster.css')
const main = read('src/main.js')

const checks = [
  ['roster canonical owner exists', roster.includes('STAFF — Roster canonical owner')],
  ['roster owner is loaded', main.includes("import './modules/roster/roster.css'")],
  ['roster loads after shared overlays', main.indexOf("import './modules/roster/roster.css'") > main.indexOf("import './design-system/overlays.css'")],
  ['legacy style no longer owns players grid', !/\.players-grid\s*\{/.test(style)],
  ['legacy style no longer owns player cards', !/\.player-card(?:\s|\{|__|--)/.test(style)],
  ['legacy style no longer owns player profile modal', !/\.player-profile-modal\s*\{/.test(style)],
  ['legacy style no longer owns player profile form', !/\.player-profile-form\s*\{/.test(style)],
  ['legacy style no longer owns roster foundation', !/\.roster-foundation-note\s*\{/.test(style)],
  ['canonical owner includes desktop roster grid', /\.players-grid\s*\{[\s\S]*?repeat\(3/.test(roster)],
  ['canonical owner includes mobile roster adaptation', /@media \(max-width: 760px\)[\s\S]*?\.players-grid\s*\{\s*grid-template-columns: 1fr;/.test(roster)],
  ['player profile is consolidated without important overrides', !roster.includes('!important')],
  ['shared modal shell remains outside roster owner', !/\.new-event-modal\s*\{/.test(roster)],
]

let passed = 0
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`✓ ${label}`)
    passed += 1
  } else {
    console.error(`✗ ${label}`)
  }
}

console.log(`DS Legacy Cleanup Pass 9: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
