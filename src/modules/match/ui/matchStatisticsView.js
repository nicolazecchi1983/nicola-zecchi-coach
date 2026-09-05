import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'
import { buildCanonicalMatchDataSnapshot, buildMatchDataSnapshot } from '../matchStatisticsModel.js'


function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null') } catch { return null }
}

function metricCard(label, value, detail = '') {
  return `<article class="match-stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</article>`
}

function rankedRows(entries = {}, emptyText) {
  const rows = Object.entries(entries).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
  if (!rows.length) return `<p class="match-stat-empty">${escapeHtml(emptyText)}</p>`
  const max = Math.max(...rows.map(([, value]) => value), 1)
  return rows.map(([name, value]) => `<div class="match-stat-rank"><span>${escapeHtml(name)}</span><div><i style="--stat-value:${(value / max) * 100}%"></i></div><strong>${value}</strong></div>`).join('')
}

function minutesRows(items = [], { duration = 90, finalized = true, canonical = false } = {}) {
  if (canonical && !finalized) {
    return '<p class="match-stat-empty">Finalizza la partita nel Match Center per calcolare il minutaggio definitivo.</p>'
  }
  if (!items.length) {
    return `<p class="match-stat-empty">${canonical ? 'Formazione PRE non disponibile per il calcolo del minutaggio.' : 'Dati di minutaggio non disponibili.'}</p>`
  }
  const safeDuration = Math.max(1, Number(duration) || 90)
  return items.map((item) => `<div class="match-minutes-row"><span>${escapeHtml(item.player)}</span><div><i style="--stat-value:${Math.min(100, (item.minutes / safeDuration) * 100)}%"></i></div><strong>${item.minutes}'</strong></div>`).join('')
}

export function createMatchStatisticsView({ storage, createMatchLibraryService, getCalendarEvents, getTeamProfile }) {
  return function matchStatisticsView() {
    const active = readJson(storage, 'staff-active-match')
    if (!active?.id) {
      return '<section class="content-section"><div class="empty-state"><h1>Nessuna partita selezionata</h1><p>Apri una partita dalla Match Library.</p></div></section>'
    }

    const calendarEvents = getCalendarEvents()
    const teamProfile = getTeamProfile()
    const service = createMatchLibraryService({ storage })
    const match = service.list(calendarEvents, teamProfile?.season || '').find((item) => String(item.id) === String(active.id)) || active
    const eventModel = calendarEvents.find((item) => String(item.id) === String(active.id)) || null
    const canonicalSnapshot = buildCanonicalMatchDataSnapshot(eventModel, match)
    const snapshot = canonicalSnapshot || buildMatchDataSnapshot(readJson(storage, `nz-match-sheet-editor-v2:${active.id}`) || {}, match)
    const canonical = snapshot.source === 'calendar-match-center'
    const score = snapshot.goalsFor == null || snapshot.goalsAgainst == null ? '–' : `${snapshot.goalsFor}–${snapshot.goalsAgainst}`
    const outcomeLabel = { win: 'Vittoria', draw: 'Pareggio', loss: 'Sconfitta', pending: 'Da completare' }[snapshot.outcome]
    const sourceNote = canonical
      ? 'I numeri sono derivati dallo stesso evento Calendario: formazione PRE + eventi Match Center. Il minutaggio non viene salvato in una seconda copia.'
      : 'Questa partita usa ancora il percorso dati storico. Le nuove partite usano PRE + Match Center come fonte canonica.'

    const contentHtml = `<section class="content-section match-statistics" data-match-statistics>
      <div class="match-stat-summary">
        ${metricCard('Risultato', score, outcomeLabel)}
        ${metricCard('Giocatori utilizzati', snapshot.usedPlayers, `${snapshot.totals.starters} titolari`)}
        ${metricCard('Sostituzioni', snapshot.totals.substitutions, 'Registrate')}
        ${metricCard('Gol / Assist', `${snapshot.totals.goals} / ${snapshot.totals.assists}`, 'Eventi squadra')}
        ${metricCard('Cartellini', `${snapshot.totals.yellowCards} / ${snapshot.totals.redCards}`, 'Gialli / rossi')}
        ${metricCard('Modulo', snapshot.formation || '–', snapshot.competition || 'Partita')}
      </div>

      <div class="match-stat-grid">
        <article class="match-stat-panel match-stat-panel--wide"><header><span>MINUTAGGIO</span><h2>Minuti giocati</h2><p>Barre rapportate alla durata regolamentare della gara.</p></header><div class="match-minutes-chart">${minutesRows(snapshot.playerMinutes, { duration: snapshot.matchDuration, finalized: snapshot.minutesFinalized, canonical })}</div></article>
        <article class="match-stat-panel"><header><span>PRODUZIONE</span><h2>Marcatori</h2></header>${rankedRows(snapshot.leaders.scorers, 'Nessun marcatore registrato.')}</article>
        <article class="match-stat-panel"><header><span>PRODUZIONE</span><h2>Assist</h2></header>${rankedRows(snapshot.leaders.assists, 'Nessun assist registrato.')}</article>
        <article class="match-stat-panel match-stat-panel--sanctions">
          <header><span>DISCIPLINA</span><h2>Sanzioni</h2><p>Conteggio visivo dei provvedimenti registrati.</p></header>
          <div class="match-sanction-totals">
            <div class="match-sanction-total match-sanction-total--yellow"><i aria-hidden="true"></i><span>Ammonizioni</span><strong>${snapshot.totals.yellowCards}</strong></div>
            <div class="match-sanction-total match-sanction-total--red"><i aria-hidden="true"></i><span>Espulsioni</span><strong>${snapshot.totals.redCards}</strong></div>
          </div>
          <div class="match-sanction-breakdown">
            <section><h3>Ammoniti</h3>${rankedRows(snapshot.leaders.yellowCards, 'Nessuna ammonizione registrata.')}</section>
            <section><h3>Espulsi</h3>${rankedRows(snapshot.leaders.redCards, 'Nessuna espulsione registrata.')}</section>
          </div>
        </article>
      </div>

      <p class="match-stat-note">${escapeHtml(sourceNote)}</p>
    </section>`

    return matchWorkspaceShellHtml({
      activeSection: 'match-statistics',
      teamName: teamProfile?.name || '',
      titleHtml: `Statistiche · ${escapeHtml(snapshot.opponent)}`,
      contentHtml,
      className: 'match-statistics-workspace',
      attributes: { 'data-match-statistics-workspace': true },
    })
  }
}
