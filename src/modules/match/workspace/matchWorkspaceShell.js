import {
  matchContextBackButtonHtml,
  matchContextNavigationHtml,
} from '../../../design-system/uiComponents.js'
import {
  MATCH_TEMPORAL_MOMENTS,
  getMatchTemporalMomentForSection,
} from '../matchWorkflowModel.js'

function attributesHtml(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== false && value != null)
    .map(([name, value]) => value === true ? name : `${name}="${String(value).replaceAll('"', '&quot;')}"`)
    .join(' ')
}

const MATCH_TEMPORAL_MOMENT_ACTIONS = Object.freeze({
  'pre-match': 'opponent-study',
  'match-day': 'match-center',
  'post-match': 'analysis',
})

function matchTemporalNavigationHtml(activeSection = '') {
  const activeMoment = getMatchTemporalMomentForSection(activeSection)
  return `<nav class="match-temporal-navigation" aria-label="Momenti della partita" data-match-temporal-navigation>
    ${MATCH_TEMPORAL_MOMENTS.map((moment, index) => `<button type="button" class="match-temporal-navigation__item ${moment.key === activeMoment ? 'is-active' : ''}" data-match-temporal-moment="${moment.key}" data-workspace-action="${MATCH_TEMPORAL_MOMENT_ACTIONS[moment.key]}" ${moment.key === activeMoment ? 'aria-current="step"' : ''}>
      <span class="match-temporal-navigation__index">${String(index + 1).padStart(2, '0')}</span>
      <span class="match-temporal-navigation__copy">
        <strong>${moment.label}</strong>
        <small>${moment.description}</small>
      </span>
    </button>`).join('')}
  </nav>`
}

/**
 * Canonical structural shell for every Match Workspace section.
 * Page views provide content only; width, header, navigation and vertical rhythm live here.
 * Descriptive subtitles are intentionally not part of the canonical Match header: the title + stepper own context.
 */
export function matchWorkspaceShellHtml({
  activeSection = '',
  teamName = '',
  titleHtml = '',
  contentHtml = '',
  className = '',
  attributes = {},
} = {}) {
  const classes = ['view', 'page-view', 'product-page-shell', 'match-workspace-shell', className].filter(Boolean).join(' ')
  const attrs = attributesHtml({ class: classes, 'data-match-workspace': true, ...attributes })

  return `<section ${attrs}>
    <div class="page-head product-page-header match-context-page-head match-workspace-shell__header">
      <div class="match-workspace-shell__intro">
        <span class="match-workspace-shell__eyebrow">MATCH WORKSPACE</span>
        <h1>${titleHtml}</h1>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchTemporalNavigationHtml(activeSection)}
    ${matchContextNavigationHtml(activeSection, { teamName })}
    <main class="match-workspace-shell__content product-content-stack" data-match-workspace-content>
      ${contentHtml}
    </main>
  </section>`
}
