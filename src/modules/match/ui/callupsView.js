import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'

const ROLE_ORDER = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']

export function renderCallupsView({ players, activeMatch, escapeHtml }) {
  const activePlayers = players.filter((player) => player.active !== false)
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const matchLabel = activeMatch?.opponent ? `vs ${activeMatch.opponent}` : ''
  const matchDate = activeMatch?.date || ''
  const groups = ROLE_ORDER.map((role) => ({
    role,
    players: activePlayers
      .filter((player) => player.role === role)
      .slice()
      .sort((a, b) => String(a.name).split(/\s+/).pop().localeCompare(String(b.name).split(/\s+/).pop(), 'it')),
  })).filter((group) => group.players.length)
  let order = 0

  return `
    <section class="view page-view">
      <div class="page-head match-context-page-head">
        <div>
          <h1>Convocazioni · ${escapeHtml(opponent)}</h1>
          <p><span>MATCH WORKSPACE</span><b>•</b>Selezione giocatori per questa gara</p>
        </div>
        ${matchContextBackButtonHtml()}
      </div>
      ${matchContextNavigationHtml('callups')}
      <section class="callups-panel callups-panel--standalone" data-callups-panel>
        <div class="callups-head">
          <div><span>CONVOCAZIONI</span><h2>Lista convocati</h2><p>Tutta la rosa parte selezionata. Deseleziona soltanto i giocatori non convocati.</p></div>
          <div class="callups-counter"><strong data-callups-count>${activePlayers.length}</strong><span> selezionati</span></div>
        </div>
        <div class="callups-toolbar">
          <label><span>Partita / avversario</span><input data-callups-match value="${escapeHtml(matchLabel)}" readonly></label>
          <label><span>Data</span><input type="date" data-callups-date value="${escapeHtml(matchDate)}" readonly></label>
          <button class="primary-action" type="button" data-callups-pdf>Crea PDF convocazioni</button>
        </div>
        <div class="callups-alert" data-callups-alert hidden></div>
        <div class="callups-role-groups">
          ${groups.map((group) => `<section class="callups-role-group"><header><span>${escapeHtml(group.role.toUpperCase())}</span><small>${group.players.length}</small></header><div class="callups-list">${group.players.map((player) => { order += 1; return `<label class="callup-player"><input type="checkbox" value="${escapeHtml(player.name)}" data-callup-player data-callup-role="${escapeHtml(player.role)}" checked><b data-callup-order>${String(order).padStart(2, '0')}</b><span>${escapeHtml(player.name)}</span><small>${escapeHtml(player.role)}</small></label>` }).join('')}</div></section>`).join('')}
        </div>
      </section>
    </section>
  `
}
