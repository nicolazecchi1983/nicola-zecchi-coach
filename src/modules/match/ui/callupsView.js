import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

const ROLE_ORDER = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']

export function renderCallupsView({ players, activeMatch, escapeHtml, teamName = '', savedCallups = null }) {
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
  const savedIds = new Set((savedCallups?.players || []).map((item) => String(item.playerId || '')).filter(Boolean))
  const savedNames = new Set((savedCallups?.players || []).map((item) => String(item.name || '').toLocaleLowerCase('it-IT')).filter(Boolean))
  const isPersisted = Boolean(savedCallups?.persisted)
  const isSelected = (player) => !isPersisted || savedIds.has(String(player.id || '')) || savedNames.has(String(player.name || '').toLocaleLowerCase('it-IT'))

  const contentHtml = `
      <section class="workspace-surface product-surface callups-panel callups-panel--standalone" data-callups-panel>
        <div class="callups-head callups-selection-bar" aria-label="Selezione convocati">
          <div class="callups-bulk-actions" role="group" aria-label="Azioni selezione convocati">
            <button class="staff-button staff-button--secondary callups-bulk-button" type="button" data-callups-select-all>Seleziona tutti</button>
            <button class="staff-button staff-button--secondary callups-bulk-button" type="button" data-callups-clear-all>Deseleziona tutti</button>
          </div>
          <div class="callups-counter"><strong data-callups-count>${activePlayers.filter(isSelected).length}</strong><span> selezionati</span></div>
        </div>
        <div class="callups-toolbar">
          <label><span>Partita / avversario</span><input name="callups_match" data-callups-match value="${escapeHtml(matchLabel)}" readonly></label>
          <label><span>Data</span><input name="callups_date" type="date" data-callups-date value="${escapeHtml(matchDate)}" readonly></label>
          <div class="callups-toolbar-actions"><button class="staff-button staff-button--secondary" type="button" data-callups-save>Salva convocati</button><button class="primary-action" type="button" data-callups-pdf>Crea PDF convocazioni</button></div>
        </div>
        <div class="callups-alert" data-callups-alert hidden></div>
        <div class="callups-role-groups">
          ${groups.map((group) => `<section class="callups-role-group"><header><span>${escapeHtml(group.role.toUpperCase())}</span><small>${group.players.length}</small></header><div class="callups-list">${group.players.map((player) => { order += 1; return `<label class="callup-player"><input name="callup_player" type="checkbox" value="${escapeHtml(player.name)}" data-callup-player data-callup-player-id="${escapeHtml(player.id || '')}" data-callup-role="${escapeHtml(player.role)}" data-callup-shirt-number="${escapeHtml(player.number ?? '')}" ${isSelected(player) ? 'checked' : ''}><b data-callup-order>${String(order).padStart(2, '0')}</b><span>${escapeHtml(player.name)}</span><small>${escapeHtml(player.role)}</small></label>` }).join('')}</div></section>`).join('')}
        </div>
      </section>`

  return matchWorkspaceShellHtml({
    activeSection: 'callups',
    teamName,
    titleHtml: `Convocazioni · ${escapeHtml(opponent)}`,
    descriptionHtml: 'Seleziona i giocatori disponibili per questa gara',
    className: 'match-callups-view',
    contentHtml,
  })
}