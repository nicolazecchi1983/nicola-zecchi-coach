import { matchContextBackButtonHtml } from '../../../design-system/uiComponents.js'
import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import {
  MATCH_TEMPORAL_MOMENTS,
  getMatchTemporalMomentForSection,
  getMatchWorkflowSectionsForSection,
} from '../matchWorkflowModel.js'
import { renderPhaseWorkspaceNavigator } from './phaseWorkspaceNavigator.js'

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

const MATCH_TEMPORAL_DISPLAY_LABELS = Object.freeze({
  'pre-match': 'PRE',
  'match-day': 'MATCH CENTER',
  'post-match': 'POST',
})

function matchContextNavigationHtml(activeSection = '', { teamName = '' } = {}) {
  const sections = getMatchWorkflowSectionsForSection(activeSection)
  if (!sections.length) return ''
  const resolvedTeamName = String(teamName || '').trim()
  return `<nav class="match-context-navigation product-section-nav" hidden aria-hidden="true" aria-label="Sezioni del momento partita" data-match-context-navigation>
    ${sections.map((section, index) => {
      const active = section.key === activeSection || (section.key === 'report' && activeSection === 'match-report-workspace')
      const label = section.key === 'our-team' && resolvedTeamName ? resolvedTeamName : section.label
      return `<button type="button" class="${active ? 'is-active' : ''}" data-workspace-action="${section.key}" ${active ? 'aria-current="page"' : ''}><b>${String(index + 1).padStart(2, '0')}</b><span>${label}</span></button>`
    }).join('')}
  </nav>`
}

function matchTemporalNavigationHtml(activeSection = '') {
  const activeMoment = getMatchTemporalMomentForSection(activeSection)
  return `<nav class="match-temporal-navigation" aria-label="Momenti della partita" data-match-temporal-navigation>
    ${MATCH_TEMPORAL_MOMENTS.map((moment, index) => `<button type="button" class="match-temporal-navigation__item ${moment.key === activeMoment ? 'is-active' : ''}" data-match-temporal-moment="${moment.key}" data-workspace-action="${MATCH_TEMPORAL_MOMENT_ACTIONS[moment.key]}" ${moment.key === activeMoment ? 'aria-current="step"' : ''}>
      <span class="match-temporal-navigation__index" hidden aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <span class="match-temporal-navigation__copy">
        <strong>${MATCH_TEMPORAL_DISPLAY_LABELS[moment.key] || moment.label}</strong>
        <small hidden aria-hidden="true">${moment.description}</small>
      </span>
    </button>`).join('')}
  </nav>`
}

/**
 * Canonical structural shell for every Match Workspace section.
 * Page views provide content only; width, header, navigation and vertical rhythm live here.
 * Descriptive subtitles are intentionally not part of the canonical Match header: the title + stepper own context.
 */
function matchPostUtilityNavigationHtml(activeSection = '') {
  if (getMatchTemporalMomentForSection(activeSection) !== 'post-match') return ''
  const active = activeSection === 'match-statistics'
  return `<aside class="match-post-utility-bar" aria-label="Strumenti post-partita" data-match-post-utility-bar hidden aria-hidden="true">
    <span class="match-post-utility-bar__label">STRUMENTI POST-PARTITA</span>
    <button type="button" class="button button--secondary match-post-utility-bar__action ${active ? 'is-active' : ''}" data-workspace-action="statistics" ${active ? 'aria-current="page"' : ''}>Statistiche</button>
  </aside>`
}

export function matchWorkspaceShellHtml({
  activeSection = '',
  teamName = '',
  opponentName = '',
  titleHtml = '',
  workspaceTitleHtml = '',
  matchMetaHtml = '',
  contentHtml = '',
  className = '',
  attributes = {},
} = {}) {
  const activeMoment = getMatchTemporalMomentForSection(activeSection)
  const classes = ['view', 'page-view', 'product-page-shell', 'match-workspace-shell', `match-workspace-shell--${activeMoment}`, className].filter(Boolean).join(' ')
  const attrs = attributesHtml({ class: classes, 'data-match-workspace': true, ...attributes })
  const ownTeam = String(teamName || '').trim()
  const opponent = String(opponentName || '').trim()
  const hasMatchIdentity = Boolean(opponent)
  const currentWorkspaceTitleHtml = workspaceTitleHtml || titleHtml

  return `<section ${attrs}>
    <div class="page-head product-page-header match-context-page-head match-workspace-shell__header">
      <div class="match-workspace-shell__intro">
        <span class="match-workspace-shell__eyebrow" hidden aria-hidden="true">MATCH WORKSPACE</span>
        ${hasMatchIdentity ? `<div class="match-workspace-shell__identity" aria-label="Partita"><span>${escapeHtml(ownTeam || 'Nostra squadra')}</span><b aria-hidden="true">—</b><strong>${escapeHtml(opponent)}</strong></div>` : ''}
        <h1>${currentWorkspaceTitleHtml}</h1>
        ${matchMetaHtml ? `<div class="match-workspace-shell__match-meta" hidden aria-hidden="true" aria-label="Contesto partita">${matchMetaHtml}</div>` : ''}
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchTemporalNavigationHtml(activeSection)}
    ${matchContextNavigationHtml(activeSection, { teamName })}
    ${renderPhaseWorkspaceNavigator({ activeSection, teamName })}
    ${matchPostUtilityNavigationHtml(activeSection)}
    <main class="match-workspace-shell__content product-content-stack" data-match-workspace-content>
      ${contentHtml}
    </main>
  </section>`
}
