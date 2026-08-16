import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

const SECTION_META = Object.freeze({
  'our-team': {
    title: 'Nostra squadra',
    description: 'Formazione, panchina, capitano, vicecapitano e analisi della nostra squadra.',
    step: '2',
  },
  opponent: {
    title: 'Avversario',
    description: 'Distinta, formazione, ciclo del gioco, inattive e note.',
    step: '3',
  },
})

export function renderNativeMatchSectionView({
  section,
  activeMatch,
  team,
  escapeHtml,
  legacyEditorHtml = '',
} = {}) {
  const meta = SECTION_META[section] || SECTION_META['our-team']
  const opponent = activeMatch?.opponent || 'Avversario da definire'
  const ownTeamName = team?.shortName || team?.name || 'Nostra squadra'
  const pageTitle = section === 'our-team' ? ownTeamName : opponent

  const contentHtml = `<section class="workspace-surface product-surface match-native-surface">
    <div class="match-native-legacy-host match-native-legacy-host--${escapeHtml(section)}">
      ${legacyEditorHtml}
    </div>
  </section>`

  return matchWorkspaceShellHtml({
    activeSection: section,
    teamName: ownTeamName,
    titleHtml: escapeHtml(pageTitle),
    descriptionHtml: escapeHtml(meta.description),
    className: 'match-native-section',
    attributes: {
      'data-native-match-section': escapeHtml(section),
      'data-native-match-step': meta.step,
    },
    contentHtml,
  })
}
