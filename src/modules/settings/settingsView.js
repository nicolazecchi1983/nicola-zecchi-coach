export function renderSettingsView({ can, capabilities, icon }) {
  return `
    <section class="view page-view settings-view">
      <div class="page-head">
        <div><h1>Impostazioni</h1><p><span>PORTALE</span><b>•</b>Configurazione e accessi</p></div>
      </div>
      <div class="settings-grid">
        ${can(capabilities.STAFF_MANAGE) ? `
          <button class="settings-card" type="button" data-open-staff>
            <span class="settings-card-icon">${icon('squad')}</span>
            <span><strong>Gestione Staff</strong><small>Crea, modifica ruoli e gestisci gli accessi.</small></span>
            <b>→</b>
          </button>
        ` : ''}
        ${can(capabilities.TEAM_IDENTITY_UPDATE) ? `<button class="settings-card" type="button" data-open-team-settings>
          <span class="settings-card-icon">${icon('settings')}</span>
          <span><strong>Squadra e Rosa</strong><small>Nome, logo e giocatori: fonte unica per tutto STAFF.</small></span>
          <b>→</b>
        </button>` : ''}
        <button class="settings-card" type="button" data-open-profile>
          <span class="settings-card-icon">${icon('settings')}</span>
          <span><strong>Il mio profilo</strong><small>Nome, cognome e password personale.</small></span>
          <b>→</b>
        </button>
      </div>
    </section>
  `
}
