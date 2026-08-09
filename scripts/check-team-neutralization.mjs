import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), 'src')
const allowedLegacy = path.normalize('modules/roster/rosterDomain.js')
const forbidden = ['budrio', 'nicola zecchi', 'andrea giovannini']
const failures = []
let checked = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(js|css|html)$/.test(entry.name)) {
      checked += 1
      const rel = path.relative(root, full)
      const text = fs.readFileSync(full, 'utf8').toLocaleLowerCase('it-IT')
      for (const token of forbidden) if (text.includes(token)) failures.push(`${rel}: contiene hardcode ${token}`)
      if (text.includes('mezzolara') && path.normalize(rel) !== allowedLegacy) failures.push(`${rel}: Mezzolara fuori dal percorso legacy autorizzato`)
    }
  }
}

walk(root)
const controller = fs.readFileSync(path.join(root, 'app/appController.js'), 'utf8')
const parser = fs.readFileSync(path.join(root, 'services/trainingSheetParser.js'), 'utf8')
const shell = fs.readFileSync(path.join(root, 'app/appShellView.js'), 'utf8')
const report = fs.readFileSync(path.join(root, 'modules/match/matchReportRenderer.js'), 'utf8')

const rules = [
  ['locations derive from team facilities', controller.includes('getTeamLocationOptions(appState.teamFacilities') && !controller.includes('getTeamLocationOptions(appState.calendarEvents')],
  ['training parser accepts runtime context', parser.includes('context = {}') && parser.includes('context.coach')],
  ['frontend identity has no email whitelist', !shell.includes('KNOWN_PROFILES')],
  ['match report watermark derives from team', report.includes('teamMark') && report.includes('${escape(teamName)} · MATCH REPORT')],
]
for (const [label, ok] of rules) {
  if (!ok) failures.push(label)
  else console.log(`✓ ${label}`)
}
if (failures.length) {
  console.error('Team Neutralization: FAIL')
  failures.forEach((item) => console.error(`✗ ${item}`))
  process.exit(1)
}
console.log(`Team Neutralization: 4/4 OK · ${checked} file operativi controllati`)
