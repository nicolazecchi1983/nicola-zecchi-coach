export function renderProfileView({ currentUserProfile, currentUser, currentUserRole, profileFullName, roleLabel }) {
  const email = currentUserProfile?.email || currentUser?.email || ''
  const firstName = currentUserProfile?.first_name || ''
  const lastName = currentUserProfile?.last_name || ''
  const fullName = profileFullName(currentUserProfile)
  const currentRoleLabel = roleLabel(currentUserRole)

  return `
    <section class="view page-view">
      <div class="page-head">
        <div>
          <h1>Il mio profilo</h1>
          <p><span>ACCOUNT PERSONALE</span><b>•</b>${currentRoleLabel}</p>
        </div>
      </div>

      <div class="profile-page-grid">
        <form class="profile-card" data-profile-form>
          <div class="profile-card-head">
            <span class="profile-page-avatar">${fullName.charAt(0).toUpperCase()}</span>
            <div><h2>Dati personali</h2><p>Aggiorna nome e cognome mostrati nel portale.</p></div>
          </div>
          <div class="profile-name-grid">
            <label class="form-field">
              <span>Nome</span>
              <input name="first_name" value="${firstName}" autocomplete="given-name" required>
            </label>
            <label class="form-field">
              <span>Cognome</span>
              <input name="last_name" value="${lastName}" autocomplete="family-name" required>
            </label>
          </div>
          <label class="form-field">
            <span>Email</span>
            <input name="profile_email_display" value="${email}" type="email" disabled>
          </label>
          <label class="form-field">
            <span>Ruolo</span>
            <input name="profile_role_display" value="${currentRoleLabel}" disabled>
          </label>
          <p class="form-message" data-profile-message></p>
          <button class="primary-action" type="submit">Salva profilo</button>
        </form>

        <form class="profile-card" data-password-form>
          <div class="profile-card-head">
            <div><h2>Cambia password</h2><p>Usa almeno 8 caratteri.</p></div>
          </div>
          <label class="form-field">
            <span>Nuova password</span>
            <input name="password" type="password" minlength="8" autocomplete="new-password" required>
          </label>
          <label class="form-field">
            <span>Conferma nuova password</span>
            <input name="password_confirm" type="password" minlength="8" autocomplete="new-password" required>
          </label>
          <p class="form-message" data-password-message></p>
          <button class="primary-action" type="submit">Aggiorna password</button>
        </form>
      </div>
    </section>
  `
}
