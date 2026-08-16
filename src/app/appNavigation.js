import { icon } from '../design-system/iconRegistry.js'
import { filterAccessibleMenu } from '../core/permissions.js'

export const APP_MENU = [
  ['dashboard', 'Dashboard'],
  ['calendar', 'Calendario'],
  ['training-sheet', 'Training Sheet Editor'],
  ['library', 'Training Library'],
  ['match-library', 'Match Library'],
  ['callups', 'Convocazioni'],
  ['our-team', 'Nostra squadra'],
  ['opponent', 'Avversario'],
  ['analysis', 'Analisi Gare'],
  ['squad', 'Rosa'],
  ['settings', 'Impostazioni'],
]

const SIDEBAR_GROUPS = [
  { key: 'primary', items: [['dashboard', 'Dashboard', 'dashboard'], ['calendar', 'Calendario', 'calendar']] },
  { key: 'training', label: 'Training', items: [['training-sheet', 'Training Sheet', 'training-sheet'], ['library', 'Training Library', 'library']] },
  { key: 'match', label: 'Match', items: [['match-library', 'Match Library', 'match-library']] },
  { key: 'management', items: [['squad', 'Rosa', 'squad'], ['settings', 'Impostazioni', 'settings']] },
]


const MOBILE_DRAWER_GROUPS = [
  {
    key: 'primary',
    label: 'Principale',
    items: [
      ['dashboard', 'Dashboard', 'dashboard'],
      ['calendar', 'Calendario', 'calendar'],
    ],
  },
  {
    key: 'training',
    label: 'Training',
    items: [
      ['training-sheet', 'Training Sheet', 'training-sheet'],
      ['library', 'Training Library', 'library'],
    ],
  },
  {
    key: 'match',
    label: 'Match',
    items: [
      ['match-library', 'Match Library', 'match-library'],
    ],
  },
  {
    key: 'team',
    label: 'Squadra',
    items: [
      ['squad', 'Rosa', 'squad'],
    ],
  },
  {
    key: 'system',
    label: 'Sistema',
    items: [
      ['settings', 'Impostazioni', 'settings'],
    ],
  },
]

export function renderMobileNavigation({ identity = {}, team = {}, renderTeamLogo, escapeHtml } = {}) {
  const accessibleKeys = new Set(filterAccessibleMenu(APP_MENU).map(([key]) => key))
  const renderItem = ([key, label, iconKey]) => {
    if (!accessibleKeys.has(key)) return ''
    return `<button class="mobile-drawer-item nav-item" type="button" data-section="${key}">
      <span class="mobile-drawer-item__icon">${icon(iconKey || key)}</span>
      <span class="mobile-drawer-item__label">${label}</span>
    </button>`
  }

  const groups = MOBILE_DRAWER_GROUPS.map((group) => {
    const items = group.items.map(renderItem).join('')
    if (!items) return ''
    return `<section class="mobile-drawer-group" data-mobile-drawer-group="${group.key}">
      <div class="mobile-drawer-group__label">${group.label}</div>
      <div class="mobile-drawer-group__items">${items}</div>
    </section>`
  }).join('')

  const teamName = escapeHtml?.(team?.shortName || team?.name || 'STAFF') || 'STAFF'
  const season = team?.season ? `Stagione ${escapeHtml?.(team.season) || team.season}` : 'STAFF'
  const name = escapeHtml?.(identity?.name || 'Utente') || 'Utente'
  const role = escapeHtml?.(identity?.role || 'Staff') || 'Staff'
  const initial = escapeHtml?.(identity?.initial || 'S') || 'S'
  const logo = typeof renderTeamLogo === 'function'
    ? renderTeamLogo('mobile-drawer-brand__logo')
    : `<span class="mobile-drawer-brand__fallback">S</span>`

  return `<div class="mobile-drawer-shell" data-mobile-drawer-shell aria-hidden="true">
    <button class="mobile-drawer-backdrop" type="button" data-mobile-drawer-close aria-label="Chiudi menu"></button>
    <aside class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu STAFF">
      <header class="mobile-drawer-head">
        <div class="mobile-drawer-brand">
          ${logo}
          <div class="mobile-drawer-brand__copy">
            <strong>STAFF</strong>
            <span>${teamName} · ${season}</span>
          </div>
        </div>
        <button class="mobile-drawer-close" type="button" data-mobile-drawer-close aria-label="Chiudi menu">${icon('close')}</button>
      </header>
      <nav class="mobile-drawer-nav" aria-label="Navigazione principale mobile">${groups}</nav>
      <footer class="mobile-drawer-profile">
        <span class="mobile-drawer-profile__avatar" aria-hidden="true">${initial}</span>
        <span class="mobile-drawer-profile__copy"><strong>${name}</strong><small>${role}</small></span>
        <button class="mobile-drawer-profile__settings nav-item" type="button" data-section="settings" aria-label="Apri impostazioni">${icon('settings')}</button>
      </footer>
    </aside>
  </div>`
}

export function renderSidebarMenu() {
  const accessibleKeys = new Set(filterAccessibleMenu(APP_MENU).map(([key]) => key))
  let firstVisible = true

  const renderItem = ([key, label, iconKey]) => {
    if (!accessibleKeys.has(key)) return ''
    const isActive = firstVisible
    firstVisible = false
    return `<button class="nav-item ${isActive ? 'is-active' : ''}" type="button" data-section="${key}">
      <span class="nav-icon">${icon(iconKey || key)}</span><span>${label}</span>
    </button>`
  }

  return SIDEBAR_GROUPS.map((group) => {
    const items = group.items.map(renderItem).join('')
    if (!items) return ''
    if (!group.label) return `<div class="nav-group nav-group--plain">${items}</div>`
    return `<section class="nav-group" data-nav-group="${group.key}">
      <button class="nav-group-toggle" type="button" aria-expanded="true" data-nav-group-toggle="${group.key}">
        <span>${group.label}</span><span class="nav-group-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="nav-group-items">${items}</div>
    </section>`
  }).join('')
}
