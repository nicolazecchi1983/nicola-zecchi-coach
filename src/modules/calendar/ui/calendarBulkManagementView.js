const TYPE_LABELS = {
  training: 'Allenamenti',
  match: 'Partite',
  meeting: 'Riunioni',
  rest: 'Riposi',
  other: 'Altri',
}

function summaryHtml(preview = {}) {
  const selected = preview.selected?.length || 0
  const deletable = preview.deletableEvents?.length || 0
  const protectedCount = preview.protectedEvents?.length || 0
  const typeRows = Object.entries(preview.byType || {})
    .filter(([, count]) => count)
    .map(([type, count]) => `<span><b>${count}</b> ${TYPE_LABELS[type] || type}</span>`)
    .join('')

  return `<div class="calendar-bulk-preview" data-calendar-bulk-preview>
    <div class="calendar-bulk-preview-main"><strong>${selected}</strong><span>eventi selezionati</span></div>
    <div class="calendar-bulk-preview-types">${typeRows || '<span>Nessun evento</span>'}</div>
    <div class="calendar-bulk-preview-safety">
      <span class="is-deletable"><b>${deletable}</b> eliminabili</span>
      <span class="is-protected"><b>${protectedCount}</b> protetti</span>
    </div>
    ${protectedCount ? `<details><summary>Perché ${protectedCount} eventi sono protetti?</summary><ul>${preview.protectedEvents.map((event) => `<li>${event.title || 'Evento'} · ${event.protectionReason}</li>`).join('')}</ul></details>` : ''}
  </div>`
}

export function renderCalendarBulkManagementModal({ preview, criteria = {}, escapeHtml }) {
  return `<div class="new-event-modal-backdrop calendar-bulk-backdrop" data-close-calendar-bulk>
    <section class="new-event-modal calendar-bulk-modal" role="dialog" aria-modal="true" aria-label="Gestisci eventi calendario">
      <div class="new-event-modal__head">
        <div><span>CALENDARIO</span><h2>Gestisci / elimina eventi</h2></div>
        <button type="button" class="new-event-modal__close" data-close-calendar-bulk aria-label="Chiudi">×</button>
      </div>

      <form class="calendar-bulk-form" data-calendar-bulk-form>
        <div class="calendar-bulk-warning"><strong>Reset sicuro.</strong><p>STAFF mostra sempre l’anteprima e non elimina automaticamente eventi che contengono lavoro tecnico collegato.</p></div>

        <label><span>Operazione</span><select name="mode" data-calendar-bulk-mode>
          <option value="range" ${criteria.mode==='range'?'selected':''}>Intervallo di date</option>
          <option value="type" ${criteria.mode==='type'?'selected':''}>Tipo di evento</option>
          <option value="competition" ${criteria.mode==='competition'?'selected':''}>Partite per competizione</option>
          <option value="all" ${criteria.mode==='all'?'selected':''}>Tutto il calendario (solo eventi non protetti)</option>
        </select></label>

        <div class="calendar-bulk-fields" data-calendar-bulk-range ${criteria.mode && criteria.mode!=='range'?'hidden':''}>
          <label><span>Dal</span><input type="date" name="from" value="${escapeHtml(criteria.from || '')}"></label>
          <label><span>Al</span><input type="date" name="to" value="${escapeHtml(criteria.to || '')}"></label>
        </div>

        <div data-calendar-bulk-type ${criteria.mode!=='type'?'hidden':''}>
          <label><span>Tipo evento</span><select name="type">
            <option value="training" ${criteria.type==='training'?'selected':''}>Allenamenti</option>
            <option value="match" ${criteria.type==='match'?'selected':''}>Partite</option>
            <option value="meeting" ${criteria.type==='meeting'?'selected':''}>Riunioni</option>
            <option value="rest" ${criteria.type==='rest'?'selected':''}>Riposi</option>
          </select></label>
        </div>

        <div data-calendar-bulk-competition ${criteria.mode!=='competition'?'hidden':''}>
          <label><span>Competizione</span><select name="competition">
            <option value="league" ${criteria.competition==='league'?'selected':''}>Campionato</option>
            <option value="cup" ${criteria.competition==='cup'?'selected':''}>Coppa</option>
            <option value="friendly" ${criteria.competition==='friendly'?'selected':''}>Amichevoli</option>
          </select></label>
        </div>

        ${summaryHtml(preview)}

        <div class="calendar-bulk-confirm">
          <label><input type="checkbox" name="confirm" value="yes"> Confermo di voler eliminare gli eventi indicati come eliminabili.</label>
        </div>

        <div class="calendar-bulk-actions">
          <span data-calendar-bulk-message></span>
          <button type="button" class="button" data-close-calendar-bulk>Annulla</button>
          <button type="submit" class="button button--danger" data-calendar-bulk-delete ${preview.deletableEvents?.length ? '' : 'disabled'}>Elimina ${preview.deletableEvents?.length || 0} eventi</button>
        </div>
      </form>
    </section>
  </div>`
}
