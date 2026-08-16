export function createRosterModalViews({
  appState,
  rosterPlayerIdentity,
  rosterPlayerKey,
  escapeHtml,
  icon,
}) {
  function playerProfileModalHtml(player) {
    const identity = rosterPlayerIdentity(player)
    const legacyKey = rosterPlayerKey(player)
    const saved = appState.playerProfiles[identity] || appState.playerProfiles[legacyKey] || {}
    return `
      <div class="new-event-modal-backdrop player-profile-backdrop" data-close-player-profile>
        <section class="new-event-modal player-profile-modal" role="dialog" aria-modal="true" aria-labelledby="playerProfileTitle">
          <div class="new-event-modal__head">
            <div><span>SCHEDA GIOCATORE</span><h2 id="playerProfileTitle">${escapeHtml(player.name)}</h2></div>
            <button type="button" class="new-event-modal__close" data-close-player-profile>${icon('close')}</button>
          </div>
          <form class="player-profile-form" data-player-profile-form data-player-id="${escapeHtml(player.id || '')}" data-player-legacy-key="${escapeHtml(legacyKey)}">
            <div class="player-profile-scroll">
            <div class="player-profile-grid roster-player-grid">
              <label class="form-field"><span>Nome e cognome</span><input name="full_name" value="${escapeHtml(saved.full_name || player.name)}" required></label>
              <label class="form-field"><span>Ruolo</span><select name="role">${['Portiere','Difensore','Centrocampista','Attaccante'].map(role=>`<option ${role===(saved.role||player.role)?'selected':''}>${role}</option>`).join('')}</select></label>
              <label class="form-field"><span>Anno di nascita</span><input name="birth_year" inputmode="numeric" value="${escapeHtml(saved.birth_year || player.year || '')}"></label>
              <label class="form-field"><span>Piede preferito</span><select name="preferred_foot"><option value="">Da definire</option><option value="DX" ${(saved.preferred_foot||player.foot)==='DX'?'selected':''}>Destro</option><option value="SX" ${(saved.preferred_foot||player.foot)==='SX'?'selected':''}>Sinistro</option><option value="AMB" ${saved.preferred_foot==='AMB'?'selected':''}>Ambidestro</option></select></label>
              <label class="form-field"><span>Altezza (cm)</span><input name="height_cm" type="number" min="120" max="230" value="${escapeHtml(saved.height_cm || '')}"></label>
              <label class="form-field"><span>Peso (kg)</span><input name="weight_kg" type="number" min="35" max="180" step="0.1" value="${escapeHtml(saved.weight_kg || '')}"></label>
              <label class="form-field"><span>Telefono</span><input name="phone" type="tel" value="${escapeHtml(saved.phone || '')}"></label>
              <label class="form-field"><span>Email</span><input name="email" type="email" value="${escapeHtml(saved.email || '')}"></label>
            </div>
            <div class="player-profile-notes-grid">
              <label class="form-field"><span>Note tecniche</span><textarea name="technical_notes" rows="4">${escapeHtml(saved.technical_notes || '')}</textarea></label>
              <label class="form-field"><span>Note infortuni</span><textarea name="injury_notes" rows="4">${escapeHtml(saved.injury_notes || '')}</textarea></label>
            </div>
            <p class="form-message" data-player-profile-message></p>
            </div>
            <div class="modal-actions player-profile-actions"><button type="button" class="ghost-button" data-close-player-profile>Annulla</button><button type="submit" class="primary-action">Salva scheda</button></div>
          </form>
        </section>
      </div>`
  }

  function rosterPlayerModalHtml(player = null) {
    const isEditing = Boolean(player)
    const key = rosterPlayerKey(player || {})
    return `
      <div class="new-event-modal-backdrop" data-close-roster-player>
        <section class="new-event-modal roster-player-modal" role="dialog" aria-modal="true" aria-labelledby="rosterPlayerTitle">
          <div class="new-event-modal__head">
            <div><span>ROSA SQUADRA</span><h2 id="rosterPlayerTitle">${isEditing ? 'Modifica giocatore' : 'Nuovo giocatore'}</h2></div>
            <button type="button" class="new-event-modal__close" data-close-roster-player>${icon('close')}</button>
          </div>
          <form class="roster-player-form roster-player-form--v2" data-roster-player-form>
            <input type="hidden" name="id" value="${escapeHtml(player?.id || '')}">
            <input type="hidden" name="key" value="${escapeHtml(key)}">
            <div class="player-profile-grid roster-player-grid">
              <label class="form-field"><span>Nome e cognome</span><input name="name" value="${escapeHtml(player?.name || '')}" required></label>
              <label class="form-field"><span>Ruolo</span><select name="role">${['Portiere','Difensore','Centrocampista','Attaccante'].map((role)=>`<option value="${role}" ${role===(player?.role || 'Difensore')?'selected':''}>${role}</option>`).join('')}</select></label>
              <label class="form-field"><span>Anno di nascita</span><input name="year" inputmode="numeric" maxlength="4" value="${escapeHtml(player?.year || '')}" placeholder="Es. 2007"></label>
              <label class="form-field"><span>Piede preferito</span><select name="foot"><option value="">Da definire</option><option value="DX" ${player?.foot==='DX'?'selected':''}>Destro</option><option value="SX" ${player?.foot==='SX'?'selected':''}>Sinistro</option><option value="AMB" ${player?.foot==='AMB'?'selected':''}>Ambidestro</option></select></label>
              <label class="form-field roster-shirt-number-field"><span class="roster-field-label-row"><b>Numero maglia stagionale</b><em>Opzionale</em></span><input name="number" type="number" min="1" max="99" value="${escapeHtml(player?.number ?? '')}" placeholder="—"></label>
              <label class="form-field"><span>Stato</span><select name="status">${['Disponibile','Infortunato','Differenziato','Non disponibile'].map((status)=>`<option value="${status}" ${status===(player?.status || 'Disponibile')?'selected':''}>${status}</option>`).join('')}</select></label>
            </div>
            <p class="form-message" data-roster-player-message></p>
            <div class="modal-actions">
              <button type="button" class="ghost-button" data-close-roster-player>Annulla</button>
              <button type="submit" class="primary-action">${isEditing ? 'Salva modifiche' : 'Aggiungi alla Rosa'}</button>
            </div>
          </form>
        </section>
      </div>`
  }

  return {
    playerProfileModalHtml,
    rosterPlayerModalHtml,
  }
}
