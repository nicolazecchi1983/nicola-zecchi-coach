import { getUserErrorMessage } from '../../../core/appError.js'
import { bindMatchAnalysisSchemaEditors } from './matchAnalysisSchemaView.js'

function setMessage(root, key, message, type = '') {
  const node = root.querySelector(`[data-study-message="${key}"]`)
  if (!node) return
  node.textContent = message || ''
  node.dataset.type = type
}

function setBusy(form, busy) {
  form.querySelectorAll('button, input, select, textarea').forEach((control) => {
    control.disabled = busy
  })
}

export function bindMatchOpponentStudy({ root, service, activeMatch, team, analysisTemplateOptions = {}, refresh }) {
  const section = root.querySelector('[data-opponent-study]')
  if (!section || !activeMatch?.id) return
  const matchId = String(activeMatch.id)
  bindMatchAnalysisSchemaEditors(section, analysisTemplateOptions)

  const closeOtherStudyForms = (activeKey) => {
    section.querySelectorAll('[data-study-collapsible]').forEach((node) => {
      if (node.dataset.studyCollapsible === activeKey) return
      node.hidden = true
    })
    section.querySelectorAll('[data-study-toggle-form]').forEach((node) => {
      if (node.dataset.studyToggleForm === activeKey) return
      node.setAttribute('aria-expanded', 'false')
    })
  }

  const setFormOpen = (key, open) => {
    if (open) closeOtherStudyForms(key)
    const form = section.querySelector(`[data-study-collapsible="${key}"]`)
    const toggle = section.querySelector(`[data-study-toggle-form="${key}"]`)
    if (!form) return
    form.hidden = !open
    toggle?.setAttribute('aria-expanded', String(open))
    if (open) form.querySelector('input, select, textarea')?.focus()
  }

  section.querySelectorAll('[data-study-toggle-form]').forEach((button) => {
    button.setAttribute('aria-expanded', 'false')
    button.addEventListener('click', () => setFormOpen(button.dataset.studyToggleForm, true))
  })
  section.querySelectorAll('[data-study-close-form]').forEach((button) => {
    button.addEventListener('click', () => setFormOpen(button.dataset.studyCloseForm, false))
  })

  section.querySelector('[data-study-notes-form]')?.addEventListener('analysis-schema-structure-change', async (event) => {
    const form = event.currentTarget
    const hidden = form.querySelector('[data-analysis-schema-value]')
    if (!hidden) return
    try {
      const technicalAnalysis = JSON.parse(String(hidden.value || '{}'))
      await service.saveTechnicalAnalysis(matchId, technicalAnalysis)
      setMessage(section, 'notes', 'Struttura salvata automaticamente.', 'success')
    } catch (error) {
      console.error('Salvataggio automatico struttura studio avversario non riuscito:', error)
      setMessage(section, 'notes', getUserErrorMessage(error, 'Salvataggio automatico non riuscito.'), 'error')
    }
  })

  section.querySelector('[data-study-notes-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setBusy(form, true)
    setMessage(section, 'notes', '')
    try {
      let technicalAnalysis = {}
      try { technicalAnalysis = JSON.parse(String(data.technical_analysis || '{}')) } catch { technicalAnalysis = {} }
      await service.saveTechnicalAnalysis(matchId, technicalAnalysis)
      setMessage(section, 'notes', 'Studio salvato.', 'success')
    } catch (error) {
      console.error('Salvataggio studio avversario non riuscito:', error)
      setMessage(section, 'notes', getUserErrorMessage(error, 'Salvataggio non riuscito.'), 'error')
    } finally {
      setBusy(form, false)
    }
  })

  section.querySelector('[data-study-link-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setBusy(form, true)
    setMessage(section, 'link', '')

    try {
      await service.addLink(matchId, data)
    } catch (error) {
      console.error('Salvataggio link studio avversario non riuscito:', error)
      setMessage(section, 'link', getUserErrorMessage(error, 'Link non salvato.'), 'error')
      setBusy(form, false)
      return
    }

    form.reset()
    try {
      await refresh()
    } catch (error) {
      console.error('Refresh Studio avversario dopo salvataggio link non riuscito:', error)
      setMessage(section, 'link', 'Link salvato. Aggiorna la pagina per visualizzarlo.', 'success')
    } finally {
      if (form.isConnected) setBusy(form, false)
    }
  })

  section.querySelectorAll('[data-study-upload-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const mode = form.dataset.studyUploadForm
      const file = form.elements.file?.files?.[0]
      const data = Object.fromEntries(new FormData(form).entries())
      setBusy(form, true)
      setMessage(section, mode, '')

      try {
        if (mode === 'report') {
          await service.uploadAsset({ matchId, team, file, kind: 'report', category: 'general' })
        } else {
          await service.uploadAsset({
            matchId,
            team,
            file,
            kind: data.kind || 'document',
            category: data.category || 'general',
          })
        }
      } catch (error) {
        console.error('Upload studio avversario non riuscito:', error)
        setMessage(section, mode, getUserErrorMessage(error, 'Caricamento non riuscito.'), 'error')
        setBusy(form, false)
        return
      }

      form.reset()
      try {
        await refresh()
      } catch (error) {
        console.error('Refresh Studio avversario dopo upload non riuscito:', error)
        setMessage(section, mode, 'Materiale salvato. Aggiorna la pagina per visualizzarlo.', 'success')
      } finally {
        if (form.isConnected) setBusy(form, false)
      }
    })
  })

  section.addEventListener('click', async (event) => {
    const open = event.target.closest('[data-open-study-asset]')
    if (open) {
      open.disabled = true
      try {
        const url = await service.getAssetUrl(open.dataset.openStudyAsset)
        if (!url) throw new Error('URL documento non disponibile.')
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (error) {
        console.error('Apertura materiale Match non riuscita:', error)
        window.alert(getUserErrorMessage(error, 'Non è stato possibile aprire il materiale.'))
      } finally {
        open.disabled = false
      }
      return
    }

    const removeAsset = event.target.closest('[data-remove-study-asset]')
    if (removeAsset) {
      if (!window.confirm('Rimuovere questo materiale dallo studio avversario?')) return
      removeAsset.disabled = true
      try {
        await service.removeAsset(matchId, removeAsset.dataset.removeStudyAsset, {
          primary: removeAsset.dataset.primaryReport === 'true',
        })
        await refresh()
      } catch (error) {
        console.error('Rimozione materiale Match non riuscita:', error)
        window.alert(getUserErrorMessage(error, 'Rimozione non riuscita.'))
        removeAsset.disabled = false
      }
      return
    }

    const removeLink = event.target.closest('[data-remove-study-link]')
    if (removeLink) {
      service.removeLink(matchId, removeLink.dataset.removeStudyLink)
      await refresh()
    }
  })
}
