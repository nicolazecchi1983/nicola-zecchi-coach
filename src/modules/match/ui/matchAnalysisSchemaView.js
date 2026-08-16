import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'
import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import {
  MATCH_ANALYSIS_SUGGESTIONS,
  analysisSchemaHasNotes,
  createAnalysisTemplateDefinition,
  createMatchAnalysisSchema,
  createStaffAnalysisTemplateSchema,
  parseMatchAnalysisSchema,
  serializeMatchAnalysisSchema,
} from '../matchAnalysisSchema.js'


function subsectionHtml(item) {
  return `<details class="analysis-schema-subsection" data-analysis-subsection="${escapeHtml(item.id)}">
    <summary>
      <span data-analysis-subsection-label>${escapeHtml(item.title)}</span>
      <span class="analysis-schema-disclosure" aria-hidden="true">⌄</span>
    </summary>
    <div class="analysis-schema-subsection-body">
      <label><span>Titolo sottofase</span><input name="analysis_subsection_title" type="text" value="${escapeHtml(item.title)}" data-analysis-subsection-title aria-label="Titolo sottofase"></label>
      <label><span>Contenuto</span><textarea name="analysis_subsection_note" rows="5" data-analysis-subsection-note placeholder="Scrivi osservazioni, principi, comportamenti, riferimenti video...">${escapeHtml(item.note)}</textarea></label>
      <div class="analysis-schema-item-actions">
        <button type="button" class="ghost-button" data-remove-analysis-subsection>Elimina sottofase</button>
      </div>
    </div>
  </details>`
}

function phaseHtml(phase) {
  const suggestions = MATCH_ANALYSIS_SUGGESTIONS[phase.key] || []
  return `<details class="analysis-schema-phase" data-analysis-phase="${escapeHtml(phase.key)}">
    <summary class="analysis-schema-phase-summary">
      <div><span>MACROAREA</span><strong data-analysis-phase-label>${escapeHtml(phase.title)}</strong></div>
      <div class="analysis-schema-phase-meta"><small>${phase.subsections.length} sottofasi</small><span aria-hidden="true">⌄</span></div>
    </summary>
    <div class="analysis-schema-phase-body">
      <div class="analysis-schema-phase-tools">
        <label><span>Nome macroarea</span><input name="analysis_phase_title" type="text" value="${escapeHtml(phase.title)}" data-analysis-phase-title></label>
        <button type="button" class="ghost-button analysis-schema-delete-phase" data-remove-analysis-phase>Elimina macroarea</button>
      </div>
      <label class="analysis-schema-general"><span>Nota generale della macroarea</span><textarea name="analysis_phase_note" rows="4" data-analysis-phase-note placeholder="Nota generale facoltativa...">${escapeHtml(phase.note)}</textarea></label>
      <div class="analysis-schema-subsections" data-analysis-subsections>
        ${phase.subsections.map(subsectionHtml).join('')}
      </div>
      <div class="analysis-schema-add">
        <select name="analysis_subsection_template" data-analysis-subsection-template aria-label="Scegli una sottofase">
          <option value="">Aggiungi una sottofase…</option>
          ${suggestions.map((label) => `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`).join('')}
          <option value="__custom__">Personalizzata…</option>
        </select>
        <button type="button" class="secondary-button" data-add-analysis-subsection>＋ Aggiungi</button>
      </div>
    </div>
  </details>`
}

function templateToolbarHtml() {
  return `<section class="analysis-template-toolbar analysis-template-toolbar--apply-only" data-analysis-template-toolbar>
    <div class="analysis-template-apply">
      <label><span>Template di partenza</span><select name="analysis_template_select" data-analysis-template-select>
        <option value="__staff__">Template STAFF</option>
      </select></label>
      <button type="button" class="secondary-button" data-apply-analysis-template>Applica alla partita</button>
      <button type="button" class="ghost-button" data-open-analysis-template-manager>Gestisci template</button>
    </div>
    <p class="analysis-template-scope">Questa pagina modifica solo la partita corrente. Per modificare un template personale usa “Gestisci template”.</p>
    <p class="analysis-template-message" data-analysis-template-message></p>
  </section>`
}

