export function wireTrainingLibraryEvents({
  root,
  getDataAccessUserMessage,
  appState,
  saveTrainingLibraryFeedback,
  updateCalendarEvent,
  loadCalendarEvents,
  setView,
}) {
  const libraryRoot = root.querySelector('[data-library-root]')
  const librarySearch = root.querySelector('[data-library-search]')
  const libraryMdFilter = root.querySelector('[data-library-md-filter]')
  const libraryFeedbackFilter = root.querySelector('[data-library-feedback-filter]')
  const libraryNoResults = root.querySelector('[data-library-no-results]')

  const applyTrainingLibraryFilters = () => {
    if (!libraryRoot) return
    const query = librarySearch?.value.trim().toLocaleLowerCase('it-IT') || ''
    const md = libraryMdFilter?.value || ''
    const feedback = libraryFeedbackFilter?.value || ''
    let visibleSheets = 0

    libraryRoot.querySelectorAll('[data-library-sheet]').forEach((card) => {
      const matchesQuery = !query || card.dataset.searchText.includes(query)
      const matchesMd = !md || card.dataset.libraryMd === md
      const matchesFeedback = !feedback || card.dataset.libraryFeedback === feedback
      const matches = matchesQuery && matchesMd && matchesFeedback
      card.hidden = !matches
      if (matches) visibleSheets += 1
    })

    libraryRoot.querySelectorAll('[data-library-week]').forEach((week) => {
      const hasVisibleSheets = Array.from(week.querySelectorAll('[data-library-sheet]')).some((card) => !card.hidden)
      week.hidden = !hasVisibleSheets
      if ((query || md || feedback) && hasVisibleSheets) week.open = true
    })

    libraryRoot.querySelectorAll('[data-library-month]').forEach((month) => {
      const hasVisibleWeeks = Array.from(month.querySelectorAll('[data-library-week]')).some((week) => !week.hidden)
      month.hidden = !hasVisibleWeeks
      if ((query || md || feedback) && hasVisibleWeeks) month.open = true
    })

    if (libraryNoResults) {
      libraryNoResults.hidden = visibleSheets > 0 || !(query || md || feedback)
    }
  }

  ;[librarySearch, libraryMdFilter, libraryFeedbackFilter].forEach((control) => {
    control?.addEventListener(control === librarySearch ? 'input' : 'change', applyTrainingLibraryFilters)
  })

  root.querySelectorAll('[data-library-feedback-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const editor = root.querySelector(`[data-library-feedback-editor="${button.dataset.libraryFeedbackOpen}"]`)
      if (!editor) return
      editor.hidden = false
      editor.querySelector('[data-library-feedback-notes]')?.focus()
    })
  })

  root.querySelectorAll('[data-library-feedback-cancel]').forEach((button) => {
    button.addEventListener('click', () => {
      const editor = root.querySelector(`[data-library-feedback-editor="${button.dataset.libraryFeedbackCancel}"]`)
      if (editor) editor.hidden = true
    })
  })

  root.querySelectorAll('[data-library-feedback-editor]').forEach((editor) => {
    editor.querySelectorAll('[data-feedback-value]').forEach((button) => {
      button.addEventListener('click', () => {
        editor.querySelectorAll('[data-feedback-value]').forEach((candidate) => {
          candidate.classList.toggle('is-selected', candidate === button)
        })
        editor.dataset.feedbackValue = button.dataset.feedbackValue || ''
      })
    })
  })

  root.querySelectorAll('[data-library-feedback-save]').forEach((button) => {
    button.addEventListener('click', async () => {
      const eventId = button.dataset.libraryFeedbackSave
      const editor = root.querySelector(`[data-library-feedback-editor="${eventId}"]`)
      const sourceEvent = appState.calendarEvents.find((event) => String(event.id) === String(eventId))
      if (!editor || !sourceEvent) return

      const message = editor.querySelector('[data-library-feedback-message]')
      const selectedButton = editor.querySelector('[data-feedback-value].is-selected')
      const trafficLight = editor.dataset.feedbackValue !== undefined
        ? editor.dataset.feedbackValue
        : (selectedButton?.dataset.feedbackValue || sourceEvent.libraryFeedback?.trafficLight || '')
      const notes = editor.querySelector('[data-library-feedback-notes]')?.value || ''

      button.disabled = true
      if (message) {
        message.textContent = 'Salvataggio…'
        message.className = 'library-feedback-message'
      }

      try {
        const saved = await saveTrainingLibraryFeedback({
          eventId,
          rawNotes: sourceEvent.rawNotes,
          feedback: { trafficLight, notes },
          updateEvent: updateCalendarEvent,
        })
        sourceEvent.rawNotes = saved.rawNotes
        sourceEvent.libraryFeedback = saved.feedback
        await loadCalendarEvents()
        await setView('library', 'Training Library')
      } catch (error) {
        console.error('Salvataggio feedback Training Library non riuscito:', error)
        if (message) {
          message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'training-library-feedback-save' })
          message.className = 'library-feedback-message is-error'
        }
        button.disabled = false
      }
    })
  })
}
