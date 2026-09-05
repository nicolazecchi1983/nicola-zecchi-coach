import { icon } from './iconRegistry.js'

const BUTTON_VARIANTS = new Set(['primary', 'secondary', 'danger', 'ghost'])

function attributesHtml(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== false && value != null)
    .map(([name, value]) => value === true ? name : `${name}="${String(value).replaceAll('"', '&quot;')}"`)
    .join(' ')
}

export function buttonHtml({
  label,
  variant = 'secondary',
  type = 'button',
  className = '',
  attributes = {},
  iconBefore = '',
  iconAfter = '',
} = {}) {
  const safeVariant = BUTTON_VARIANTS.has(variant) ? variant : 'secondary'
  const classes = ['staff-button', `staff-button--${safeVariant}`, className].filter(Boolean).join(' ')
  const attrs = attributesHtml({ type, class: classes, ...attributes })
  return `<button ${attrs}>${iconBefore}${label ?? ''}${iconAfter}</button>`
}



export const STAFF_COLOR_SWATCHES = Object.freeze([
  '#07194f', '#1f93e5', '#dc2626', '#facc15', '#16a34a',
  '#ffffff', '#111827', '#f97316', '#7c3aed',
])

export function colorPickerHtml({
  name,
  value,
  label,
  fieldKey = '',
  className = '',
} = {}) {
  const safeName = String(name || '').replaceAll('"', '&quot;')
  const safeValue = String(value || '#1f93e5').replaceAll('"', '&quot;')
  const safeLabel = String(label || 'Colore').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const safeKey = String(fieldKey || safeName).replaceAll('"', '&quot;')
  const classes = ['staff-color-picker', className].filter(Boolean).join(' ')
  const swatches = STAFF_COLOR_SWATCHES.map((color) =>
    `<button type="button" class="staff-color-swatch" data-staff-color-value="${color}" style="--swatch:${color}" aria-label="Scegli ${color}" title="${color}"></button>`
  ).join('')
  return `<fieldset class="${classes}" data-staff-color-picker="${safeKey}">
    <legend>${safeLabel}</legend>
    <div class="staff-color-swatches">${swatches}</div>
    <label class="staff-color-custom"><span>Personalizzato</span><input type="color" name="${safeName}" value="${safeValue}"></label>
  </fieldset>`
}

const MATCH_CONTEXT_NAV_ITEMS = Object.freeze([
  ['opponent-study', 'Studio avversario'],
  ['callups', 'Convocazioni'],
  ['our-team', 'Nostra squadra'],
  ['opponent', 'Avversario'],
  ['analysis', 'Analisi gara'],
  ['report', 'Report'],
  ['post-match', 'Post gara'],
])

export function matchContextNavigationHtml(activeSection = '', { teamName = '' } = {}) {
  const resolvedTeamName = String(teamName || '').trim()
  return `<nav class="match-context-navigation product-section-nav" aria-label="Sezioni della partita">
    ${MATCH_CONTEXT_NAV_ITEMS.map(([key, label], index) => {
      const resolvedLabel = key === 'our-team' && resolvedTeamName ? resolvedTeamName : label
      return `<button type="button" class="${key === activeSection ? 'is-active' : ''}" data-match-context-section="${key}"><b>${String(index + 1).padStart(2, '0')}</b><span>${resolvedLabel}</span></button>`
    }).join('')}
  </nav>`
}

export function matchContextBackButtonHtml() {
  return buttonHtml({
    label: '<span data-match-context-back-label>Torna alla Match Library</span>',
    variant: 'secondary',
    className: 'match-context-back',
    attributes: { 'data-return-to-match-workspace': true },
    iconBefore: '<span aria-hidden="true">←</span> ',
  })
}


export function editorFooterHtml({
  progressText,
  progressAttribute,
  previousAttribute,
  nextAttribute,
  saveAttribute,
  saveLabel,
} = {}) {
  return `<footer class="match-form-footer staff-editor-footer">
    ${buttonHtml({
      label: 'Indietro',
      variant: 'secondary',
      attributes: { [previousAttribute]: true, disabled: true },
      iconBefore: '<span aria-hidden="true">←</span> ',
    })}
    <span ${progressAttribute}>${progressText}</span>
    ${buttonHtml({
      label: 'Continua',
      variant: 'primary',
      attributes: { [nextAttribute]: true },
      iconAfter: ' <span aria-hidden="true">→</span>',
    })}
    ${buttonHtml({
      label: saveLabel,
      variant: 'primary',
      attributes: { [saveAttribute]: true, hidden: true },
    })}
  </footer>`
}
export function compactResourceActionHtml({
  label,
  iconName = '',
  variant = 'secondary',
  href = '',
  className = '',
  attributes = {},
} = {}) {
  const safeVariant = BUTTON_VARIANTS.has(variant) ? variant : 'secondary'
  const iconHtml = iconName ? `<span class="staff-resource-action__icon" aria-hidden="true">${icon(iconName)}</span>` : ''
  const labelHtml = `<span>${label ?? ''}</span>`
  const classes = ['staff-resource-action', className].filter(Boolean).join(' ')

  if (href) {
    const attrs = attributesHtml({
      href,
      class: ['staff-button', `staff-button--${safeVariant}`, classes].filter(Boolean).join(' '),
      ...attributes,
    })
    return `<a ${attrs}>${iconHtml}${labelHtml}</a>`
  }

  return buttonHtml({
    label: labelHtml,
    variant: safeVariant,
    className: classes,
    attributes,
    iconBefore: iconHtml,
  })
}

export function resourceSectionHeaderHtml({
  index = '',
  titleHtml = '',
  countHtml = '',
  actionsHtml = '',
} = {}) {
  return `<header class="staff-resource-section__header">
    <div class="staff-resource-section__identity">
      ${index ? `<span class="staff-resource-index">${index}</span>` : ''}
      <h2 class="staff-resource-section__title">${titleHtml}</h2>
      ${countHtml ? `<span class="staff-resource-section__count">${countHtml}</span>` : ''}
    </div>
    ${actionsHtml ? `<div class="staff-resource-section__actions">${actionsHtml}</div>` : ''}
  </header>`
}

export function resourceRowHtml({
  iconName = 'document',
  eyebrowHtml = '',
  titleHtml = '',
  metaHtml = '',
  actionsHtml = '',
  attributes = {},
} = {}) {
  const attrs = attributesHtml({ class: 'staff-resource-row', ...attributes })
  return `<article ${attrs}>
    <span class="staff-resource-row__icon" aria-hidden="true">${icon(iconName)}</span>
    <div class="staff-resource-row__content">
      ${eyebrowHtml ? `<span class="staff-resource-row__eyebrow">${eyebrowHtml}</span>` : ''}
      <strong class="staff-resource-row__title">${titleHtml}</strong>
      ${metaHtml ? `<small class="staff-resource-row__meta">${metaHtml}</small>` : ''}
    </div>
    ${actionsHtml ? `<div class="staff-resource-row__actions">${actionsHtml}</div>` : ''}
  </article>`
}

export function overflowActionMenuHtml({
  label = 'Altre azioni',
  itemsHtml = '',
  className = '',
} = {}) {
  return `<details class="${['staff-overflow-menu', className].filter(Boolean).join(' ')}">
    <summary class="staff-overflow-menu__trigger" aria-label="${String(label).replaceAll('"', '&quot;')}">${icon('more')}</summary>
    <div class="staff-overflow-menu__popover">${itemsHtml}</div>
  </details>`
}