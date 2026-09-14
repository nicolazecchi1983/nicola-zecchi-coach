import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

function safeMatchDateLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const isoDate = raw.slice(0, 10)
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace('.', '').toUpperCase()
}

function safeMatchTimeLabel(activeMatch = {}) {
  if (activeMatch.time) return String(activeMatch.time).slice(0, 5)
  const raw = String(activeMatch.startAt || '').trim()
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function matchIdentityMetaHtml({ activeMatch, sectionLabel, escapeHtml }) {
  const items = []
  const dateLabel = safeMatchDateLabel(activeMatch?.date || activeMatch?.startAt)
  const timeLabel = safeMatchTimeLabel(activeMatch)
  const round = activeMatch?.competitionRound ?? activeMatch?.matchDay ?? null
  const homeAway = activeMatch?.homeAway === 'away' ? 'Trasferta' : activeMatch?.homeAway === 'home' ? 'Casa' : ''
  const place = activeMatch?.place || activeMatch?.venue || activeMatch?.location || ''

  if (sectionLabel) items.push(`<span class="match-workspace-shell__section-label">${escapeHtml(sectionLabel)}</span>`)
  if (dateLabel) items.push(`<time datetime="${escapeHtml(String(activeMatch?.date || activeMatch?.startAt || '').slice(0, 10))}">${escapeHtml(dateLabel)}</time>`)
  if (timeLabel) items.push(`<span>${escapeHtml(timeLabel)}</span>`)
  if (round !== null && round !== '') items.push(`<span>Giornata ${escapeHtml(String(round))}</span>`)
  if (homeAway) items.push(`<span>${escapeHtml(homeAway)}</span>`)
  if (place) items.push(`<span>${escapeHtml(String(place))}</span>`)

  return items.join('')
}

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
  const homeAway = activeMatch?.homeAway || 'home'
  const homeTeam = homeAway === 'away' ? opponent : ownTeamName
  const awayTeam = homeAway === 'away' ? ownTeamName : opponent
  const sectionLabel = section === 'our-team' ? ownTeamName : 'Avversario'
  const matchTitleHtml = `${escapeHtml(homeTeam)} <span class="match-workspace-shell__versus">vs</span> ${escapeHtml(awayTeam)}`
  const matchMetaHtml = matchIdentityMetaHtml({ activeMatch, sectionLabel, escapeHtml })

  const contentHtml = `<section class="workspace-surface product-surface match-native-surface">
    <div class="match-native-legacy-host match-native-legacy-host--${escapeHtml(section)}">
      ${legacyEditorHtml}
    </div>
  </section>`

  return matchWorkspaceShellHtml({
    activeSection: section,
    teamName: ownTeamName,
    opponentName: activeMatch?.opponent || '',
    titleHtml: matchTitleHtml,
    workspaceTitleHtml: escapeHtml(meta.title),
    matchMetaHtml,
    className: 'match-native-section',
    attributes: {
      'data-native-match-section': escapeHtml(section),
      'data-native-match-step': meta.step,
    },
    contentHtml,
  })
}
