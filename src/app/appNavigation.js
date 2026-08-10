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
  ['board', 'Board'],
  ['squad', 'Rosa'],
  ['methodology', 'Metodologia'],
  ['settings', 'Impostazioni'],
]

const SIDEBAR_GROUPS = [
  { key: 'primary', items: [['dashboard', 'Dashboard', 'dashboard'], ['calendar', 'Calendario', 'calendar']] },
  { key: 'training', label: 'Training', items: [['training-sheet', 'Training Sheet', 'training-sheet'], ['library', 'Training Library', 'library']] },
  { key: 'match', label: 'Match', items: [['match-library', 'Match Library', 'match-library']] },
  { key: 'management', items: [['board', 'Board', 'board'], ['squad', 'Rosa', 'squad'], ['methodology', 'Metodologia', 'methodology'], ['settings', 'Impostazioni', 'settings']] },
]


const MOBILE_PRIMARY_NAV = [
  ['dashboard', 'Home', 'dashboard'],
  ['calendar', 'Calendario', 'calendar'],
  ['training-sheet', 'Training', 'training-sheet'],
  ['match-library', 'Match', 'match-library'],
]

const MOBILE_MORE_NAV = [
  ['library', 'Training Library', 'library'],
  ['board', 'Board', 'board'],
  ['squad', 'Rosa', 'squad'],
  ['methodology', 'Metodologia', 'methodology'],
  ['settings', 'Impostazioni', 'settings'],
]

export function renderMobileNavigation() {
  const accessibleKeys = new Set(filterAccessibleMenu(APP_MENU).map(([key]) => key))
  const renderMobileItem = ([key, label, iconKey], className = '') => {
    if (!accessibleKeys.has(key)) return ''
    return `<button class="mobile-nav-item nav-item ${className}" type="button" data-section="${key}">
      <span class="mobile-nav-icon">${icon(iconKey || key)}</span>
      <span class="mobile-nav-label">${label}</span>
    </button>`
  }

  const primary = MOBILE_PRIMARY_NAV.map((item) => renderMobileItem(item)).join('')
  const more = MOBILE_MORE_NAV.map((item) => renderMobileItem(item, 'mobile-more-item')).join('')

  return `<nav class="mobile-navigation" aria-label="Navigazione principale mobile">
    <div class="mobile-more-sheet" data-mobile-more-sheet aria-hidden="true">
      <div class="mobile-more-sheet__head">
        <div><strong>Altro</strong><span>Sezioni STAFF</span></div>
        <button class="mobile-more-close" type="button" data-mobile-more-close aria-label="Chiudi menu">${icon('close')}</button>
      </div>
      <div class="mobile-more-grid">${more}</div>
    </div>
    <div class="mobile-nav-bar">
      ${primary}
      <button class="mobile-nav-item mobile-nav-more" type="button" data-mobile-more-toggle aria-expanded="false">
        <span class="mobile-nav-icon">${icon('menu')}</span>
        <span class="mobile-nav-label">Altro</span>
      </button>
    </div>
  </nav>`
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
