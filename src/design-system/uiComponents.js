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
    label: 'Torna alla Match Library',
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
