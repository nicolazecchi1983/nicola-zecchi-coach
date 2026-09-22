import fs from 'node:fs'
import { groupMatchesByMonth, getMatchLibraryUpcomingAgenda } from '../src/modules/match/ui/matchLibraryView.js'
import { normalizeMatchRecord } from '../src/modules/match/matchLibraryModel.js'

const view = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchLibrary.css', 'utf8').replace(/\r\n?/g, '\n')
const controls = fs.readFileSync('src/design-system/controls.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const events = fs.readFileSync('src/modules/match/events/matchLibraryEvents.js', 'utf8')

const fixtures = [
  { id:'past-month', date:'2026-08-30', competition:'Campionato', opponent:'Past' },
  { id:'ghiviborgo', date:'2026-09-20', competition:'Campionato', opponent:'Ghiviborgo' },
  { id:'today', date:'2026-09-21', competition:'Campionato', opponent:'Today' },
  { id:'grassina', date:'2026-09-27', competition:'Campionato', opponent:'Grassina' },
  { id:'later-september', date:'2026-09-30', competition:'Campionato', opponent:'Settembre 2' },
  { id:'oct-1', date:'2026-10-04', competition:'Campionato', opponent:'Ottobre 1' },
  { id:'oct-2', date:'2026-10-11', competition:'Campionato', opponent:'Ottobre 2' },
  { id:'oct-3', date:'2026-10-18', competition:'Campionato', opponent:'Ottobre 3' },
  { id:'oct-4', date:'2026-10-25', competition:'Campionato', opponent:'Ottobre 4' },
  { id:'nov-1', date:'2026-11-01', competition:'Campionato', opponent:'Novembre 1' },
  { id:'undated', date:'', competition:'Amichevole', opponent:'Undated' },
]

const groups = groupMatchesByMonth(fixtures, '2026-09-21')
const agenda = getMatchLibraryUpcomingAgenda(fixtures, '2026-09-21')

const nextMonth = groupMatchesByMonth([
  { id:'already-played', date:'2026-09-21' },
  { id:'oct-1', date:'2026-10-04' },
  { id:'oct-2', date:'2026-10-11' },
  { id:'nov-1', date:'2026-11-01' },
], '2026-09-22')

const empty = groupMatchesByMonth([
  { id:'past', date:'2026-09-20' },
  { id:'undated', date:'' },
], '2026-09-21')

const neutral = normalizeMatchRecord({ id:'n', homeAway:'neutral' })

const checks = [
  ['un solo mese operativo', groups.length === 1],
  ['mese della prossima gara', groups[0]?.key === '2026-09'],
  ['Ghiviborgo giocato sparisce', !groups[0]?.items.some((m) => m.id === 'ghiviborgo')],
  ['gara di oggi resta visibile', groups[0]?.items[0]?.id === 'today'],
  ['Grassina segue cronologicamente', groups[0]?.items[1]?.id === 'grassina'],
  ['resto del mese futuro resta visibile', groups[0]?.items[2]?.id === 'later-september'],
  ['ottobre non anticipa settembre', !groups[0]?.items.some((m) => m.id === 'oct-1')],
  ['undated escluso dalla vista operativa', !groups[0]?.items.some((m) => m.id === 'undated')],
  ['finito settembre subentra ottobre', nextMonth.length === 1 && nextMonth[0]?.key === '2026-10'],
  ['ottobre resta cronologico', nextMonth[0]?.items.map((m) => m.id).join(',') === 'oct-1,oct-2'],
  ['senza gare future vista vuota', empty.length === 0],

  ['agenda contiene solo gare dopo il mese operativo', agenda.map((m) => m.id).join(',') === 'oct-1,oct-2,oct-3,oct-4,nov-1'],
  ['agenda non duplica gare operative', !agenda.some((m) => ['today','grassina','later-september'].includes(m.id))],
  ['agenda non recupera gare passate', !agenda.some((m) => m.id === 'ghiviborgo' || m.id === 'past-month')],
  ['agenda resta cronologica tra mesi', agenda[0]?.id === 'oct-1' && agenda.at(-1)?.id === 'nov-1'],
  ['view limita preview a quattro gare', view.includes('const upcomingAgendaPreview = upcomingAgendaMatches.slice(0, 4)')],
  ['view mantiene remainder espandibile', view.includes('const upcomingAgendaMore = upcomingAgendaMatches.slice(4)')],
  ['agenda riusa hook canonico Apri partita', view.includes('class="match-library-agenda-row" data-open-match-workspace=')],
  ['agenda non introduce secondo event owner', !events.includes('data-match-library-agenda-row')],
  ['agenda ha titolo Prossime gare', view.includes('<h2>Prossime gare</h2>')],
  ['agenda usa disclosure Mostra altre', view.includes('Mostra altre ${upcomingAgendaMore.length}')],
  ['agenda e montata dopo lista operativa', view.indexOf('data-match-library-list') < view.indexOf('${agenda}')],

  ['operationalMatches derivati dal mese operativo', view.includes('const operationalMatches = monthGroups.flatMap((group) => group.items)')],
  ['contatore globale operativo', view.includes('${operationalMatches.length}</strong><span>partite</span>')],
  ['filtri competizione su gare operative', view.includes('new Set(operationalMatches.map((match) => match.competition)')],
  ['empty state future', view.includes('Nessuna partita futura programmata.')],
  ['vecchia proximity logic rimossa', !view.includes('matchProximity(') && !view.includes('compareMatchesByProximity(')],
  ['filtri nascondono mesi vuoti', events.includes('month.hidden = visibleCards.length === 0')],
  ['filtri aggiornano conteggio', events.includes('count.textContent = String(visibleCards.length)')],
  ['campo neutro resta neutral', neutral.homeAway === 'neutral'],
  ['filtro neutral resta disponibile', view.includes('value="neutral">Campo neutro')],
  ['apertura partita resta sulla card', view.includes('data-open-match-workspace')],

  ['CSS agenda resta nel domain owner', css.includes('R33.1 UPCOMING AGENDA')],
  ['CSS agenda usa token STAFF surface', css.includes('background: var(--staff-color-bg-surface)')],
  ['CSS agenda usa token STAFF border', css.includes('border: 1px solid var(--staff-color-border)')],
  ['CSS agenda mantiene focus visibile', css.includes('.match-library-agenda-row:focus-visible')],
  ['CSS agenda adatta mobile canonico', css.includes('@media (max-width: 760px)') && css.includes('.match-library-agenda-row')],
  ['R33.1E wrapper search e solo strutturale', css.includes('.match-library-search {\n  position: relative;\n  display: block;\n  min-width: 0;\n}')],
  ['R33.1E wrapper fuori dal gruppo visual surface', !css.includes('.match-library-toolbar select,\n.match-library-search {')],
  ['R33.1E input non neutralizzato dal domain owner', css.includes('.match-library-search input {\n  width: 100%;\n  min-width: 0;\n}') && !css.includes('.match-library-search input {\n  width: 100%;\n  min-width: 0;\n  border: 0;')],
  ['R33.1E icona posizionata dentro il controllo', css.includes('.match-library-search .nav-icon {\n  position: absolute;') && css.includes('pointer-events: none;') && css.includes('transform: translateY(-50%);')],
  ['R33.1E input canonico e unica surface', controls.includes('R33.1E MATCH LIBRARY SEARCH SINGLE INPUT SURFACE') && controls.includes('padding-inline-start: calc(var(--staff-control-inline-compact) + 28px);')],
  ['R33.1E workaround R33.1C e wrapper radius ritirati', !controls.includes('R33.1C MATCH LIBRARY SEARCH SINGLE SURFACE') && !controls.includes('.match-library-search,\n.ts-player-search,\n.analysis-toolbar {')],
  ['R33.1E non usa important', !controls.split('R33.1E MATCH LIBRARY SEARCH SINGLE INPUT SURFACE')[1].includes('!important')],
  ['R33.1 non usa important', !css.split('R33.1 UPCOMING AGENDA')[1].includes('!important')],
]

let passed=0
for (const [label,ok] of checks) {
  if(ok) {
    console.log(`PASS  ${label}`)
    passed += 1
  } else {
    console.error(`FAIL  ${label}`)
    process.exitCode=1
  }
}

console.log(`\nR33.1 Match Library Operational + Upcoming Agenda: ${passed}/${checks.length}`)
if(passed !== checks.length) process.exit(1)