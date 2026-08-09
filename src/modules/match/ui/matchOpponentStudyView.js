import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'
import { categoryLabel } from '../matchOpponentStudyModel.js'

function formatSize(bytes) {
  const value = Number(bytes) || 0
  if (!value) return ''
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

function assetCard(asset, { escapeHtml, primary = false } = {}) {
  if (!asset) return '<p class="match-study-empty">Nessun report caricato.</p>'
  return `<article class="match-study-resource" data-study-asset-id="${escapeHtml(asset.id)}">
    <div>
      <span>${primary ? 'REPORT PRE-PARTITA' : escapeHtml(asset.kind === 'video' ? 'VIDEO' : 'DOCUMENTO')}</span>
      <strong>${escapeHtml(asset.label || asset.fileName || 'Documento')}</strong>
      <small>${escapeHtml(categoryLabel(asset.category))}${asset.size ? ` · ${escapeHtml(formatSize(asset.size))}` : ''}</small>
    </div>
    <div class="match-study-resource-actions">
      <button type="button" class="secondary-button" data-open-study-asset="${escapeHtml(asset.path)}">Apri</button>
      <button type="button" class="ghost-button" data-remove-study-asset="${escapeHtml(asset.id)}" ${primary ? 'data-primary-report="true"' : ''}>Rimuovi</button>
    </div>
  </article>`
}

function linkCard(link, escapeHtml) {
  return `<article class="match-study-resource" data-study-link-id="${escapeHtml(link.id)}">
    <div>
      <span>LINK · ${escapeHtml(categoryLabel(link.category))}</span>
      <strong>${escapeHtml(link.label || 'Link esterno')}</strong>
      <small>${escapeHtml(link.url)}</small>
    </div>
    <div class="match-study-resource-actions">
      <a class="secondary-button" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">Apri</a>
      <button type="button" class="ghost-button" data-remove-study-link="${escapeHtml(link.id)}">Rimuovi</button>
    </div>
  </article>`
}

export function renderMatchOpponentStudyView({ activeMatch, study, escapeHtml }) {
  const matchId = String(activeMatch?.id || '')
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const notes = study?.notes || {}
  const assets = Array.isArray(study?.assets) ? study.assets : []
  const links = Array.isArray(study?.links) ? study.links : []

  if (!matchId) {
    return `<section class="view page-view match-opponent-study match-workflow-section">
      <div class="page-head match-context-page-head"><div><h1>Studio avversario</h1><p><span>MATCH WORKSPACE</span><b>•</b>Seleziona prima una partita dalla Match Library.</p></div>${matchContextBackButtonHtml()}</div>${matchContextNavigationHtml('opponent-study')}
      <div class="empty-state"><h2>Nessuna partita selezionata</h2><p>Apri una partita dalla Match Library per preparare lo studio dell’avversario.</p></div>
    </section>`
  }

  return `<section class="view page-view match-opponent-study" data-opponent-study data-match-id="${escapeHtml(matchId)}">
    <div class="page-head match-context-page-head">
      <div>
        <h1>Studio avversario · ${escapeHtml(opponent)}</h1>
        <p><span>MATCH WORKSPACE</span><b>•</b>Report, video, link esterni e lettura tecnica pre-partita.</p>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchContextNavigationHtml('opponent-study')}

    <div class="match-study-grid">
      <article class="section-card match-study-panel">
        <div class="match-study-panel-head">
          <div><span>01</span><h2>Report Match Analyst</h2><p>Un report principale, sempre sostituibile senza creare copie nella UI.</p></div>
        </div>
        <div data-primary-study-report>${assetCard(study?.primaryReport, { escapeHtml, primary: true })}</div>
        <form class="match-study-upload-form" data-study-upload-form="report">
          <label><span>Carica / sostituisci report</span><input type="file" name="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label>
          <button class="primary-button" type="submit">Carica report</button>
          <p class="form-message" data-study-message="report"></p>
        </form>
      </article>

      <article class="section-card match-study-panel">
        <div class="match-study-panel-head">
          <div><span>02</span><h2>Video e documenti</h2><p>Clip utili e materiali aggiuntivi. Per file video molto grandi preferisci un link esterno.</p></div>
        </div>
        <div class="match-study-resources" data-study-assets>
          ${assets.length ? assets.map((asset) => assetCard(asset, { escapeHtml })).join('') : '<p class="match-study-empty">Nessun materiale caricato.</p>'}
        </div>
        <div class="match-study-add-row"><button class="secondary-button match-study-add-toggle" type="button" data-study-toggle-form="asset">＋ Aggiungi materiale</button></div>
        <form class="match-study-upload-form match-study-upload-form--multi match-study-collapsible" data-study-upload-form="asset" data-study-collapsible="asset" hidden>
          <label><span>Tipo</span><select name="kind"><option value="video">Video</option><option value="document">Documento</option></select></label>
          <label><span>Categoria</span><select name="category"><option value="general">Generale</option><option value="possession">Possesso</option><option value="non-possession">Non possesso</option><option value="transitions">Transizioni</option><option value="set-pieces">Palle inattive</option></select></label>
          <label><span>File</span><input type="file" name="file" required></label>
          <div class="match-study-form-actions"><button class="primary-button" type="submit">Carica materiale</button><button class="ghost-button" type="button" data-study-close-form="asset">Annulla</button></div>
          <p class="form-message" data-study-message="asset"></p>
        </form>
      </article>

      <article class="section-card match-study-panel match-study-panel--wide">
        <div class="match-study-panel-head">
          <div><span>03</span><h2>Link esterni</h2><p>Hudl, YouTube, Drive o qualsiasi risorsa web utile allo studio.</p></div>
        </div>
        <div class="match-study-resources" data-study-links>
          ${links.length ? links.map((link) => linkCard(link, escapeHtml)).join('') : '<p class="match-study-empty">Nessun link salvato.</p>'}
        </div>
        <div class="match-study-add-row"><button class="secondary-button match-study-add-toggle" type="button" data-study-toggle-form="link">＋ Aggiungi link</button></div>
        <form class="match-study-link-form match-study-collapsible" data-study-link-form data-study-collapsible="link" hidden>
          <label><span>Nome</span><input type="text" name="label" placeholder="Es. Ultime 3 gare"></label>
          <label><span>Categoria</span><select name="category"><option value="general">Generale</option><option value="possession">Possesso</option><option value="non-possession">Non possesso</option><option value="transitions">Transizioni</option><option value="set-pieces">Palle inattive</option></select></label>
          <label class="match-study-link-url"><span>Link</span><input type="url" name="url" placeholder="https://..." required></label>
          <div class="match-study-form-actions"><button class="primary-button" type="submit">Salva link</button><button class="ghost-button" type="button" data-study-close-form="link">Annulla</button></div>
          <p class="form-message" data-study-message="link"></p>
        </form>
      </article>

      <article class="section-card match-study-panel match-study-panel--wide">
        <div class="match-study-panel-head">
          <div><span>04</span><h2>Lettura tecnica</h2><p>Note pre-partita organizzate senza trasformare lo studio in un report obbligatorio.</p></div>
        </div>
        <form class="match-study-notes-form" data-study-notes-form>
          <label><span>Possesso</span><textarea name="possession" rows="5" placeholder="Costruzione, sviluppo, rifinitura...">${escapeHtml(notes.possession || '')}</textarea></label>
          <label><span>Non possesso</span><textarea name="nonPossession" rows="5" placeholder="Pressione, blocco, difesa area...">${escapeHtml(notes.nonPossession || '')}</textarea></label>
          <label><span>Transizioni</span><textarea name="transitions" rows="5" placeholder="Comportamenti dopo recupero e perdita...">${escapeHtml(notes.transitions || '')}</textarea></label>
          <label><span>Palle inattive</span><textarea name="setPieces" rows="5" placeholder="Corner, punizioni, rimesse...">${escapeHtml(notes.setPieces || '')}</textarea></label>
          <label class="match-study-notes-general"><span>Note generali</span><textarea name="general" rows="4" placeholder="Sintesi e dettagli utili...">${escapeHtml(notes.general || '')}</textarea></label>
          <div class="match-study-save-row"><button class="primary-button" type="submit">Salva studio</button><p class="form-message" data-study-message="notes"></p></div>
        </form>
      </article>
    </div>
  </section>`
}
