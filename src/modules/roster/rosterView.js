export function renderRosterView({
  players,
  icon,
  playerIdentity,
  team,
  canEdit = false,
  persistence = {},
}) {
  const roleOrder = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']
  const roleLabels = {
    Portiere: 'Portieri',
    Difensore: 'Difensori',
    Centrocampista: 'Centrocampisti',
    Attaccante: 'Attaccanti',
  }
  const activePlayers = players.filter((player) => player.active !== false)
  const groupedPlayers = roleOrder.map((role) => ({
    role,
    label: roleLabels[role],
    players: activePlayers
      .filter((player) => player.role === role)
      .sort((a, b) => {
        const surnameA = String(a.name).trim().split(/\s+/).pop() || ''
        const surnameB = String(b.name).trim().split(/\s+/).pop() || ''
        return surnameA.localeCompare(surnameB, 'it', { sensitivity: 'base' })
      }),
  })).filter((group) => group.players.length)

  const persistenceNote = persistence.migrationRequired
    ? '<p class="roster-foundation-note is-warning">Rosa persistente non ancora inizializzata: esegui la migrazione Supabase inclusa nella release.</p>'
    : persistence.legacyFallback
      ? '<p class="roster-foundation-note">Stai visualizzando la Rosa legacy. Alla prima modifica verrà migrata nella Rosa della squadra.</p>'
      : ''

  return `
    <section class="view page-view roster-view" data-roster-view>
      <div class="page-head">
        <div>
          <h1>Rosa · ${team?.shortName || team?.name || 'Squadra'}</h1>
          <p><span>${activePlayers.length} GIOCATORI</span><b>•</b>${team?.category || 'Categoria da definire'} · ${team?.season || 'Stagione da definire'}</p>
        </div>
        <div class="page-actions">
          ${canEdit ? `<button class="primary-action" type="button" data-roster-create>${icon('plus')}Nuovo giocatore</button>` : ''}
        </div>
      </div>
      ${persistenceNote}
      ${activePlayers.length ? `
        <div class="squad-departments">
          ${groupedPlayers.map((group) => `
            <section class="squad-department">
              <div class="squad-department-head">
                <div><span>${icon('squad')}</span><h2>${group.label}</h2></div>
                <b>${group.players.length}</b>
              </div>
              <div class="players-grid">
                ${group.players.map((player) => `
                  <article class="player-card" data-roster-player-id="${player.id || ''}">
                    <button class="player-card__profile" type="button" data-player-profile="${playerIdentity(player)}">
                      <div class="player-avatar">${player.initials}</div>
                      <div class="player-main"><h3>${player.name}</h3><p>${player.year || 'Anno —'} · ${player.role}</p></div>
                    </button>
                    <div class="player-meta">
                      <span>Piede ${player.foot || '—'}${player.number != null ? ` · #${player.number}` : ''}</span>
                      <strong class="${player.status === 'Disponibile' ? 'ok' : 'warn'}">${player.status}</strong>
                    </div>
                    ${canEdit ? `<div class="player-card__actions">
                      <button class="ghost-button" type="button" data-roster-edit="${playerIdentity(player)}">Modifica</button>
                      ${player.id ? `<button class="ghost-button danger" type="button" data-roster-remove="${player.id}">Rimuovi</button>` : ''}
                    </div>` : ''}
                  </article>
                `).join('')}
              </div>
            </section>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state roster-empty-state">
          <h2>Nessun giocatore nella Rosa</h2>
          <p>Aggiungi i giocatori della tua squadra: saranno usati automaticamente in Convocazioni, Nostra squadra e Training.</p>
          ${canEdit ? `<button class="primary-action" type="button" data-roster-create>${icon('plus')}Aggiungi primo giocatore</button>` : ''}
        </div>
      `}
    </section>
  `
}
