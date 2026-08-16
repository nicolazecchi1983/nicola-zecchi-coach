function sectionFromElement(section, index) {
  return {
    id: section.querySelector('[data-post-match-section-id]')?.value || `custom-${index + 1}`,
    title: section.querySelector('[data-post-match-section-title-input]')?.value || `Sezione ${index + 1}`,
    helper: section.querySelector('[data-post-match-section-helper-input]')?.value || '',
    kind: section.querySelector('[data-post-match-section-kind]')?.value || 'text',
    content: section.querySelector('[data-post-match-section-content]')?.value || '',
    order: index,
  }
}

export function collectPostMatchSections(form) {
  return [...form.querySelectorAll('[data-post-match-section]')].map(sectionFromElement)
}

function closeMenus(form, except = null) {
  form.querySelectorAll('[data-post-match-section-menu]').forEach((menu) => {
    if (menu !== except) menu.hidden = true
  })
  form.querySelectorAll('[data-post-match-section-menu-button]').forEach((button) => {
    const menu = button.parentElement?.querySelector('[data-post-match-section-menu]')
    button.setAttribute('aria-expanded', String(menu && !menu.hidden))
  })
}

function createElement(documentRef, tag, { className = '', text = '', attrs = {} } = {}) {
  const element = documentRef.createElement(tag)
  if (className) element.className = className
  if (text) element.textContent = text
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value))
  return element
}

function buildCustomSection(documentRef, id, title) {
  const section = createElement(documentRef, 'section', { className: 'post-match-section product-surface' })
  section.dataset.postMatchSection = ''
  section.dataset.sectionId = id

  const head = createElement(documentRef, 'div', { className: 'post-match-section-head' })
  const toggle = createElement(documentRef, 'button', {
    className: 'post-match-section-toggle',
    attrs: { type: 'button', 'data-post-match-section-toggle': '', 'aria-expanded': 'true' },
  })
  toggle.append(
    createElement(documentRef, 'span', { className: 'post-match-section-title', text: title, attrs: { 'data-post-match-section-title': '' } }),
    createElement(documentRef, 'span', { className: 'post-match-section-chevron', text: '⌄', attrs: { 'aria-hidden': 'true' } }),
  )

  const menuWrap = createElement(documentRef, 'div', { className: 'post-match-section-menu-wrap' })
  const menuButton = createElement(documentRef, 'button', {
    className: 'post-match-section-menu-button',
    text: '⋯',
    attrs: { type: 'button', 'data-post-match-section-menu-button': '', 'aria-label': 'Azioni sezione', 'aria-expanded': 'false' },
  })
  const menu = createElement(documentRef, 'div', { className: 'post-match-section-menu', attrs: { 'data-post-match-section-menu': '' } })
  menu.hidden = true
  menu.append(
    createElement(documentRef, 'button', { text: 'Rinomina', attrs: { type: 'button', 'data-post-match-section-rename': '' } }),
    createElement(documentRef, 'button', { className: 'is-danger', text: 'Elimina', attrs: { type: 'button', 'data-post-match-section-delete': '' } }),
  )
  menuWrap.append(menuButton, menu)
  head.append(toggle, menuWrap)

  const body = createElement(documentRef, 'div', { className: 'post-match-section-body', attrs: { 'data-post-match-section-body': '' } })
  const idInput = createElement(documentRef, 'input', { attrs: { type: 'hidden', name: 'post_match_section_id', 'data-post-match-section-id': '' } })
  idInput.value = id
  const titleInput = createElement(documentRef, 'input', { attrs: { type: 'hidden', name: 'post_match_section_title', 'data-post-match-section-title-input': '' } })
  titleInput.value = title
  const kindInput = createElement(documentRef, 'input', { attrs: { type: 'hidden', name: 'post_match_section_kind', 'data-post-match-section-kind': '' } })
  kindInput.value = 'text'
  const helperInput = createElement(documentRef, 'input', { attrs: { type: 'hidden', name: 'post_match_section_helper', 'data-post-match-section-helper-input': '' } })
  helperInput.value = ''
  const textarea = createElement(documentRef, 'textarea', {
    attrs: { name: 'post_match_section_content', 'data-post-match-section-content': '', rows: '6', maxlength: '4000', placeholder: 'Scrivi qui...' },
  })
  body.append(idInput, titleInput, kindInput, helperInput, textarea)
  section.append(head, body)
  return section
}

export function wirePostMatchSectionsEvents({
  form,
  promptUser = globalThis.prompt,
  confirmUser = globalThis.confirm,
  documentRef = globalThis.document,
} = {}) {
  if (!form) return

  form.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-post-match-section-toggle]')
    if (toggle) {
      const section = toggle.closest('[data-post-match-section]')
      const body = section?.querySelector('[data-post-match-section-body]')
      if (!body) return
      const open = body.hidden
      body.hidden = !open
      toggle.setAttribute('aria-expanded', String(open))
      section?.classList.toggle('is-open', open)
      return
    }

    const menuButton = event.target.closest('[data-post-match-section-menu-button]')
    if (menuButton) {
      const menu = menuButton.parentElement?.querySelector('[data-post-match-section-menu]')
      if (!menu) return
      const nextHidden = !menu.hidden
      closeMenus(form, menu)
      menu.hidden = nextHidden
      menuButton.setAttribute('aria-expanded', String(!menu.hidden))
      return
    }

    const rename = event.target.closest('[data-post-match-section-rename]')
    if (rename) {
      const section = rename.closest('[data-post-match-section]')
      if (!section) return
      const titleInput = section.querySelector('[data-post-match-section-title-input]')
      const titleText = section.querySelector('[data-post-match-section-title]')
      const next = String(promptUser?.('Nuovo nome della sezione:', titleInput?.value || '') ?? '').trim()
      if (!next) return
      if (titleInput) titleInput.value = next.slice(0, 120)
      if (titleText) titleText.textContent = next.slice(0, 120)
      closeMenus(form)
      return
    }

    const remove = event.target.closest('[data-post-match-section-delete]')
    if (remove) {
      const section = remove.closest('[data-post-match-section]')
      if (!section) return
      const content = section.querySelector('[data-post-match-section-content]')?.value.trim() || ''
      if (content && !confirmUser?.('Questa sezione contiene dati. Eliminarla?')) return
      section.remove()
      return
    }

    const add = event.target.closest('[data-post-match-add-section]')
    if (add) {
      const title = String(promptUser?.('Nome della nuova sezione:', '') ?? '').trim()
      if (!title) return
      const list = form.querySelector('[data-post-match-sections]')
      if (!list) return
      const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      const section = buildCustomSection(documentRef, id, title.slice(0, 120))
      list.append(section)
      section.querySelector('[data-post-match-section-content]')?.focus()
    }
  })
}
