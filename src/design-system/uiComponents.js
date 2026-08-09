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


const MATCH_CONTEXT_NAV_ITEMS = Object.freeze([
  ['opponent-study', 'Studio avversario'],
  ['callups', 'Convocazioni'],
  ['our-team', 'Nostra squadra'],
  ['opponent', 'Avversario'],
  ['analysis', 'Analisi gara'],
  ['report', 'Report'],
  ['post-match', 'Post gara'],
])

export function matchContextNavigationHtml(activeSection = '') {
  return `<nav class="match-context-navigation" aria-label="Sezioni della partita">
    ${MATCH_CONTEXT_NAV_ITEMS.map(([key, label], index) => `<button type="button" class="${key === activeSection ? 'is-active' : ''}" data-match-context-section="${key}"><b>${String(index + 1).padStart(2, '0')}</b><span>${label}</span></button>`).join('')}
  </nav>`
}

export function matchContextBackButtonHtml() {
  return buttonHtml({
    label: 'Torna alla partita',
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
