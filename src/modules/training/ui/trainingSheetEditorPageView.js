/**
 * Pure Training Sheet Editor page renderer.
 * Receives prepared data; owns no application state, persistence or event wiring.
 */
export function renderTrainingSheetEditorPage({
  canEdit = false,
  rosterPlayers = [],
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
  const rosterRows = departmentOrder.map((department) => {
    const rows = rosterPlayers.filter((player) => player.department === department).map((player) => {
      const searchText = [player.displayName, player.canonicalName, player.surname].filter(Boolean).join(' ').toLocaleLowerCase('it-IT')
      return `
        <div class="ts-roster-player" data-player-row data-canonical-name="${escapeHtml(player.canonicalName)}" data-surname="${escapeHtml(player.surname)}" data-search-text="${escapeHtml(searchText)}">
          <span class="ts-roster-player__identity"><strong>${escapeHtml(player.displayName)}</strong><small>${departmentLabels[department]}</small></span>
          <select name="player_status" data-player-status data-canonical-name="${escapeHtml(player.canonicalName)}" data-surname="${escapeHtml(player.surname)}" aria-label="Stato di ${escapeHtml(player.displayName)}">
            <option value="present">Presente</option>
            <option value="absent">Assente</option>
            <option value="injured">Infortunato</option>
            <option value="differentiated">Differenziato</option>
          </select>
        </div>`
    }).join('')
    return `<section class="ts-roster-department" data-roster-department><strong>${departmentLabels[department]}</strong>${rows}</section>`
  }).join('')

  return `
    <section class="view page-view product-page-shell training-product-shell ts-manual-editor" data-ts-manual-editor>
      <div class="page-head product-page-header ts-editor-titlebar">
        <div>
          <h1>Training Sheet Editor</h1>
          <p class="ts-editor-meta"><span>CREAZIONE SEDUTA</span><b>•</b><span class="ts-draft-state ts-draft-state--inline" data-ts-draft-state data-status="draft"><i></i><span>Bozza</span></span></p>
        </div>
        <div class="ts-editor-actions-wrap">
          <div class="ts-editor-actions">
            <div class="ts-command-actions" data-ts-command-actions>
              <details class="ts-more-menu">
                <summary class="staff-button staff-button--secondary ts-more-button" aria-label="Altre azioni">•••</summary>
                <div class="ts-more-menu-popover">
                  <button class="ts-menu-item" type="button" data-download-pdf-menu>Scarica PDF</button>
                  <button class="ts-menu-danger" type="button" data-reset-training-sheet>Reset editor</button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <nav class="ts-step-nav product-section-nav" aria-label="Sezioni Training Sheet">
        ${['Informazioni seduta','Rosa e presenze','Carico e focus fisico','Fasi allenamento','Obiettivo','Riepilogo'].map((label,index)=>`<button type="button" class="${index===0?'is-active':''}" data-ts-step-button="${index+1}"><b>${String(index+1).padStart(2,'0')}</b><span>${label}</span></button>`).join('')}
      </nav>

      <div class="ts-workspace ts-workspace--steps">
        <form class="ts-manual-form" data-ts-manual-form>
          <section class="ts-form-card ts-step is-active" data-ts-step="1">

            <div class="ts-fields-grid ts-session-grid">
              <label class="ts-field"><span>Data</span><div class="ts-input-icon"><i>${icon('calendar')}</i><input name="date" type="date" required></div></label>
              <label class="ts-field"><span>Orario</span><div class="ts-input-icon"><i>${icon('clock')}</i><input name="time" type="time" value="17:30" required></div></label>
              <label class="ts-field ts-field--location"><span>Campo</span><select name="location">${locationOptionsHtml}</select></label>
              <label class="ts-field ts-custom-location" data-ts-custom-location hidden><span>Nome campo / impianto</span><input name="custom_location" type="text" maxlength="100" autocomplete="off" placeholder="Scrivi il nome del campo"></label>
              <label class="ts-field"><span>Allenamento n°</span><input name="progressive" type="number" min="1" value="1"></label>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="2">
            <div class="ts-roster-workspace" data-roster-workspace>
              <div class="ts-roster-workspace__summary">
                <div class="ts-present-count ts-present-count--stat" aria-label="Presenti">
                  <span class="ts-present-count__label"><i class="ts-step-content-icon" aria-hidden="true">${icon('squad')}</i><span>Presenti</span></span>
                  <strong class="ts-present-count__value" data-present-count-display aria-live="polite">28</strong>
                  <input name="present" type="hidden" value="28">
                </div>
                <div class="ts-roster-status-totals" aria-label="Riepilogo indisponibilità">
                  <span>Assenti <b data-roster-status-count="absent">0</b></span>
                  <span>Infortunati <b data-roster-status-count="injured">0</b></span>
                  <span>Differenziati <b data-roster-status-count="differentiated">0</b></span>
                </div>
              </div>

              <div class="ts-roster-list-shell">
                <div class="ts-roster-list-toolbar">
                  <div class="ts-player-search ts-player-search--roster"><input name="player_search" type="search" data-player-search placeholder="Cerca giocatore" autocomplete="off"><button type="button" data-clear-player-search aria-label="Pulisci ricerca">${icon('close')}</button></div>
                  <div class="ts-roster-aggregated">
                    <div class="ts-selection-card ts-aggregated-select">
                      <details class="ts-aggregated-menu ts-roster-aggregated__menu" data-aggregated-menu>
                        <summary>
                          <span class="ts-roster-aggregated__title">Aggregati <b data-aggregated-total>0</b></span>
                          <span class="ts-roster-aggregated__summary" data-aggregated-summary>Nessun aggregato</span>
                          <span class="ts-roster-aggregated__action" aria-hidden="true">
                            <span class="ts-roster-aggregated__action-closed">Gestisci</span>
                            <span class="ts-roster-aggregated__action-open">Chiudi</span>
                          </span>
                        </summary>
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
                </div>
                <div class="ts-roster-list" data-roster-list>${rosterRows}</div>
              </div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="3">
            <div class="ts-choice-block ts-match-day-block"><span class="ts-choice-label">Match Day</span><div class="ts-md-selector" data-ts-md-selector>
              ${['PREPARAZIONE','MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD',''].map((md) => `<button type="button" data-md="${md}">${md || 'Nessuno'}</button>`).join('')}
              <input name="match_day" type="hidden">
            </div></div>
            <div class="ts-load-grid">
              <label class="ts-field ts-load-focus"><span>Focus fisico</span><select name="focus"><option value="">Seleziona</option><option>Metabolico</option><option>Forza</option><option>Resistenza alla velocità</option><option>Velocità</option><option>Recupero</option><option>Aerobico</option></select></label>
              <div class="ts-choice-block ts-load-metric ts-load-intensity"><span class="ts-choice-label">Intensità prevista</span><div class="ts-rating" data-rating="intensity">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="intensity" type="hidden"></div><small class="ts-load-scale-hint">1 molto bassa · 3 media · 5 molto alta</small></div>
              <div class="ts-choice-block ts-load-metric ts-load-volume"><span class="ts-choice-label">Volume previsto</span><div class="ts-rating" data-rating="volume">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="volume" type="hidden"></div><small class="ts-load-scale-hint">1 molto basso · 3 medio · 5 molto alto</small></div>
              <div class="ts-load-score" data-load-score>
                <span>Indice carico</span>
                <strong data-load-score-value>—</strong>
                <small>Intensità × Volume · indice sintetico 1–25</small>
              </div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="4">

            <div class="ts-phases-workspace">
              <div class="ts-phases-editor" data-ts-phases></div>
              <button class="staff-button staff-button--secondary ts-add-phase" type="button" data-add-phase><span class="ts-step-content-icon ts-step-content-icon--action" aria-hidden="true">${icon('plus')}</span><span>Aggiungi fase</span></button>
            </div>
          </section>
          <section class="ts-form-card ts-step" data-ts-step="5">

            <div class="ts-pillars ts-pillars--compact" data-ts-pillars aria-label="Architettura del vantaggio">
              ${[
                ['create','Creare il vantaggio','Creare','&#9678;'],
                ['keep','Conservare il vantaggio','Conservare','&#9671;'],
                ['exploit','Sfruttare il vantaggio','Sfruttare','&#8599;'],
                ['defend','Difendere il vantaggio','Difendere','&#9670;']
              ].map(([key,value,label,symbol])=>`<label class="ts-pillar ts-pillar--${key}" title="${value}"><input type="checkbox" name="pillars" value="${value}"><span><i class="ts-pillar-symbol" aria-hidden="true">${symbol}</i><b class="ts-pillar-label">${label}</b></span></label>`).join('')}
            </div>
            <div class="ts-analysis-fields ts-analysis-fields--manual">
              <label class="ts-field ts-field-full"><span class="ts-objective-field-title"><i class="ts-step-content-icon" aria-hidden="true">${icon('analysis')}</i>Obiettivo</span><textarea name="objective" rows="3" placeholder="Scrivi l'obiettivo della seduta"></textarea></label>
              <label class="ts-field ts-field-full"><span class="ts-objective-field-title"><i class="ts-step-content-icon" aria-hidden="true">${icon('sheet')}</i>Principi</span><textarea name="principles" rows="4" placeholder="Scrivi i principi da allenare"></textarea></label>
            </div>
          </section>

        </form>

        <aside class="ts-live-column product-surface ts-step" data-ts-step="6">
          <div class="ts-card-head ts-summary-head"><span>06</span><div><h2>Riepilogo</h2><p>Controlla la Training Sheet prima della pubblicazione.</p></div></div>
          <div class="ts-preview-stage">
            <div class="ts-preview-toolbar">
              <div class="ts-preview-heading"><span>ANTEPRIMA LIVE</span><strong>Training Sheet</strong></div>
              <div class="ts-preview-actions">
                <button type="button" class="staff-button staff-button--secondary ts-action-preview" data-preview-pdf>${icon('sheet')}<span>Anteprima PDF</span></button>
                <button type="button" class="staff-button staff-button--primary ts-action-publish" data-publish-training-sheet aria-live="polite">Pubblica TS</button>
              </div>
              <p class="ts-publish-note" data-publish-note>Pubblica in STAFF, Calendario e Training Library. Il download sul dispositivo è facoltativo.</p>
            </div>
            <div class="ts-paper-frame"><article class="ts-paper" data-ts-preview></article></div>
          </div>
        </aside>

        <footer class="ts-step-footer" data-ts-step-footer>
          <button type="button" class="staff-button staff-button--secondary" data-ts-step-prev><span aria-hidden="true">←</span> Indietro</button>
          <span data-ts-step-status>Sezione 1 di 6</span>
          <button type="button" class="staff-button staff-button--primary" data-ts-step-next>Continua <span aria-hidden="true">→</span></button>
        </footer>
      </div>
    </section>
  `
}
