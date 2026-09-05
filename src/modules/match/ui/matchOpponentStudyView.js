import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'
import { compactResourceActionHtml, resourceSectionHeaderHtml, resourceRowHtml, overflowActionMenuHtml } from '../../../design-system/uiComponents.js'
import { categoryLabel } from '../matchOpponentStudyModel.js'
import { renderMatchAnalysisSchemaEditor } from './matchAnalysisSchemaView.js'

function formatSize(bytes) {
  const value = Number(bytes) || 0
  if (!value) return ''
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

function removalMenuHtml({ label, attributes = {} } = {}) {
  return overflowActionMenuHtml({
    label: 'Altre azioni',
    itemsHtml: compactResourceActionHtml({
      label,
      iconName: 'trash',
      variant: 'ghost',
      className: 'staff-overflow-menu__item staff-overflow-menu__item--danger',
      attributes,
    }),
  })
}

function assetCard(asset, { escapeHtml, primary = false } = {}) {
  if (!asset) return '<p class="staff-resource-empty">Nessun report caricato.</p>'

  const openAction = compactResourceActionHtml({
    label: 'Apri',
    iconName: 'external-link',
    variant: 'secondary',
    attributes: { 'data-open-study-asset': escapeHtml(asset.path) },
  })
  const removeAction = removalMenuHtml({
    label: 'Rimuovi',
    attributes: {
      'data-remove-study-asset': escapeHtml(asset.id),
      ...(primary ? { 'data-primary-report': 'true' } : {}),
    },
  })

  return resourceRowHtml({
    iconName: 'document',
    eyebrowHtml: primary ? 'REPORT PRE-PARTITA' : escapeHtml(asset.kind === 'video' ? 'VIDEO' : 'DOCUMENTO'),
    titleHtml: escapeHtml(asset.label || asset.fileName || 'Documento'),
    metaHtml: `${escapeHtml(categoryLabel(asset.category))}${asset.size ? ` · ${escapeHtml(formatSize(asset.size))}` : ''}`,
    actionsHtml: `${openAction}${removeAction}`,
    attributes: { 'data-study-asset-id': escapeHtml(asset.id) },
  })
}

function linkSourceLabel(value) {
  try {
    const url = new URL(String(value || ''))
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') {
      return url.pathname.includes('playlist') ? 'YouTube · Playlist' : 'YouTube'
    }
    if (host === 'drive.google.com') return 'Google Drive'
    if (host === 'hudl.com' || host.endsWith('.hudl.com')) return 'Hudl'
    return host || 'Link web'
  } catch {
    return 'Link web'
  }
}

