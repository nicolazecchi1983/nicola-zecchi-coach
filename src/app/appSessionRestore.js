export const MATCH_CONTEXT_SECTIONS = Object.freeze([
  'match-workspace',
  'opponent-study',
  'callups',
  'our-team',
  'opponent',
  'analysis',
  'match-statistics',
  'match-report-workspace',
  'post-match',
])

const MATCH_CONTEXT_SET = new Set(MATCH_CONTEXT_SECTIONS)

export const WORKSPACE_LABELS = Object.freeze({
  dashboard: 'Dashboard',
  calendar: 'Calendario',
  'training-sheet': 'Training Sheet',
  library: 'Training Library',
  'match-library': 'Match Library',
  'match-workspace': 'Match Workspace',
  'opponent-study': 'Studio avversario',
  callups: 'Convocazioni',
  'our-team': 'Nostra squadra',
  opponent: 'Avversario',
  analysis: 'Analisi gara',
  'match-statistics': 'Statistiche partita',
  'match-report-workspace': 'Report partita',
  'post-match': 'Post gara',
  board: 'Board',
  squad: 'Rosa',
  methodology: 'Metodologia',
  settings: 'Impostazioni',
  staff: 'Gestione Staff',
  'team-settings': 'Identità squadra',
  profile: 'Profilo',
})

function hasValidMatchContext(activeMatch, calendarEvents = []) {
  const matchId = String(activeMatch?.id || '').trim()
  if (!matchId) return false
  return calendarEvents.some((event) => String(event?.id || '') === matchId && event?.type === 'match')
}

export function resolveWorkspaceRestore({
  savedSection,
  activeMatch,
  calendarEvents = [],
  canAccessSection,
  availableSections = [],
  firstAccessibleSection = 'dashboard',
} = {}) {
  const requested = String(savedSection || '').trim() || 'dashboard'
  const available = new Set(availableSections)
  const canAccess = typeof canAccessSection === 'function' ? canAccessSection : () => true

  const safeFallback = canAccess(firstAccessibleSection) && available.has(firstAccessibleSection)
    ? firstAccessibleSection
    : (available.has('dashboard') && canAccess('dashboard') ? 'dashboard' : [...available].find(canAccess) || 'profile')

  if (!available.has(requested) || !canAccess(requested)) {
    return {
      key: safeFallback,
      label: WORKSPACE_LABELS[safeFallback] || 'Dashboard',
      navigationKey: safeFallback,
      reason: 'unavailable',
    }
  }

  if (MATCH_CONTEXT_SET.has(requested) && !hasValidMatchContext(activeMatch, calendarEvents)) {
    const fallback = available.has('match-library') && canAccess('match-library') ? 'match-library' : safeFallback
    return {
      key: fallback,
      label: WORKSPACE_LABELS[fallback] || 'Match Library',
      navigationKey: fallback,
      reason: 'missing-match-context',
    }
  }

  return {
    key: requested,
    label: WORKSPACE_LABELS[requested] || '',
    navigationKey: MATCH_CONTEXT_SET.has(requested)
      ? 'match-library'
      : requested === 'team-settings'
        ? 'settings'
        : requested === 'profile'
          ? ''
          : requested,
    reason: 'restored',
  }
}