export function renderMatchAnalysisSchemaEditor({
  name,
  schema,
  title = 'Lettura per fasi',
  description = 'Apri una macroarea, poi la sottofase su cui vuoi lavorare.',
  showIntro = true,
} = {}) {
  const normalized = parseMatchAnalysisSchema(schema)
  return `<section class="analysis-schema-editor" data-analysis-schema-editor>
    ${showIntro ? `<div class="analysis-schema-intro">
      <div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>
      <span>PERSONALIZZABILE</span>
    </div>` : ''}
    ${templateToolbarHtml()}
    <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(serializeMatchAnalysisSchema(normalized))}" data-analysis-schema-value>
    <div class="analysis-schema-phases" data-analysis-schema-phases>${normalized.phases.map(phaseHtml).join('')}</div>
    <button type="button" class="secondary-button analysis-schema-add-phase" data-add-analysis-phase>＋ Aggiungi macroarea</button>
  </section>`
}

function createSubsectionNode(title = 'Nuova sottofase') {
  const holder = document.createElement('div')
  const id = `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`
  holder.innerHTML = subsectionHtml({ id, title, note: '' })
  return holder.firstElementChild
}

function createPhaseNode(title = 'Nuova macroarea') {
  const holder = document.createElement('div')
  const key = `custom-phase-${Date.now()}-${Math.random().toString(16).slice(2)}`
  holder.innerHTML = phaseHtml({ key, title, note: '', subsections: [] })
  return holder.firstElementChild
}

function collectEditor(editor) {
  return createMatchAnalysisSchema({
    version: 2,
    phases: [...editor.querySelectorAll('[data-analysis-phase]')].map((phase) => ({
      key: phase.dataset.analysisPhase,
      title: phase.querySelector('[data-analysis-phase-title]')?.value || phase.querySelector('[data-analysis-phase-label]')?.textContent || '',
      note: phase.querySelector('[data-analysis-phase-note]')?.value || '',
      subsections: [...phase.querySelectorAll('[data-analysis-subsection]')].map((item) => ({
        id: item.dataset.analysisSubsection,
        title: item.querySelector('[data-analysis-subsection-title]')?.value || '',
        note: item.querySelector('[data-analysis-subsection-note]')?.value || '',
      })),
    })),
  })
}

function replaceEditorSchema(editor, schema) {
  const normalized = createMatchAnalysisSchema(schema)
  const phases = editor.querySelector('[data-analysis-schema-phases]')
  if (!phases) return
  phases.innerHTML = normalized.phases.map(phaseHtml).join('')
  syncEditor(editor)
}

function syncLabels(editor) {
  editor.querySelectorAll('[data-analysis-phase]').forEach((phase) => {
    const input = phase.querySelector('[data-analysis-phase-title]')
    const label = phase.querySelector('[data-analysis-phase-label]')
    if (input && label) label.textContent = input.value.trim() || 'Nuova macroarea'
    const count = phase.querySelectorAll('[data-analysis-subsection]').length
    const small = phase.querySelector('.analysis-schema-phase-meta small')
    if (small) small.textContent = `${count} sottofasi`
  })
  editor.querySelectorAll('[data-analysis-subsection]').forEach((item) => {
    const input = item.querySelector('[data-analysis-subsection-title]')
    const label = item.querySelector('[data-analysis-subsection-label]')
    if (input && label) label.textContent = input.value.trim() || 'Nuova sottofase'
  })
}

