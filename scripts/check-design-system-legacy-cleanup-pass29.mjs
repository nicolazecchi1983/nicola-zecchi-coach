import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const style = fs.readFileSync('src/style.css', 'utf8')
const settingsHub = fs.readFileSync('src/modules/settings/settingsHub.css', 'utf8')
const calendarBulk = fs.readFileSync('src/modules/calendar/calendarBulkManagement.css', 'utf8')
const surfaces = fs.readFileSync('src/design-system/surfaces.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const retiredSelectors = ['.stats-grid', '.timeline-item', '.today-panel', '.activity-list', '.analysis-grid', '.video-placeholder', '.analysis-copy']
const checks = [
  ['legacy Dashboard/Analysis V5 block is retired', style.includes('Legacy Dashboard/Analysis V5 presentation retired in 0.27.42')],
  ['retired Dashboard/Analysis selectors are absent from style.css', retiredSelectors.every((selector) => !style.includes(selector))],
  ['placeholder geometry moved to shared surfaces owner', surfaces.includes('Shared empty-state geometry migrated from legacy style.css in 0.27.42') && surfaces.includes('.placeholder-panel')],
  ['Settings Hub migration is marked in legacy', style.includes('SETTINGS HUB — ownership migrated to src/modules/settings/settingsHub.css in 0.27.42')],
  ['Settings Hub selectors are absent from style.css', !style.includes('.settings-grid') && !style.includes('.settings-card-icon')],
  ['Settings Hub canonical owner contains real presentation', settingsHub.includes('.settings-grid') && settingsHub.includes('.settings-card-icon')],
  ['Calendar Bulk migration is marked in legacy', style.includes('CALENDAR BULK MANAGEMENT — ownership migrated to src/modules/calendar/calendarBulkManagement.css in 0.27.42')],
  ['Calendar Bulk selectors are absent from style.css', !style.includes('.calendar-bulk-modal') && !style.includes('.calendar-bulk-form')],
  ['Calendar Bulk canonical owner contains desktop and mobile contracts', calendarBulk.includes('.calendar-bulk-modal') && calendarBulk.includes('@media (max-width: 760px)')],
  ['new owners load immediately after legacy base to preserve cascade', main.indexOf("./modules/settings/settingsHub.css") > main.indexOf("./style.css") && main.indexOf("./modules/calendar/calendarBulkManagement.css") > main.indexOf("./style.css") && main.indexOf("./modules/settings/settingsHub.css") < main.indexOf("./design-system/polish.css")],
  ['style.css is below 1200 lines', style.split(/\r?\n/).length < 1200],
  ['Pass 29 is in aggregate gate', releaseGateIncludes(packageJson, 'check:design-system-legacy-cleanup-pass29')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 29: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
