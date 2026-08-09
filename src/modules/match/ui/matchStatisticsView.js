import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'
import { buildMatchDataSnapshot } from '../matchStatisticsModel.js'

function escapeValue(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))
}

function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null') } catch { return null }
}

function metricCard(label, value, detail = '') {
  return `<article class="match-stat-card"><span>${escapeValue(label)}</span><strong>${escapeValue(value)}</strong>${detail ? `<small>${escapeValue(detail)}</small>` : ''}</article>`
}

function rankedRows(entries = {}, emptyText) {
  const rows = Object.entries(entries).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
  if (!rows.length) return `<p class="match-stat-empty">${escapeValue(emptyText)}</p>`
  const max = Math.max(...rows.map(([, value]) => value), 1)
  return rows.map(([name, value]) => `<div class="match-stat-rank"><span>${escapeValue(name)}</span><div><i style="--stat-value:${(value / max) * 100}%"></i></div><strong>${value}</strong></div>`).join('')
}

function minutesRows(items = []) {
  if (!items.length) return '<p class="match-stat-empty">Completa formazione e sostituzioni nel Match Sheet.</p>'
  return items.map((item) => `<div class="match-minutes-row"><span>${escapeValue(item.player)}</span><div><i style="--stat-value:${Math.min(100, (item.minutes / 90) * 100)}%"></i></div><strong>${item.minutes}'</strong></div>`).join('')
}

export function createMatchStatisticsView({ storage, createMatchLibraryService, getCalendarEvents, getTeamProfile }) {
  return function matchStatisticsView() {
    const active = readJson(storage, 'staff-active-match')
    if (!active?.id) {
      return '<section class="content-section"><div class="empty-state"><h1>Nessuna partita selezionata</h1><p>Apri una partita dalla Match Library.</p></div></section>'
    }
    const service = createMatchLibraryService({ storage })
    const match = service.list(getCalendarEvents(), getTeamProfile().season || '').find((item) => String(item.id) === String(active.id)) || active
    const draft = readJson(storage, `nz-match-sheet-editor-v2:${active.id}`) || {}
    const snapshot = buildMatchDataSnapshot(draft, match)
    const score = snapshot.goalsFor == null || snapshot.goalsAgainst == null ? '–' : `${snapshot.goalsFor}–${snapshot.goalsAgainst}`
    const outcomeLabel = { win: 'Vittoria', draw: 'Pareggio', loss: 'Sconfitta', pending: 'Da completare' }[snapshot.outcome]

    return `<section class="content-section match-statistics" data-match-statistics>
      <header class="page-head match-context-page-head">
        <div><h1>Statistiche · ${escapeValue(snapshot.opponent)}</h1><p><span>MATCH WORKSPACE</span><b>•</b> Numeri generati dal Match Sheet</p></div>
        ${matchContextBackButtonHtml()}
      </header>

      <div class="match-stat-summary">
        ${metricCard('Risultato', score, outcomeLabel)}
        ${metricCard('Giocatori utilizzati', snapshot.usedPlayers, `${snapshot.totals.starters} titolari`)}
        ${metricCard('Sostituzioni', snapshot.totals.substitutions, 'Registrate')}
        ${metricCard('Gol / Assist', `${snapshot.totals.goals} / ${snapshot.totals.assists}`, 'Eventi squadra')}
        ${metricCard('Cartellini', `${snapshot.totals.yellowCards} / ${snapshot.totals.redCards}`, 'Gialli / rossi')}
        ${metricCard('Modulo', snapshot.formation || '–', snapshot.competition || 'Partita')}
      </div>

      <div class="match-stat-grid">
        <article class="match-stat-panel match-stat-panel--wide"><header><span>MINUTAGGIO</span><h2>Minuti giocati</h2><p>Barre rapportate ai 90 minuti regolamentari.</p></header><div class="match-minutes-chart">${minutesRows(snapshot.playerMinutes)}</div></article>
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

      <p class="match-stat-note">I numeri vengono ricalcolati automaticamente dai dati della partita. Le statistiche stagionali saranno costruite sopra questa stessa struttura.</p>
    </section>`
  }
}
