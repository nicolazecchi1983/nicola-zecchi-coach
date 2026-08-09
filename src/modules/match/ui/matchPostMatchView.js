import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'
import { postMatchMaterialsText } from '../matchPostMatchModel.js'

function formatSavedAt(value) {
  if (!value) return 'Non ancora salvato'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Salvato'
  return `Ultimo salvataggio ${date.toLocaleDateString('it-IT')} · ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
}

export function renderMatchPostMatchView({
  activeMatch,
  postMatch,
  reportAvailable = false,
  canEdit = false,
  escapeHtml,
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const value = postMatch || {}
  const materialsText = postMatchMaterialsText(value.materials)

  return `<section class="view page-view match-post-match-view" data-match-post-match>
    <div class="page-head match-context-page-head">
      <div>
        <h1>Post gara · ${escapeHtml(opponent)}</h1>
        <p><span>MATCH WORKSPACE</span><b>•</b>Trasforma la gara in indicazioni operative per il microciclo successivo.</p>
      </div>
      ${matchContextBackButtonHtml()}
    </div>

    ${matchContextNavigationHtml('post-match')}

    <div class="post-match-status-row">
      <article><span>REPORT PARTITA</span><strong>${reportAvailable ? 'Disponibile' : 'Non ancora generato'}</strong></article>
      <article><span>POST GARA</span><strong data-post-match-saved-state>${escapeHtml(formatSavedAt(value.updatedAt))}</strong></article>
    </div>

    <form class="post-match-form" data-post-match-form>
      <section class="post-match-card post-match-card--wide">
        <header><span>01</span><div><h2>Debrief della gara</h2><p>La lettura sintetica che vuoi conservare dopo la partita.</p></div></header>
        <textarea name="debrief" rows="5" maxlength="5000" ${canEdit ? '' : 'readonly'} placeholder="Cosa ci lascia realmente questa partita?">${escapeHtml(value.debrief || '')}</textarea>
      </section>

      <div class="post-match-grid">
        <section class="post-match-card">
          <header><span>02</span><div><h2>Cosa portiamo con noi</h2><p>Comportamenti, principi e aspetti da consolidare.</p></div></header>
          <textarea name="positives" rows="7" maxlength="4000" ${canEdit ? '' : 'readonly'} placeholder="Punti positivi, conferme, progressi...">${escapeHtml(value.positives || '')}</textarea>
        </section>
        <section class="post-match-card">
          <header><span>03</span><div><h2>Cosa correggere</h2><p>Problemi osservati senza trasformarli ancora in esercitazioni.</p></div></header>
          <textarea name="issues" rows="7" maxlength="4000" ${canEdit ? '' : 'readonly'} placeholder="Criticità, errori ricorrenti, situazioni da rivedere...">${escapeHtml(value.issues || '')}</textarea>
        </section>
      </div>

      <div class="post-match-grid">
        <section class="post-match-card">
          <header><span>04</span><div><h2>Priorità prossimo microciclo</h2><p>Il ponte tra analisi gara e progettazione dell'allenamento.</p></div></header>
          <textarea name="microcyclePriorities" rows="7" maxlength="4000" ${canEdit ? '' : 'readonly'} placeholder="2-4 priorità realmente allenabili nella settimana successiva...">${escapeHtml(value.microcyclePriorities || '')}</textarea>
        </section>
        <section class="post-match-card">
          <header><span>05</span><div><h2>Follow-up individuali</h2><p>Giocatori o reparti che richiedono un confronto specifico.</p></div></header>
          <textarea name="individualFollowUps" rows="7" maxlength="4000" ${canEdit ? '' : 'readonly'} placeholder="Colloqui, feedback individuali, clip da mostrare...">${escapeHtml(value.individualFollowUps || '')}</textarea>
        </section>
      </div>

      <section class="post-match-card post-match-card--wide">
        <header><span>06</span><div><h2>Video e materiali</h2><p>Un elemento per riga. Puoi scrivere “Etichetta | https://...” oppure soltanto il link.</p></div></header>
        <textarea name="materialsText" rows="5" maxlength="12000" ${canEdit ? '' : 'readonly'} placeholder="Video gara | https://...\nClip fase difensiva | https://...">${escapeHtml(materialsText)}</textarea>
        ${value.materials?.length ? `<div class="post-match-materials">${value.materials.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label || item.url)}</a>`).join('')}</div>` : ''}
      </section>

      <div class="post-match-actions">
        <span class="post-match-message" data-post-match-message></span>
        ${canEdit ? '<button type="submit" class="primary-action" data-post-match-save>Salva Post gara</button>' : '<span class="post-match-readonly">Consultazione sola lettura</span>'}
      </div>
    </form>
  </section>`
}
