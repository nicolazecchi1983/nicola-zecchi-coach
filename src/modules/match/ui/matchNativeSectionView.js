import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'

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

  return `<section class="view page-view match-native-section" data-native-match-section="${escapeHtml(section)}" data-native-match-step="${meta.step}">
    <div class="page-head match-context-page-head">
      <div>
        <h1>${escapeHtml(pageTitle)}</h1>
        <p><span>MATCH WORKSPACE</span><b>•</b>${escapeHtml(meta.description)}</p>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchContextNavigationHtml(section)}
    <div class="match-native-legacy-host match-native-legacy-host--${escapeHtml(section)}">
      ${legacyEditorHtml}
    </div>
  </section>`
}
