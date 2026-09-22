import fs from 'node:fs'
import { matchLocationPresentation, renderMatchLocationBadge } from '../src/shared/match/matchLocationPresentation.js'

const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n')
const icons = read('src/design-system/iconRegistry.js')
const main = read('src/main.js')
const shared = read('src/shared/match/matchLocationPresentation.js')
const sharedCss = read('src/shared/match/matchLocationBadge.css')
const dashboard = read('src/modules/dashboard/dashboardView.js')
const dashboardCss = read('src/modules/dashboard/dashboardPolish.css')
const calendar = read('src/modules/calendar/ui/calendarView.js')
const calendarCss = read('src/modules/calendar/calendarPolish.css')
const library = read('src/modules/match/ui/matchLibraryView.js')
const libraryCss = read('src/modules/match/ui/matchLibrary.css')

const checks = [
  ['home presentation canonica', matchLocationPresentation('home').label === 'Casa' && matchLocationPresentation('home').iconName === 'home'],
  ['away presentation canonica', matchLocationPresentation('away').label === 'Trasferta' && matchLocationPresentation('away').iconName === 'away'],
  ['neutral presentation canonica', matchLocationPresentation('neutral').label === 'Neutro' && matchLocationPresentation('neutral').iconName === 'location'],
  ['fallback location resta home', matchLocationPresentation('x').key === 'home'],
  ['badge include icona + label + data semantico', renderMatchLocationBadge('away', { icon: (name) => `<svg data-icon="${name}"></svg>` }).includes('data-match-location="away"') && renderMatchLocationBadge('away', { icon: (name) => name }).includes('Trasferta')],
  ['icon registry espone home e away', icons.includes('  home:') && icons.includes('  away:')],
  ['shared CSS importato una sola volta', (main.match(/matchLocationBadge\.css/g) || []).length === 1],
  ['shared badge usa token STAFF', sharedCss.includes('var(--staff-color-primary-hover)') && sharedCss.includes('var(--staff-color-border)')],
  ['shared badge non usa important', !sharedCss.includes('!important')],
  ['Dashboard usa owner condiviso', dashboard.includes('renderMatchLocationBadge') && dashboard.includes('dashboard-match-context') && dashboard.includes('dashboard-week-match-meta')],
  ['Dashboard rimuove Panoramica operativa', !dashboard.includes('Panoramica operativa')],
  ['Match Library header usa micro metriche premium', library.includes('match-library-heading-meta') && library.includes('IN PROGRAMMA') && library.includes('A SEGUIRE')],
  ['Match Library header rimuove descrizione generica', !library.includes('Ogni partita nasce una volta')],
  ['Match Library rimuove summary duplicata', !library.includes('class="match-library-summary"')],
  ['Match Library A SEGUIRE removes redundant description', !library.includes('Una vista rapida delle partite dopo il mese operativo.')],
  ['Match Library header separator uses stable CSS escape', libraryCss.includes('content: "\\00B7";')],
  ['Dashboard conserva quick access', dashboard.includes('data-dashboard-match-quick="callups"') && dashboard.includes('data-dashboard-match-quick="our-team"') && dashboard.includes('data-dashboard-match-quick="opponent-study"')],
  ['Dashboard CSS owner dedicato', dashboardCss.includes('STAFF R34 — Match location cues')],
  ['Calendario usa owner condiviso', calendar.includes('renderMatchLocationBadge(event.homeAway') && calendar.includes('calendar-event-details--match')],
  ['Calendario conserva event type icon', calendar.includes('eventTypeIcon(event.type, icon)')],
  ['Calendario CSS owner dedicato', calendarCss.includes('STAFF R34 — Match location cues')],
  ['Match Library usa badge su card e agenda', (library.match(/renderMatchLocationBadge\(match\.homeAway/g) || []).length >= 2 && library.includes('match-library-venue-line') && library.includes('match-library-agenda-location')],
  ['Match Library rimuove locationLabel parallelo', !library.includes('const locationLabel =')],
  ['Match Library mantiene data-location filtro', library.includes('data-location="${escapeHtml(match.homeAway)}"')],
  ['Match Library mantiene agenda owner canonico', library.includes('data-open-match-workspace')],
  ['Match Library CSS owner dedicato', libraryCss.includes('STAFF R34 — Match location cues')],
  ['nessun nuovo database owner', !shared.includes('supabase') && !dashboard.includes('supabase') && !calendar.includes('supabase')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}
console.log(`\nR34 Match Location Cues Premium: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