function syncEditor(editor, { structural = false, reason = '' } = {}) {
  syncLabels(editor)
  const input = editor.querySelector('[data-analysis-schema-value]')
  if (!input) return
  input.value = serializeMatchAnalysisSchema(collectEditor(editor))
  input.dispatchEvent(new Event('input', { bubbles: true }))

  if (structural) {
    editor.dispatchEvent(new CustomEvent('analysis-schema-structure-change', {
      bubbles: true,
      detail: { reason, schema: createMatchAnalysisSchema(input.value) },
    }))
  }
}

function setTemplateMessage(editor, message = '', type = '') {
  const node = editor.querySelector('[data-analysis-template-message]')
  if (!node) return
  node.textContent = message
  node.dataset.type = type
}

async function loadTemplateOptions(editor, options, preferredId = '') {
  const select = editor.querySelector('[data-analysis-template-select]')
  if (!select) return []
  const templates = options?.templateService && options?.teamId
    ? await options.templateService.list(options.teamId)
    : []
  const previous = preferredId || select.value
  select.innerHTML = `<option value="__staff__">Template STAFF</option>${templates.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`).join('')}`
  select.value = templates.some((template) => template.id === previous) ? previous : '__staff__'
  return templates
}

function managerSubsectionHtml(item) {
  return `<div class="analysis-template-manager-subsection" data-template-manager-subsection="${escapeHtml(item.id)}">
    <input name="template_manager_subsection_title" type="text" value="${escapeHtml(item.title)}" data-template-manager-subsection-title aria-label="Nome sottofase">
    <button type="button" class="ghost-button" data-template-manager-remove-subsection aria-label="Elimina sottofase">×</button>
  </div>`
}

function managerPhaseHtml(phase) {
  const suggestions = MATCH_ANALYSIS_SUGGESTIONS[phase.key] || []
  return `<section class="analysis-template-manager-phase" data-template-manager-phase="${escapeHtml(phase.key)}">
    <div class="analysis-template-manager-phase-card-head">
      <div>
        <span>MACROAREA</span>
        <strong data-template-manager-phase-label>${escapeHtml(phase.title)}</strong>
      </div>
      <small><span data-template-manager-phase-count>${phase.subsections.length}</span> sottofasi</small>
    </div>
    <div class="analysis-template-manager-phase-body">
      <div class="analysis-template-manager-phase-head">
        <label><span>Nome macroarea</span><input name="template_manager_phase_title" type="text" value="${escapeHtml(phase.title)}" data-template-manager-phase-title></label>
        <button type="button" class="ghost-button" data-template-manager-remove-phase>Elimina macroarea</button>
      </div>
      <div class="analysis-template-manager-subsections" data-template-manager-subsections>
        ${phase.subsections.map(managerSubsectionHtml).join('')}
      </div>
      <div class="analysis-template-manager-add-subsection">
        <select name="template_manager_subsection_template" data-template-manager-subsection-template>
          <option value="">Aggiungi una sottofase…</option>
          ${suggestions.map((label) => `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`).join('')}
          <option value="__custom__">Personalizzata…</option>
        </select>
        <button type="button" class="secondary-button" data-template-manager-add-subsection>＋ Aggiungi sottofase</button>
      </div>
    </div>
  </section>`
}

function managerSchemaHtml(schema) {
  const normalized = createAnalysisTemplateDefinition(schema)
  return normalized.phases.map(managerPhaseHtml).join('')
}

function refreshTemplateManagerPhaseCount(phase) {
  if (!phase) return
  const count = phase.querySelectorAll('[data-template-manager-subsection]').length
  const node = phase.querySelector('[data-template-manager-phase-count]')
  if (node) node.textContent = String(count)
}

function renderTemplateManagerModal({ templates = [], selectedId = '' } = {}) {
  const personalOptions = templates.map((template) => `<option value="${escapeHtml(template.id)}" ${template.id === selectedId ? 'selected' : ''}>${escapeHtml(template.name)}</option>`).join('')
  return `<div class="analysis-template-manager-backdrop" data-analysis-template-manager-backdrop>
    <section class="analysis-template-manager" role="dialog" aria-modal="true" aria-labelledby="analysisTemplateManagerTitle">
      <header class="analysis-template-manager-head">
        <div><span>TEMPLATE MASTER</span><h2 id="analysisTemplateManagerTitle">Gestione template analisi</h2><p>Qui modifichi il modello riutilizzabile. Le note delle partite non entrano mai nel template.</p></div>
        <button type="button" class="analysis-template-manager-close" data-close-analysis-template-manager aria-label="Chiudi">×</button>
      </header>
      <div class="analysis-template-manager-toolbar">
        <label><span>Template personale</span><select name="template_manager_select" data-template-manager-select>${personalOptions || '<option value="">Nessun template personale</option>'}</select></label>
        <button type="button" class="secondary-button" data-template-manager-new>＋ Nuovo</button>
        <button type="button" class="ghost-button" data-template-manager-duplicate ${selectedId ? '' : 'disabled'}>Duplica</button>
        <button type="button" class="ghost-button analysis-template-manager-danger" data-template-manager-delete ${selectedId ? '' : 'disabled'}>Elimina</button>
      </div>
      <div class="analysis-template-manager-name-row">
        <label><span>Nome template</span><input name="template_manager_name" type="text" maxlength="80" data-template-manager-name placeholder="Nome del template"></label>
        <span data-template-manager-mode></span>
      </div>
      <div class="analysis-template-manager-body" data-template-manager-phases></div>
      <div class="analysis-template-manager-add-phase-row">
        <button type="button" class="secondary-button" data-template-manager-add-phase>＋ Aggiungi macroarea</button>
      </div>
      <footer class="analysis-template-manager-footer">
        <p data-template-manager-message></p>
        <div>
          <button type="button" class="ghost-button" data-close-analysis-template-manager>Annulla</button>
          <button type="button" class="primary-button" data-template-manager-save>Salva template</button>
        </div>
      </footer>
    </section>
  </div>`
}

function uniqueCopyName(baseName, templates) {
  const names = new Set(templates.map((item) => item.name.toLocaleLowerCase('it-IT')))
  let index = 1
  let candidate = `${baseName} copia`
  while (names.has(candidate.toLocaleLowerCase('it-IT'))) {
    index += 1
    candidate = `${baseName} copia ${index}`
  }
  return candidate
}

function collectTemplateManager(modal) {
  return createAnalysisTemplateDefinition({
    version: 2,
    phases: [...modal.querySelectorAll('[data-template-manager-phase]')].map((phase) => ({
      key: phase.dataset.templateManagerPhase,
      title: phase.querySelector('[data-template-manager-phase-title]')?.value || '',
      note: '',
      subsections: [...phase.querySelectorAll('[data-template-manager-subsection]')].map((item) => ({
        id: item.dataset.templateManagerSubsection,
        title: item.querySelector('[data-template-manager-subsection-title]')?.value || '',
        note: '',
      })),
    })),
  })
}

function managerCustomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function openTemplateManager(editor, options, initialTemplates = [], onTemplatesChanged = () => {}) {
  if (!options?.templateService || !options?.teamId || !options?.userId) {
    setTemplateMessage(editor, 'Template Manager non disponibile: verifica la migrazione Supabase.', 'error')
    return initialTemplates
  }

  let templates = initialTemplates.length ? initialTemplates : await options.templateService.list(options.teamId)
  const activeSelect = editor.querySelector('[data-analysis-template-select]')
  const requestedId = activeSelect?.value && activeSelect.value !== '__staff__' ? activeSelect.value : ''
  let activeId = templates.some((item) => item.id === requestedId) ? requestedId : (templates[0]?.id || '')
  let isNew = !activeId

  document.querySelector('[data-analysis-template-manager-backdrop]')?.remove()
  const wrapper = document.createElement('div')
  wrapper.innerHTML = renderTemplateManagerModal({ templates, selectedId: activeId })
  const modal = wrapper.firstElementChild
  document.body.appendChild(modal)
  document.body.classList.add('modal-open')

  const manager = modal.querySelector('.analysis-template-manager')
  const select = modal.querySelector('[data-template-manager-select]')
  const nameInput = modal.querySelector('[data-template-manager-name]')
  const phases = modal.querySelector('[data-template-manager-phases]')
  const mode = modal.querySelector('[data-template-manager-mode]')
  const message = modal.querySelector('[data-template-manager-message]')
  const duplicateButton = modal.querySelector('[data-template-manager-duplicate]')
  const deleteButton = modal.querySelector('[data-template-manager-delete]')

  const setMessage = (text = '', type = '') => {
    message.textContent = text
    message.dataset.type = type
  }

  const currentTemplate = () => templates.find((item) => item.id === activeId) || null

  const loadDefinition = (template = null, schema = null, name = '') => {
    if (template) {
      activeId = template.id
      isNew = false
      if (select) select.value = template.id
      nameInput.value = template.name
      phases.innerHTML = managerSchemaHtml(template.schema)
      mode.textContent = 'MODIFICA MASTER'
      duplicateButton.disabled = false
      deleteButton.disabled = false
      return
    }
    activeId = ''
    isNew = true
    if (select) select.value = ''
    nameInput.value = name
    phases.innerHTML = managerSchemaHtml(schema || createStaffAnalysisTemplateSchema())
    mode.textContent = 'NUOVO TEMPLATE'
    duplicateButton.disabled = true
    deleteButton.disabled = true
  }

  const close = async () => {
    modal.remove()
    document.body.classList.remove('modal-open')
    templates = await loadTemplateOptions(editor, options, activeId)
    onTemplatesChanged(templates)
  }

  if (activeId) loadDefinition(currentTemplate())
  else loadDefinition(null, createStaffAnalysisTemplateSchema(), '')

  modal.querySelectorAll('[data-close-analysis-template-manager]').forEach((button) => button.addEventListener('click', close))
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close()
  })

  select?.addEventListener('change', () => {
    const template = templates.find((item) => item.id === select.value)
    if (template) loadDefinition(template)
  })

  modal.querySelector('[data-template-manager-new]')?.addEventListener('click', () => {
    loadDefinition(null, createStaffAnalysisTemplateSchema(), '')
    nameInput.focus()
  })

  modal.querySelector('[data-template-manager-add-phase]')?.addEventListener('click', () => {
    const key = managerCustomId('custom-phase')
    const holder = document.createElement('div')
    holder.innerHTML = managerPhaseHtml({ key, title: 'Nuova macroarea', subsections: [] })
    phases.appendChild(holder.firstElementChild)
    const addedPhase = phases.lastElementChild
    addedPhase?.querySelector('[data-template-manager-phase-title]')?.focus()
  })

  manager.addEventListener('input', (event) => {
    const phase = event.target.closest('[data-template-manager-phase]')
    if (!phase) return
    if (event.target.matches('[data-template-manager-phase-title]')) {
      const label = phase.querySelector('[data-template-manager-phase-label]')
      if (label) label.textContent = event.target.value.trim() || 'Nuova macroarea'
    }
  })

  manager.addEventListener('click', async (event) => {
    const removePhase = event.target.closest('[data-template-manager-remove-phase]')
    if (removePhase) {
      if (!window.confirm('Eliminare questa macroarea dal template master?')) return
      removePhase.closest('[data-template-manager-phase]')?.remove()
      return
    }

    const removeSubsection = event.target.closest('[data-template-manager-remove-subsection]')
    if (removeSubsection) {
      const phase = removeSubsection.closest('[data-template-manager-phase]')
      removeSubsection.closest('[data-template-manager-subsection]')?.remove()
      refreshTemplateManagerPhaseCount(phase)
      return
    }

    const addSubsection = event.target.closest('[data-template-manager-add-subsection]')
    if (addSubsection) {
      const phase = addSubsection.closest('[data-template-manager-phase]')
      const selectField = phase?.querySelector('[data-template-manager-subsection-template]')
      const list = phase?.querySelector('[data-template-manager-subsections]')
      if (!phase || !selectField || !list || !selectField.value) return
      const title = selectField.value === '__custom__' ? 'Nuova sottofase' : selectField.value
      const id = managerCustomId(phase.dataset.templateManagerPhase || 'subsection')
      const holder = document.createElement('div')
      holder.innerHTML = managerSubsectionHtml({ id, title })
      list.appendChild(holder.firstElementChild)
      selectField.value = ''
      refreshTemplateManagerPhaseCount(phase)
      list.lastElementChild?.querySelector('[data-template-manager-subsection-title]')?.focus()
      return
    }

    const duplicate = event.target.closest('[data-template-manager-duplicate]')
    if (duplicate) {
      const template = currentTemplate()
      if (!template) return
      duplicate.disabled = true
      try {
        const copied = await options.templateService.save({
          teamId: options.teamId,
          userId: options.userId,
          name: uniqueCopyName(template.name, templates),
          schema: template.schema,
        })
        templates = await options.templateService.list(options.teamId)
        onTemplatesChanged(templates)
        select.innerHTML = templates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
        loadDefinition(templates.find((item) => item.id === copied.id))
        setMessage(`Creato “${copied.name}”.`, 'success')
      } catch (error) {
        setMessage(getDataAccessUserMessage(error, undefined, { stage: 'analysis-template-duplicate' }), 'error')
      } finally {
        duplicate.disabled = false
      }
      return
    }

    const removeTemplate = event.target.closest('[data-template-manager-delete]')
    if (removeTemplate) {
      const template = currentTemplate()
      if (!template) return
      if (!window.confirm(`Eliminare definitivamente il template “${template.name}”?`)) return
      removeTemplate.disabled = true
      try {
        await options.templateService.remove(template.id)
        templates = await options.templateService.list(options.teamId)
        onTemplatesChanged(templates)
        select.innerHTML = templates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('') || '<option value="">Nessun template personale</option>'
        const next = templates[0] || null
        if (next) loadDefinition(next)
        else loadDefinition(null, createStaffAnalysisTemplateSchema(), '')
        setMessage('Template eliminato.', 'success')
      } catch (error) {
        setMessage(getDataAccessUserMessage(error, undefined, { stage: 'analysis-template-delete' }), 'error')
      } finally {
        removeTemplate.disabled = false
      }
      return
    }

    const save = event.target.closest('[data-template-manager-save]')
    if (save) {
      const name = nameInput.value.trim()
      if (!name) {
        setMessage('Dai un nome al template.', 'error')
        nameInput.focus()
        return
      }
      save.disabled = true
      try {
        const schema = collectTemplateManager(modal)
        const saved = isNew
          ? await options.templateService.save({
              teamId: options.teamId,
              userId: options.userId,
              name,
              schema,
            })
          : await options.templateService.updateDefinition({
              id: activeId,
              teamId: options.teamId,
              userId: options.userId,
              name,
              schema,
            })
        templates = await options.templateService.list(options.teamId)
        onTemplatesChanged(templates)
        select.innerHTML = templates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
        loadDefinition(templates.find((item) => item.id === saved.id))
        setMessage(`Template “${saved.name}” salvato.`, 'success')
      } catch (error) {
        setMessage(getDataAccessUserMessage(error, undefined, { stage: 'analysis-template-save' }), 'error')
      } finally {
        save.disabled = false
      }
    }
  })

  return templates
}

export async function bindMatchAnalysisSchemaEditors(root, options = {}) {
  if (!root) return
  const editors = [...root.querySelectorAll('[data-analysis-schema-editor]')]

  await Promise.all(editors.map(async (editor) => {
    if (editor.dataset.analysisSchemaBound === 'true') return
    editor.dataset.analysisSchemaBound = 'true'
    let templates = []

    try {
      templates = await loadTemplateOptions(editor, options)
    } catch (error) {
      console.warn('Template analisi non disponibili:', error?.message || error)
      setTemplateMessage(editor, 'Template personali non ancora disponibili. Il Template STAFF resta utilizzabile.', 'warning')
    }

    editor.addEventListener('input', (event) => {
      if (event.target.matches('[data-analysis-phase-title],[data-analysis-subsection-title]')) {
        syncEditor(editor, { structural: true, reason: 'rename-structure' })
        return
      }
      if (event.target.matches('[data-analysis-phase-note],[data-analysis-subsection-note]')) {
        syncEditor(editor)
      }
    })

    editor.addEventListener('click', async (event) => {
      const remove = event.target.closest('[data-remove-analysis-subsection]')
      if (remove) {
        remove.closest('[data-analysis-subsection]')?.remove()
        syncEditor(editor, { structural: true, reason: 'remove-subsection' })
        return
      }

      const removePhase = event.target.closest('[data-remove-analysis-phase]')
      if (removePhase) {
        const phase = removePhase.closest('[data-analysis-phase]')
        if (!phase) return
        if (!window.confirm('Eliminare questa macroarea dalla singola partita?')) return
        phase.remove()
        syncEditor(editor, { structural: true, reason: 'remove-phase' })
        return
      }

      const add = event.target.closest('[data-add-analysis-subsection]')
      if (add) {
        const phase = add.closest('[data-analysis-phase]')
        const select = phase?.querySelector('[data-analysis-subsection-template]')
        const list = phase?.querySelector('[data-analysis-subsections]')
        if (!phase || !select || !list || !select.value) return
        const title = select.value === '__custom__' ? 'Nuova sottofase' : select.value
        const node = createSubsectionNode(title)
        list.appendChild(node)
        phase.open = true
        node.open = true
        select.value = ''
        node.querySelector('[data-analysis-subsection-title]')?.focus()
        syncEditor(editor, { structural: true, reason: 'add-subsection' })
        return
      }

      const addPhase = event.target.closest('[data-add-analysis-phase]')
      if (addPhase) {
        const list = editor.querySelector('[data-analysis-schema-phases]')
        const node = createPhaseNode()
        list?.appendChild(node)
        node.open = true
        node.querySelector('[data-analysis-phase-title]')?.focus()
        syncEditor(editor, { structural: true, reason: 'add-phase' })
        return
      }

      const apply = event.target.closest('[data-apply-analysis-template]')
      if (apply) {
        const select = editor.querySelector('[data-analysis-template-select]')
        const selected = select?.value || '__staff__'
        const nextSchema = selected === '__staff__'
          ? createStaffAnalysisTemplateSchema()
          : templates.find((template) => template.id === selected)?.schema
        if (!nextSchema) return
        if (analysisSchemaHasNotes(collectEditor(editor)) && !window.confirm('Applicare il template sostituirà la struttura e cancellerà le note attuali di questa partita. Continuare?')) return
        replaceEditorSchema(editor, nextSchema)
        syncEditor(editor, { structural: true, reason: 'apply-template' })
        setTemplateMessage(editor, 'Template copiato nella partita. Da ora questa struttura è indipendente dal master.', 'success')
        return
      }

      const manage = event.target.closest('[data-open-analysis-template-manager]')
      if (manage) {
        try {
          await openTemplateManager(editor, options, templates, (nextTemplates) => { templates = nextTemplates })
        } catch (error) {
          console.error('Apertura Template Manager non riuscita:', error)
          setTemplateMessage(editor, getDataAccessUserMessage(error, undefined, { stage: 'analysis-template-manager' }), 'error')
        }
      }
    })

    syncEditor(editor)
  }))
}
