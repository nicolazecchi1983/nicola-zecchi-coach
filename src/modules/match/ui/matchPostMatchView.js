import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

function formatSavedAt(value) {
  if (!value) return 'Non ancora salvato'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Salvato'
  return `Ultimo salvataggio ${date.toLocaleDateString('it-IT')} · ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
}

function sectionHtml(section, { canEdit, escapeHtml, index, materials = [] }) {
  const title = escapeHtml(section.title || `Sezione ${index + 1}`)
  const helper = escapeHtml(section.helper || '')
  const placeholder = escapeHtml(section.placeholder || '')
  const id = escapeHtml(section.id)
  const materialLinks = section.kind === 'materials' && materials.length
    ? `<div class="post-match-materials">${materials.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label || item.url)}</a>`).join('')}</div>`
    : ''

  return `<section class="post-match-section product-surface" data-post-match-section data-section-id="${id}">
    <div class="post-match-section-head">
      <button type="button" class="post-match-section-toggle" data-post-match-section-toggle aria-expanded="false">
        <span class="post-match-section-title" data-post-match-section-title>${title}</span>
        <span class="post-match-section-chevron" aria-hidden="true">⌄</span>
      </button>
      ${canEdit ? `<div class="post-match-section-menu-wrap">
        <button type="button" class="post-match-section-menu-button" data-post-match-section-menu-button aria-label="Azioni ${title}" aria-expanded="false">⋯</button>
        <div class="post-match-section-menu" data-post-match-section-menu hidden>
          <button type="button" data-post-match-section-rename>Rinomina</button>
          <button type="button" class="is-danger" data-post-match-section-delete>Elimina</button>
        </div>
      </div>` : ''}
    </div>
    <div class="post-match-section-body" data-post-match-section-body hidden>
      ${helper ? `<p class="post-match-section-helper">${helper}</p>` : ''}
      <input type="hidden" name="post_match_section_id" data-post-match-section-id value="${id}">
      <input type="hidden" name="post_match_section_title" data-post-match-section-title-input value="${title}">
      <input type="hidden" name="post_match_section_kind" data-post-match-section-kind value="${escapeHtml(section.kind || 'text')}">
      <input type="hidden" name="post_match_section_helper" data-post-match-section-helper-input value="${helper}">
      <textarea name="post_match_section_content" data-post-match-section-content rows="6" maxlength="${Number(section.maxLength) || 4000}" ${canEdit ? '' : 'readonly'} placeholder="${placeholder}">${escapeHtml(section.content || '')}</textarea>
      ${materialLinks}
    </div>
  </section>`
}

export function renderMatchPostMatchView({
  activeMatch,
  postMatch,
  reportAvailable = false,
  canEdit = false,
  teamName = '',
  escapeHtml,
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const value = postMatch || {}
  const sections = Array.isArray(value.sections) ? value.sections : []

  const contentHtml = `<div class="post-match-status-row">
      <article class="product-surface"><span>REPORT PARTITA</span><strong>${reportAvailable ? 'Disponibile' : 'Non ancora generato'}</strong></article>
      <article class="product-surface"><span>POST GARA</span><strong data-post-match-saved-state>${escapeHtml(formatSavedAt(value.updatedAt))}</strong></article>
    </div>

    <form class="post-match-form" data-post-match-form>
      <div class="post-match-sections" data-post-match-sections>
        ${sections.map((section, index) => sectionHtml(section, { canEdit, escapeHtml, index, materials: value.materials || [] })).join('')}
      </div>

      ${canEdit ? '<button type="button" class="post-match-add-section" data-post-match-add-section>+ Aggiungi sezione</button>' : ''}

      <div class="post-match-actions">
        <span class="post-match-message" data-post-match-message></span>
        ${canEdit ? '<button type="submit" class="primary-action" data-post-match-save>Salva Post gara</button>' : '<span class="post-match-readonly">Consultazione sola lettura</span>'}
      </div>
    </form>`

  return matchWorkspaceShellHtml({
    activeSection: 'post-match',
    teamName,
    titleHtml: `Post gara · ${escapeHtml(opponent)}`,
    descriptionHtml: '',
    className: 'match-post-match-view',
    attributes: { 'data-match-post-match': true },
    contentHtml,
  })
}
