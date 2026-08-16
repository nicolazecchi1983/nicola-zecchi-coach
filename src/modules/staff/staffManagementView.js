export function renderStaffManagementView({ can, capabilities, staffProfiles, currentUser, staffFlashMessage, getTeamProfile, escapeHtml, technicalRoleOptions, appRoleOptions, accessLevelLabel }) {
  if (!can(capabilities.STAFF_MANAGE)) {
    return `
      <section class="view page-view">
        <div class="page-head"><div><h1>Impostazioni</h1></div></div>
        <div class="placeholder-panel"><h2>Accesso riservato</h2><p>Solo Proprietario e Amministratore possono gestire lo staff.</p></div>
      </section>
    `
  }

  const teamOwnerId = getTeamProfile().ownerId || null
  const rows = staffProfiles.map((profile) => {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    const isTeamOwner = profile.id === teamOwnerId || profile.app_role === 'owner'
    const canDelete = !isTeamOwner && profile.id !== currentUser?.id
    const ownerLocked = isTeamOwner && profile.id !== currentUser?.id
    const level = isTeamOwner ? 'owner' : (profile.app_role || 'collaborator')
    return `
      <form class="staff-member-card" data-staff-form data-user-id="${profile.id}" data-is-owner="${isTeamOwner}">
        <div class="staff-member-avatar">${(profile.first_name || profile.email || 'U').charAt(0).toUpperCase()}</div>
        <div class="staff-member-fields">
          <label class="form-field"><span>Nome</span><input name="first_name" value="${escapeHtml(profile.first_name || '')}" required ${ownerLocked ? 'disabled' : ''}></label>
          <label class="form-field"><span>Cognome</span><input name="last_name" value="${escapeHtml(profile.last_name || '')}" required ${ownerLocked ? 'disabled' : ''}></label>
          <label class="form-field staff-email-field"><span>Email</span><input name="staff_email_display" value="${escapeHtml(profile.email || '')}" disabled></label>
          <label class="form-field"><span>Ruolo nello staff tecnico</span><select name="role" ${ownerLocked ? 'disabled' : ''}>${technicalRoleOptions(profile.role)}</select></label>
          <label class="form-field"><span>Livello di accesso</span><select name="app_role" ${isTeamOwner ? 'disabled' : ''}>${appRoleOptions(level, { includeOwner: isTeamOwner })}</select></label>
          <label class="staff-active-toggle"><input name="active" type="checkbox" ${profile.active !== false ? 'checked' : ''} ${isTeamOwner ? 'disabled' : ''}><span>Account attivo</span></label>
        </div>
        <div class="staff-member-actions">
          <span class="staff-member-name">${escapeHtml(name || 'Nome da completare')}</span>
          <span class="staff-access-badge staff-access-badge--${level}">${accessLevelLabel(level)}</span>
          <p class="form-message" data-staff-message></p>
          <div class="staff-member-action-row">
            ${canDelete ? '<button class="danger-button" type="button" data-delete-staff-user>Elimina utente</button>' : ''}
            ${ownerLocked ? '' : '<button class="primary-action" type="submit">Salva</button>'}
          </div>
        </div>
      </form>
    `
  }).join('')

  return `
    <section class="view page-view staff-management-view">
      <div class="page-head staff-page-head">
        <div><h1>Gestione Staff</h1><p><span>AMMINISTRAZIONE</span><b>•</b>Ruoli tecnici, permessi e accessi</p></div>
        <button type="button" class="primary-action" data-toggle-create-staff aria-expanded="false">＋ Nuovo utente</button>
      </div>

      <div class="staff-management-note staff-management-note--compact">
        <span aria-hidden="true">ⓘ</span>
        <p>Gli utenti vengono creati in modo sicuro dal portale e associati automaticamente alla squadra.</p>
      </div>

      ${staffFlashMessage ? `<p class="staff-flash-message is-success">${escapeHtml(staffFlashMessage)}</p>` : ''}

      <form class="staff-create-card" data-create-staff-form hidden>
        <div class="staff-create-heading">
          <div><span>NUOVO ACCESSO</span><h2>Crea utente staff</h2><p>Imposta ruolo tecnico, permessi e password temporanea.</p></div>
          <button type="button" class="icon-button" data-close-create-staff aria-label="Chiudi">×</button>
        </div>
        <div class="staff-create-grid">
          <label class="form-field"><span>Nome</span><input name="first_name" autocomplete="given-name" required maxlength="80"></label>
          <label class="form-field"><span>Cognome</span><input name="last_name" autocomplete="family-name" required maxlength="80"></label>
          <label class="form-field staff-create-email"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="form-field"><span>Ruolo nello staff tecnico</span><select name="role">${technicalRoleOptions('observer')}</select></label>
          <label class="form-field"><span>Livello di accesso</span><select name="app_role">${appRoleOptions('collaborator')}</select></label>
          <label class="form-field staff-password-field"><span>Password temporanea</span><div class="staff-password-control"><input name="password" type="text" minlength="10" autocomplete="new-password" required><button type="button" class="secondary-button" data-generate-staff-password>Genera</button></div><small>Almeno 10 caratteri. Consegnala direttamente all’utente.</small></label>
        </div>
        <p class="form-message" data-create-staff-message></p>
        <div class="staff-create-actions"><button type="button" class="secondary-button" data-cancel-create-staff>Annulla</button><button type="submit" class="primary-action">Crea utente</button></div>
      </form>

      <div class="staff-list">${rows || '<div class="placeholder-panel"><p>Nessun profilo disponibile.</p></div>'}</div>
    </section>
  `
}
