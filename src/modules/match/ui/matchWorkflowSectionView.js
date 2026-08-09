import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'

const CONTENT = {
  'opponent-study': {
    title: 'Studio avversario',
    description: 'Report Match Analyst, video, link esterni e materiale tecnico pre-partita.',
  },
  report: {
    title: 'Report',
    description: 'Documento tecnico e relazioni collegate alla partita.',
  },
  'post-match': {
    title: 'Post gara',
    description: 'Report, video, altre relazioni e spunti per il microciclo successivo.',
  },
}

export function renderMatchWorkflowSectionView({ section, activeMatch, escapeHtml }) {
  const content = CONTENT[section] || CONTENT['opponent-study']
  const opponent = activeMatch?.opponent || 'Partita selezionata'

  return `<section class="view page-view match-workflow-section" data-match-workflow-section="${escapeHtml(section)}">
    <div class="page-head match-context-page-head">
      <div>
        <h1>${escapeHtml(content.title)} · ${escapeHtml(opponent)}</h1>
        <p><span>MATCH WORKSPACE</span><b>•</b>${escapeHtml(content.description)}</p>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchContextNavigationHtml(section)}
    <div class="empty-state">
      <h2>${escapeHtml(content.title)}</h2>
      <p>La sezione è già inserita nel workflow Match e verrà completata nella release dedicata, senza creare un flusso parallelo.</p>
    </div>
  </section>`
}