function linkCard(link, escapeHtml) {
  const openAction = compactResourceActionHtml({
    label: 'Apri',
    iconName: 'external-link',
    variant: 'secondary',
    href: escapeHtml(link.url),
    attributes: { target: '_blank', rel: 'noopener noreferrer' },
  })
  const removeAction = removalMenuHtml({
    label: 'Rimuovi',
    attributes: { 'data-remove-study-link': escapeHtml(link.id) },
  })

  return resourceRowHtml({
    iconName: 'link',
    eyebrowHtml: `LINK · ${escapeHtml(categoryLabel(link.category))}`,
    titleHtml: escapeHtml(link.label || 'Link esterno'),
    metaHtml: `<span title="${escapeHtml(link.url)}">${escapeHtml(linkSourceLabel(link.url))}</span>`,
    actionsHtml: `${openAction}${removeAction}`,
    attributes: { 'data-study-link-id': escapeHtml(link.id) },
  })
}
export function renderMatchOpponentStudyView({ activeMatch, study, escapeHtml, teamName = '' }) {
  const matchId = String(activeMatch?.id || '')
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const notes = study?.notes || {}
  const assets = Array.isArray(study?.assets) ? study.assets : []
  const links = Array.isArray(study?.links) ? study.links : []

  if (!matchId) {
    return matchWorkspaceShellHtml({
      activeSection: 'opponent-study',
      teamName,
      titleHtml: 'Studio avversario',
      descriptionHtml: 'Seleziona prima una partita dalla Match Library.',
      className: 'match-opponent-study match-workflow-section',
      contentHtml: '<div class="workspace-surface product-surface product-empty-state empty-state"><h2>Nessuna partita selezionata</h2><p>Apri una partita dalla Match Library per preparare lo studio dell’avversario.</p></div>',
    })
  }

  const reportHeaderAction = compactResourceActionHtml({
    label: study?.primaryReport ? 'Sostituisci' : 'Carica report',
    iconName: study?.primaryReport ? 'replace' : 'plus',
    variant: 'secondary',
    attributes: { 'data-study-toggle-form': 'report' },
  })
  const materialsHeaderActions = [
    compactResourceActionHtml({
      label: 'File',
      iconName: 'plus',
      variant: 'secondary',
      attributes: { 'data-study-toggle-form': 'asset', 'aria-label': 'Aggiungi file' },
    }),
    compactResourceActionHtml({
      label: 'Link',
      iconName: 'plus',
      variant: 'secondary',
      attributes: { 'data-study-toggle-form': 'link', 'aria-label': 'Aggiungi link' },
    }),
  ].join('')

  const contentHtml = `<section class="match-study-materials" aria-labelledby="match-study-materials-title">
      <div class="match-study-materials-head">
        <h2 id="match-study-materials-title">Materiali pre-partita</h2>
      </div>

      <div class="match-study-materials-grid match-study-materials-grid--two">
        <article class="staff-resource-section match-study-material-card">
          ${resourceSectionHeaderHtml({
            index: '01',
            titleHtml: 'Report',
            actionsHtml: reportHeaderAction,
          })}
          <div class="staff-resource-list" data-primary-study-report>${assetCard(study?.primaryReport, { escapeHtml, primary: true })}</div>
          <form class="match-study-upload-form match-study-collapsible" data-study-upload-form="report" data-study-collapsible="report" hidden>
            <label><span>Report</span><input type="file" name="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label>
            <div class="match-study-form-actions"><button class="primary-button" type="submit">Carica report</button><button class="ghost-button" type="button" data-study-close-form="report">Annulla</button></div>
            <p class="form-message" data-study-message="report"></p>
          </form>
        </article>

        <article class="staff-resource-section match-study-material-card">
          ${resourceSectionHeaderHtml({
            index: '02',
            titleHtml: 'Materiali',
            countHtml: `${assets.length} file · ${links.length} link`,
            actionsHtml: materialsHeaderActions,
          })}
          <div class="staff-resource-list">
            <div class="match-study-material-stream" data-study-assets>${assets.map((asset) => assetCard(asset, { escapeHtml })).join('')}</div>
            <div class="match-study-material-stream" data-study-links>${links.map((link) => linkCard(link, escapeHtml)).join('')}</div>
            ${!assets.length && !links.length ? '<p class="staff-resource-empty">Nessun materiale.</p>' : ''}
          </div>

          <form class="match-study-upload-form match-study-upload-form--multi match-study-collapsible" data-study-upload-form="asset" data-study-collapsible="asset" hidden>
            <label><span>Tipo</span><select name="kind"><option value="video">Video</option><option value="document">Documento</option></select></label>
            <label><span>Categoria</span><select name="category"><option value="general">Generale</option><option value="possession">Possesso</option><option value="non-possession">Non possesso</option><option value="transitions">Transizioni</option><option value="set-pieces">Palle inattive</option></select></label>
            <label><span>File</span><input type="file" name="file" required></label>
            <div class="match-study-form-actions"><button class="primary-button" type="submit">Carica file</button><button class="ghost-button" type="button" data-study-close-form="asset">Annulla</button></div>
            <p class="form-message" data-study-message="asset"></p>
          </form>

          <form class="match-study-link-form match-study-collapsible" data-study-link-form data-study-collapsible="link" hidden>
            <label><span>Nome</span><input type="text" name="label" placeholder="Es. Ultime 3 gare"></label>
            <label><span>Categoria</span><select name="category"><option value="general">Generale</option><option value="possession">Possesso</option><option value="non-possession">Non possesso</option><option value="transitions">Transizioni</option><option value="set-pieces">Palle inattive</option></select></label>
            <label class="match-study-link-url"><span>Link</span><input type="url" name="url" placeholder="https://..." autocomplete="url" spellcheck="false" required></label>
            <div class="match-study-form-actions"><button class="primary-button" type="submit">Salva link</button><button class="ghost-button" type="button" data-study-close-form="link">Annulla</button></div>
            <p class="form-message" data-study-message="link"></p>
          </form>
        </article>
      </div>
    </section>

    <div class="match-study-grid match-study-grid--analysis">
      <article class="section-card match-study-panel match-study-panel--wide match-study-analysis-panel">
        <form class="match-study-notes-form" data-study-notes-form>
          ${renderMatchAnalysisSchemaEditor({
            name: 'technical_analysis',
            schema: study?.technicalAnalysis,
            title: 'Lettura tecnica',
            description: '',
          })}
          <div class="match-study-save-row"><button class="primary-button" type="submit">Salva studio</button><p class="form-message" data-study-message="notes"></p></div>
        </form>
      </article>
    </div>`

  return matchWorkspaceShellHtml({
    activeSection: 'opponent-study',
    teamName,
    titleHtml: `Studio avversario · ${escapeHtml(opponent)}`,
    descriptionHtml: 'Materiali e lettura tecnica pre-partita.',
    className: 'match-opponent-study',
    attributes: {
      'data-opponent-study': true,
      'data-match-id': escapeHtml(matchId),
    },
    contentHtml,
  })
}
