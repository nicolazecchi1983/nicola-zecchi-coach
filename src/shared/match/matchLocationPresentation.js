export function normalizeMatchLocation(value) {
  if (value === 'away') return 'away'
  if (value === 'neutral') return 'neutral'
  return 'home'
}

export function matchLocationPresentation(value) {
  const key = normalizeMatchLocation(value)
  if (key === 'away') return Object.freeze({ key, label: 'Trasferta', iconName: 'away' })
  if (key === 'neutral') return Object.freeze({ key, label: 'Neutro', iconName: 'location' })
  return Object.freeze({ key: 'home', label: 'Casa', iconName: 'home' })
}

export function renderMatchLocationBadge(value, { icon, compact = false } = {}) {
  const item = matchLocationPresentation(value)
  const iconHtml = typeof icon === 'function' ? icon(item.iconName) : ''
  const compactClass = compact ? ' match-location-badge--compact' : ''
  return `<span class="match-location-badge${compactClass}" data-match-location="${item.key}"><span class="match-location-badge__icon" aria-hidden="true">${iconHtml}</span><span class="match-location-badge__label">${item.label}</span></span>`
}
