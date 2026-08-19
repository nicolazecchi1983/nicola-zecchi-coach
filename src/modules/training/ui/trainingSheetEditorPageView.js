/**
 * Pure Training Sheet Editor page renderer.
 * Receives prepared data; owns no application state, persistence or event wiring.
 */
export function renderTrainingSheetEditorPage({
  canEdit = false,
  rosterPlayers = [],
  calendarEvents = [],
  icon,
  locationOptionsHtml = '',
  escapeHtml,
}) {
  const departmentOrder = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']
  const departmentLabels = {
    Portiere: 'Portieri',
    Difensore: 'Difensori',
    Centrocampista: 'Centrocampisti',
    Attaccante: 'Attaccanti',
  }
  if (!canEdit) {
    return `
      <section class="view page-view product-page-shell training-product-shell">
        <div class="page-head product-page-header"><div><h1>Training Sheet Editor</h1><p><span>ACCESSO RISERVATO</span><b>•</b>Permesso di modifica necessario</p></div></div>
        <div class="placeholder-panel"><h2>Editor non disponibile</h2><p>Puoi consultare le Training Sheet pubblicate direttamente dal Calendario.</p></div>
      </section>
    `
  }
  const playerOptions = departmentOrder.map((department) => {
    const rows = rosterPlayers.filter((player) => player.department === department).map((player) => `
      <label class="ts-player-option">
        <input type="checkbox" value="${escapeHtml(player.canonicalName)}" data-canonical-name="${escapeHtml(player.canonicalName)}" data-surname="${escapeHtml(player.surname)}">
        <span>${escapeHtml(player.displayName)}</span>
      </label>`).join('')
    return `<div class="ts-roster-department"><strong>${departmentLabels[department]}</strong>${rows}</div>`
  }).join('')

  const editableSheets = calendarEvents
    .filter((event) => event.trainingSheetPath)
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
    .map((event) => {
      const date = new Date(event.startAt).toLocaleDateString('it-IT')
      const code = event.trainingSheetPath.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || ''
      return `<option value="${escapeHtml(event.id)}">${code ? `ALL_${String(code).padStart(3, '0')} · ` : ''}${date} · ${escapeHtml(event.place || 'Campo da definire')}</option>`
    }).join('')

  return `
    <section class="view page-view product-page-shell training-product-shell ts-manual-editor" data-ts-manual-editor>
      <div class="page-head product-page-header ts-editor-titlebar">
        <div>
          <h1>Training Sheet Editor</h1>
          <p><span>CREAZIONE SEDUTA</span><b>•</b>Compila e genera il PDF</p>
        </div>
        <div class="ts-editor-actions-wrap">
          <div class="ts-editor-actions">
            <label class="ts-open-sheet"><select name="open_training_sheet" data-open-training-sheet aria-label="Seleziona Training Sheet pubblicata"><option value="">Seleziona TS pubblicata</option>${editableSheets}</select></label>
            <div class="ts-command-actions" data-ts-command-actions>
              <button class="staff-button staff-button--primary ts-open-button" type="button" data-open-training-sheet-button aria-label="Apri Training Sheet pubblicata" disabled><span class="ts-open-button-icon" aria-hidden="true">${icon?.('sheet') || ''}</span><span class="ts-open-button-label">Apri TS</span></button>
              <details class="ts-more-menu">
                <summary class="staff-button staff-button--secondary ts-more-button" aria-label="Altre azioni">•••</summary>
                <div class="ts-more-menu-popover">
                  <button class="ts-menu-danger" type="button" data-reset-training-sheet>Reset editor</button>
                </div>
              </details>
            </div>
            <div class="ts-draft-state ts-draft-state--compact" data-ts-draft-state data-status="draft"><i></i><span>Bozza</span></div>
          </div>
        </div>
      </div>

      <nav class="ts-step-nav product-section-nav" aria-label="Sezioni Training Sheet">
        ${['Informazioni seduta','Rosa e presenze','Carico e focus fisico','Fasi allenamento','Obiettivo e principi','Riepilogo'].map((label,index)=>`<button type="button" class="${index===0?'is-active':''}" data-ts-step-button="${index+1}"><b>${String(index+1).padStart(2,'0')}</b><span>${label}</span></button>`).join('')}
      </nav>

      <div class="ts-workspace ts-workspace--steps">
        <form class="ts-manual-form" data-ts-manual-form>
          <section class="ts-form-card ts-step is-active" data-ts-step="1">
            
            <div class="ts-fields-grid ts-session-grid">
              <label class="ts-field"><span>Data</span><div class="ts-input-icon"><i>${icon('calendar')}</i><input name="date" type="date" required></div></label>
              <label class="ts-field"><span>Orario</span><div class="ts-input-icon"><i>${icon('clock')}</i><input name="time" type="time" value="17:30" required></div></label>
              <label class="ts-field ts-field--location"><span>Campo</span><select name="location">${locationOptionsHtml}</select></label>
              <label class="ts-field ts-custom-location" data-ts-custom-location hidden><span>Nome campo / impianto</span><input name="custom_location" type="text" maxlength="100" autocomplete="off" placeholder="Scrivi il nome del campo"></label>
              <label class="ts-field"><span>Allenamento n°</span><input name="progressive" type="number" min="1" value="1"><small class="ts-field-help">Proposto automaticamente, modificabile</small></label>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="2">
            
            <div class="ts-roster-summary">
              <label class="ts-field ts-present-count"><span>Presenti</span><input name="present" type="number" min="0" value="28" readonly aria-readonly="true"><small class="ts-field-help">Calcolati automaticamente dalla Rosa</small></label>
            </div>
            <div class="ts-roster-grid ts-roster-grid--four">
              ${[['absent','Assenti',''],['injured','Infortunati','is-injured'],['differentiated','Differenziato','is-differentiated']].map(([type,label,className]) => `
                <details class="ts-multiselect ${className}" data-player-select="${type}">
                  <summary><span>${label}</span><b data-count>0 selezionati</b></summary>
                  <div class="ts-player-search"><input name="player_search" type="search" data-player-search placeholder="Cerca per nome o cognome" autocomplete="off"><button type="button" data-clear-player-search aria-label="Pulisci ricerca">×</button></div>
                  <div class="ts-player-options">${playerOptions}</div>
                </details>`).join('')}
              <div class="ts-selection-card ts-aggregated-select">
                <span class="ts-selection-card__label">Aggregati</span>
                <details class="ts-aggregated-menu" data-aggregated-menu>
                  <summary><span data-aggregated-summary>Gestisci</span></summary>
                  <div class="ts-aggregated-panel">
                    <label class="ts-aggregated-source-row">
                      <span>Prova</span>
                      <input name="aggregated_prova_count" type="number" min="0" max="99" step="1" value="0" inputmode="numeric" aria-label="Numero giocatori in prova">
                    </label>
                    <label class="ts-aggregated-source-row">
                      <span>Settore giovanile</span>
                      <input name="aggregated_youth_count" type="number" min="0" max="99" step="1" value="0" inputmode="numeric" aria-label="Numero giocatori dal settore giovanile">
                    </label>
                  </div>
                </details>
                <input name="aggregated" type="hidden" value="">
                <input name="aggregated_count" type="hidden" value="0">
              </div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="3">
            
            <div class="ts-choice-block ts-match-day-block"><span class="ts-choice-label">Match Day</span><div class="ts-md-selector" data-ts-md-selector>
              ${['PREPARAZIONE','MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD',''].map((md) => `<button type="button" data-md="${md}">${md || 'Nessuno'}</button>`).join('')}
              <input name="match_day" type="hidden">
            </div></div>
            <div class="ts-load-grid">
              <label class="ts-field ts-load-focus"><span>Focus fisico</span><select name="focus"><option value="">Seleziona</option><option>Metabolico</option><option>Forza</option><option>Resistenza alla velocità</option><option>Velocità</option></select></label>
              <div class="ts-choice-block ts-load-metric ts-load-intensity"><span class="ts-choice-label">Intensità</span><div class="ts-rating" data-rating="intensity">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="intensity" type="hidden"></div></div>
              <div class="ts-choice-block ts-load-metric ts-load-volume"><span class="ts-choice-label">Volume</span><div class="ts-rating" data-rating="volume">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="volume" type="hidden"></div></div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="4">
            
            <div class="ts-phases-editor" data-ts-phases></div>
            <button class="staff-button staff-button--secondary ts-add-phase" type="button" data-add-phase>＋ Aggiungi fase</button>
          </section>
          <section class="ts-form-card ts-step" data-ts-step="5">
            
            <div class="ts-pillars" data-ts-pillars>
              ${[
                ['create','Creare il vantaggio'],['keep','Conservare il vantaggio'],['exploit','Sfruttare il vantaggio'],['defend','Difendere il vantaggio']
              ].map(([key,label])=>`<label class="ts-pillar ts-pillar--${key}"><input type="checkbox" name="pillars" value="${label}"><span>${label}</span></label>`).join('')}
            </div>
            <div class="ts-analysis-fields">
              <button class="staff-button staff-button--secondary ts-ai-button" type="button" data-analyze-exercises>✦ Analizza esercitazioni</button>
              <p class="ts-ai-note" data-ai-note>Nessuna modifica viene pubblicata automaticamente.</p>
              <label class="ts-field ts-field-full"><span>Obiettivo della seduta</span><textarea name="objective" rows="3" placeholder="Puoi scriverlo manualmente o generarlo dopo aver compilato i contenitori."></textarea></label>
              <label class="ts-field ts-field-full"><span>Principi di gioco</span><textarea name="principles" rows="4" placeholder="Puoi scriverli manualmente o generarli dopo aver compilato i contenitori."></textarea></label>
            </div>
          </section>

        </form>

        <aside class="ts-live-column product-surface ts-step" data-ts-step="6">
          <div class="ts-card-head ts-summary-head"><span>06</span><div><h2>Riepilogo</h2><p>Controlla la Training Sheet prima della pubblicazione.</p></div></div>
          <div class="ts-preview-stage">
            <div class="ts-preview-toolbar">
              <div class="ts-preview-heading"><span>ANTEPRIMA LIVE</span><strong>Training Sheet</strong></div>
              <div class="ts-preview-actions">
                <button type="button" class="staff-button staff-button--secondary" data-preview-pdf>${icon('sheet')}<span>Anteprima PDF</span></button>
                <button type="button" class="staff-button staff-button--secondary" data-download-pdf><span>Scarica PDF</span></button>
                <button type="button" class="staff-button staff-button--primary" data-publish-training-sheet>Pubblica Training Sheet</button>
              </div>
              <p class="ts-publish-note" data-publish-note>Pubblica in STAFF, Calendario e Training Library. Il download sul dispositivo è facoltativo.</p>
            </div>
            <div class="ts-paper-frame"><article class="ts-paper" data-ts-preview></article></div>
          </div>
        </aside>
      </div>

      <footer class="match-form-footer ts-step-footer" data-ts-step-footer>
        <button type="button" class="staff-button staff-button--secondary" data-ts-step-prev><span aria-hidden="true">←</span> Indietro</button>
        <span data-ts-step-status>Sezione 1 di 6</span>
        <button type="button" class="staff-button staff-button--primary" data-ts-step-next>Continua <span aria-hidden="true">→</span></button>
      </footer>
    </section>
  `
}
