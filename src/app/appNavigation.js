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
