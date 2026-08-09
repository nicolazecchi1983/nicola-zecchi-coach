export function renderTeamSettingsView({ can, capabilities, getTeamProfile, teamFacilities = [], teamLogoHtml, escapeHtml }) {
  if (!can(capabilities.TEAM_IDENTITY_UPDATE)) return `<section class="placeholder"><h1>Identità squadra</h1><p>Accesso riservato all’amministratore.</p></section>`
  const team = getTeamProfile()
  const facilityRows = (Array.isArray(teamFacilities) ? teamFacilities : [])
    .map((facility) => `<div class="team-facility-row" data-team-facility-row>
      <input type="text" maxlength="100" value="${escapeHtml(facility?.name || '')}" placeholder="Nome campo / impianto" aria-label="Nome campo o impianto">
      <button type="button" class="ghost-button team-facility-remove" data-remove-team-facility aria-label="Rimuovi ${escapeHtml(facility?.name || 'campo')}">Rimuovi</button>
    </div>`).join('')

  return `<section class="view page-view team-settings-view">
    <div class="page-head"><div><h1>Squadra e Rosa</h1><p><span>FONTE DATI SQUADRA</span><b>•</b>Identità, impianti e Rosa usati automaticamente in tutto STAFF</p></div></div>
    <form class="team-settings-card" data-team-settings-form>
      <div class="team-brand-preview" data-team-brand-preview style="--team-primary:${escapeHtml(team.primaryColor)};--team-secondary:${escapeHtml(team.secondaryColor)}">
        ${teamLogoHtml('team-brand-preview-logo')}
        <div><strong>${escapeHtml(team.name)}</strong><span>${escapeHtml(team.category)} · ${escapeHtml(team.season)}</span></div>
      </div>
      <div class="team-settings-grid">
        <label><span>Nome completo squadra</span><input name="name" value="${escapeHtml(team.name)}" required></label>
        <label><span>Nome breve</span><input name="shortName" value="${escapeHtml(team.shortName)}" required maxlength="24"></label>
        <label><span>Stagione</span><input name="season" value="${escapeHtml(team.season)}"></label>
        <label><span>Categoria</span><input name="category" value="${escapeHtml(team.category)}"></label>
        <fieldset class="team-color-field" data-team-color-field="primaryColor"><legend>Colore principale</legend><div class="team-color-palette">${['#07194f','#1f93e5','#dc2626','#facc15','#16a34a','#ffffff','#111827','#f97316','#7c3aed'].map((color)=>`<button type="button" class="team-color-swatch" data-team-color-value="${color}" style="--swatch:${color}" aria-label="Scegli ${color}"></button>`).join('')}<label class="team-color-custom"><span>Personalizzato</span><input type="color" name="primaryColor" value="${escapeHtml(team.primaryColor)}"></label></div></fieldset>
        <fieldset class="team-color-field" data-team-color-field="secondaryColor"><legend>Colore secondario</legend><div class="team-color-palette">${['#07194f','#1f93e5','#dc2626','#facc15','#16a34a','#ffffff','#111827','#f97316','#7c3aed'].map((color)=>`<button type="button" class="team-color-swatch" data-team-color-value="${color}" style="--swatch:${color}" aria-label="Scegli ${color}"></button>`).join('')}<label class="team-color-custom"><span>Personalizzato</span><input type="color" name="secondaryColor" value="${escapeHtml(team.secondaryColor)}"></label></div></fieldset>
        <div class="team-kit-row">
          <label><span>Stile maglia</span><select name="kitPattern"><option value="solid" ${team.kitPattern==='solid'?'selected':''}>Tinta unita</option><option value="vertical" ${team.kitPattern==='vertical'?'selected':''}>Strisce verticali</option><option value="horizontal" ${team.kitPattern==='horizontal'?'selected':''}>Strisce orizzontali</option></select></label>
          <div class="team-token-preview-card" data-team-token-preview aria-label="Anteprima stile maglia" aria-live="polite">
            <div class="team-token-preview team-token-preview--${escapeHtml(team.kitPattern)}" style="--token-primary:${escapeHtml(team.primaryColor)};--token-secondary:${escapeHtml(team.secondaryColor)}"><b>10</b></div>
          </div>
        </div>
        <label class="team-logo-upload"><span>Logo squadra</span><input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG o WebP. Massimo 2 MB.</small></label>

        <fieldset class="team-facilities-field team-settings-wide">
          <legend>Campi / Impianti della squadra</legend>
          <p class="team-facilities-help">Questi sono i campi proposti per gli allenamenti. Una trasferta o un luogo occasionale del Calendario non viene aggiunto automaticamente.</p>
          <div class="team-facilities-list" data-team-facilities-list>
            ${facilityRows || '<div class="team-facilities-empty" data-team-facilities-empty>Nessun impianto configurato. Aggiungi il primo campo della squadra.</div>'}
          </div>
          <button type="button" class="ghost-button team-facility-add" data-add-team-facility>+ Aggiungi campo</button>
        </fieldset>
      </div>
      <input type="hidden" name="logo" value="${escapeHtml(team.logo)}">
      <p class="form-message" data-team-settings-message></p>
      <div class="team-settings-actions"><button type="button" class="ghost-button" data-team-logo-remove>Rimuovi logo</button><button type="button" class="ghost-button" data-open-team-roster>Apri Rosa</button><button type="submit" class="primary-action">Salva squadra</button></div>
    </form>
  </section>`
}
