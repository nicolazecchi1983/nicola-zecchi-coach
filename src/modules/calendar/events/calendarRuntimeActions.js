export function createCalendarRuntimeActions({
  root, drawerRoot, modalRoot, documentViewer, appState,
  can, capabilities, showAccessNotice, isTrainingEventType,
  teamLocationSelectOptions, isConfiguredTeamFacility,
  createMatchCalendarService, createCalendarEvent, updateCalendarEvent,
  createSeasonCalendarImportService, loadCalendarEvents, getTeamProfile,
  findOfficialSeasonCalendar, renderSeasonCalendarImportModal, escapeHtml,
  parseSeasonCalendarCsv, createCalendarBulkManagementService, deleteCalendarEvents,
  renderCalendarBulkManagementModal, calendarView, bindDynamic,
  newEventModalHtml, editEventModalHtml, buildEventTitle, deleteCalendarEvent,
  supabase, drawerHtml, requirePublishedDocumentView, trainingSheetName,
  closeDrawer, closeNewEventModal, setActiveNavigation, setView,
  getDataAccessUserMessage,
  alertUser = window.alert, confirmUser = window.confirm, documentRef = document,
  FormDataCtor = FormData, storage = localStorage,
}) {
  function bindEventTypeFields(form) {
    const typeSelect = form?.querySelector('[name="eventType"]')
    const trainingSheetInfo = form?.querySelector('[data-training-sheet-info]')
    const mdField = form?.querySelector('[data-md-field]')
    const mdSelect = form?.querySelector('[name="matchDay"]')
    const matchFields = form?.querySelector('[data-match-fields]')
    const matchTypeSelect = form?.querySelector('[name="matchType"]')
    const opponentInput = form?.querySelector('[name="opponent"]')
    const locationSelect = form?.querySelector('[name="location"]')
    const locationSelectField = form?.querySelector('[data-location-select-field]')
    const customLocationField = form?.querySelector('[data-custom-location]')
    const customLocationLabel = form?.querySelector('[data-custom-location-label]')
    const customLocationInput = form?.querySelector('[name="customLocation"]')
    const standardFields = form?.querySelector('[data-standard-event-fields]')
    const restFields = form?.querySelector('[data-rest-fields]')

    if (!typeSelect) return

    const refreshLocation = () => {
      const isTraining = isTrainingEventType(typeSelect.value)
      const isRest = typeSelect.value === 'rest'
      const usesFreeVenue = !isTraining && !isRest
      const isCustomTraining = isTraining && locationSelect?.value === '__custom__'

      if (locationSelectField) locationSelectField.hidden = usesFreeVenue || isRest
      if (customLocationField) customLocationField.hidden = !(usesFreeVenue || isCustomTraining)
      if (customLocationLabel) {
        customLocationLabel.textContent = usesFreeVenue
          ? 'Campo / impianto (facoltativo)'
          : 'Nome campo / impianto'
      }
      if (customLocationInput) {
        customLocationInput.required = Boolean(isCustomTraining)
        if (isRest) customLocationInput.value = ''
      }
      if (locationSelect) locationSelect.required = Boolean(isTraining)
    }

    let previousEventType = null
    const refreshLocationOptions = () => {
      if (!locationSelect || previousEventType === typeSelect.value) return
      const currentChoice = String(locationSelect.value || '').trim()
      const currentLocation = currentChoice === '__custom__'
        ? String(customLocationInput?.value || '').trim()
        : currentChoice
      const isTraining = isTrainingEventType(typeSelect.value)
      const isRest = typeSelect.value === 'rest'

      if (isTraining) {
        locationSelect.innerHTML = teamLocationSelectOptions(currentLocation)
        if (currentLocation && !isConfiguredTeamFacility(currentLocation) && customLocationInput) {
          customLocationInput.value = currentLocation
        }
      } else if (!isRest) {
        if (currentLocation && customLocationInput && !customLocationInput.value.trim()) {
          customLocationInput.value = currentLocation
        }
        locationSelect.innerHTML = '<option value="__custom__">Inserisci luogo…</option>'
        locationSelect.value = '__custom__'
      }
      previousEventType = typeSelect.value
    }

    const refresh = () => {
      const isRest = typeSelect.value === 'rest'
      if (standardFields) standardFields.hidden = isRest
      if (restFields) restFields.hidden = !isRest
      const showTrainingSheet = isTrainingEventType(typeSelect.value)
      refreshLocationOptions()
      // Structural contract: changing event type may replace the location options.
      // Re-evaluate the custom-location field immediately so Match/Meeting can
      // accept a free-text venue on both desktop and mobile.
      refreshLocation()
      if (trainingSheetInfo) trainingSheetInfo.hidden = !showTrainingSheet
      if (mdField) mdField.hidden = !showTrainingSheet
      const showMatchType = typeSelect.value === 'match'
      if (matchFields) matchFields.hidden = !showMatchType
      if (!showMatchType && matchTypeSelect) matchTypeSelect.value = 'friendly'
      if (!showMatchType && opponentInput) {
        opponentInput.value = ''
      } else if (showMatchType && opponentInput && !opponentInput.value.trim()) {
        opponentInput.value = 'Da definire'
      }

      if (!showTrainingSheet && mdSelect) {
        mdSelect.value = ''
      }
      if (customLocationInput && isRest) customLocationInput.required = false
    }

    typeSelect.addEventListener('change', refresh)
    locationSelect?.addEventListener('change', refreshLocation)

    opponentInput?.addEventListener('focus', () => {
      if (opponentInput.value.trim().toLocaleLowerCase('it-IT') === 'da definire') {
        opponentInput.value = ''
      }
    })

    refresh()
    refreshLocation()
  }

  function closeSeasonCalendarImport() {
    if (modalRoot) modalRoot.innerHTML = ''
    documentRef.body.classList.remove('new-event-modal-open')
  }

  function openSeasonCalendarImport(rows = [], sourceMode = '') {
    if (!can(capabilities.CALENDAR_CREATE) || !modalRoot) return
    const matchCalendarService = createMatchCalendarService({
      createEvent: createCalendarEvent,
      updateEvent: updateCalendarEvent,
      reloadEvents: null,
    })
    const importService = createSeasonCalendarImportService({
      createMatch: (row) => matchCalendarService.createMatch(row),
      reloadEvents: loadCalendarEvents,
    })
    const team = getTeamProfile()
    const officialSource = findOfficialSeasonCalendar(team)
    const preview = importService.preview(rows, appState.calendarEvents)
    modalRoot.innerHTML = renderSeasonCalendarImportModal({
      rows: preview.rows,
      team,
      officialSource,
      sourceMode,
      escapeHtml,
    })
    documentRef.body.classList.add('new-event-modal-open')

    modalRoot.querySelectorAll('[data-close-season-import]').forEach((node) => node.addEventListener('click', (event) => {
      if (node.classList.contains('season-import-backdrop') && event.target !== node) return
      closeSeasonCalendarImport()
    }))

    modalRoot.querySelector('[data-use-official-season-calendar]')?.addEventListener('click', () => {
      if (!officialSource?.rows?.length) return
      openSeasonCalendarImport(officialSource.rows, 'official')
    })

    modalRoot.querySelector('[data-season-import-file]')?.addEventListener('change', async (event) => {
      const file = event.currentTarget.files?.[0]
      if (!file) return
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
      if (!isCsv) {
        alertUser(officialSource
          ? 'Questo calendario ufficiale è già riconosciuto da STAFF: usa “Prepara anteprima calendario ufficiale”.'
          : 'PDF/immagine non ancora riconosciuti automaticamente. Usa un CSV oppure una fonte ufficiale disponibile.')
        event.currentTarget.value = ''
        return
      }
      const parsedRows = parseSeasonCalendarCsv(await file.text())
      if (!parsedRows.length) {
        alertUser('Il file non contiene righe importabili.')
        return
      }
      openSeasonCalendarImport(parsedRows)
    })

    modalRoot.querySelector('[data-season-import-reset]')?.addEventListener('click', () => openSeasonCalendarImport())

    modalRoot.querySelector('[data-season-import-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const message = event.currentTarget.querySelector('[data-season-import-message]')
      const submit = event.currentTarget.querySelector('button[type="submit"]')
      const editedRows = [...event.currentTarget.querySelectorAll('[data-season-import-row]')].map((tr) => ({
        matchDay: tr.querySelector('[name="matchDay"]')?.value,
        date: tr.querySelector('[name="date"]')?.value,
        time: tr.querySelector('[name="time"]')?.value,
        opponent: tr.querySelector('[name="opponent"]')?.value,
        homeAway: tr.querySelector('[name="homeAway"]')?.value,
        competition: tr.querySelector('[name="competition"]')?.value,
      }))
      submit.disabled = true
      if (message) message.textContent = 'Importazione…'
      try {
        const result = await importService.commit(editedRows, appState.calendarEvents)
        closeSeasonCalendarImport()
        root.innerHTML = calendarView()
        bindDynamic()
        alertUser(`Importazione completata: ${result.created.length} nuove partite, ${result.skipped.length} già presenti.`)
      } catch (error) {
        if (message) message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'calendar-season-import' })
        submit.disabled = false
      }
    })
  }

  function closeCalendarBulkManagement() {
    if (modalRoot) modalRoot.innerHTML = ''
    documentRef.body.classList.remove('new-event-modal-open')
  }

  function readCalendarBulkCriteria(form) {
    const data = new FormDataCtor(form)
    return {
      mode: String(data.get('mode') || 'range'),
      from: String(data.get('from') || ''),
      to: String(data.get('to') || ''),
      type: String(data.get('type') || 'training'),
      competition: String(data.get('competition') || 'league'),
    }
  }

  function openCalendarBulkManagement(criteria = { mode: 'range' }) {
    if (!can(capabilities.CALENDAR_DELETE) || !modalRoot) {
      showAccessNotice('Non hai i permessi per eliminare eventi.')
      return
    }

    const service = createCalendarBulkManagementService({
      deleteEvents: deleteCalendarEvents,
      reloadEvents: loadCalendarEvents,
    })
    const preview = service.preview(appState.calendarEvents, criteria)

    modalRoot.innerHTML = renderCalendarBulkManagementModal({
      preview,
      criteria,
      escapeHtml,
    })
    documentRef.body.classList.add('new-event-modal-open')

    const form = modalRoot.querySelector('[data-calendar-bulk-form]')
    const mode = form?.querySelector('[data-calendar-bulk-mode]')

    const refreshConditionalFields = () => {
      const value = mode?.value || 'range'
      form?.querySelector('[data-calendar-bulk-range]')?.toggleAttribute('hidden', value !== 'range')
      form?.querySelector('[data-calendar-bulk-type]')?.toggleAttribute('hidden', value !== 'type')
      form?.querySelector('[data-calendar-bulk-competition]')?.toggleAttribute('hidden', value !== 'competition')
    }

    const refreshPreview = () => {
      if (!form) return
      openCalendarBulkManagement(readCalendarBulkCriteria(form))
    }

    modalRoot.querySelectorAll('[data-close-calendar-bulk]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (node.classList.contains('calendar-bulk-backdrop') && event.target !== node) return
        closeCalendarBulkManagement()
      })
    })

    mode?.addEventListener('change', refreshPreview)
    form?.querySelectorAll('input[type="date"], select[name="type"], select[name="competition"]').forEach((control) => {
      control.addEventListener('change', refreshPreview)
    })
    refreshConditionalFields()

    form?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const criteriaNow = readCalendarBulkCriteria(form)
      const previewNow = service.preview(appState.calendarEvents, criteriaNow)
      const message = form.querySelector('[data-calendar-bulk-message]')
      const submit = form.querySelector('[data-calendar-bulk-delete]')
      const confirmed = form.elements.confirm?.checked === true

      if (!confirmed) {
        if (message) message.textContent = 'Spunta la conferma prima di eliminare.'
        return
      }
      if (!previewNow.deletableEvents.length) {
        if (message) message.textContent = 'Non ci sono eventi eliminabili con questi criteri.'
        return
      }

      const question = `Eliminare definitivamente ${previewNow.deletableEvents.length} eventi? ${previewNow.protectedEvents.length ? `${previewNow.protectedEvents.length} eventi protetti resteranno nel Calendario.` : ''}`
      if (!confirmUser(question)) return

      submit.disabled = true
      if (message) message.textContent = 'Eliminazione…'

      try {
        const result = await service.commit(appState.calendarEvents, criteriaNow)
        closeCalendarBulkManagement()
        root.innerHTML = calendarView()
        bindDynamic()
        alertUser(`Operazione completata: ${result.deleted} eventi eliminati${result.protectedEvents.length ? `, ${result.protectedEvents.length} protetti e mantenuti` : ''}.`)
      } catch (error) {
        console.error('Eliminazione massiva Calendario non riuscita:', error)
        if (message) message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'calendar-bulk-delete' })
        submit.disabled = false
      }
    })
  }

  function enableDateTimePickers(form) {
    form?.querySelectorAll('input[type="date"], input[type="time"]').forEach((input) => {
      input.readOnly = false
      input.disabled = false
      input.addEventListener('click', () => {
        if (typeof input.showPicker === 'function') {
          try { input.showPicker() } catch (_) {}
        }
      })
    })
  }

  function openNewEventModal(selectedDate) {
    if (!can(capabilities.CALENDAR_CREATE)) { showAccessNotice(); return }
    if (!modalRoot) {
      return
    }

    modalRoot.innerHTML = newEventModalHtml(selectedDate)
    documentRef.body.classList.add('new-event-modal-open')

    const backdrop = modalRoot.querySelector(
      '.new-event-modal-backdrop',
    )
    const form = modalRoot.querySelector('#newEventForm')
    const message = modalRoot.querySelector('#newEventMessage')
    const saveButton = modalRoot.querySelector(
      '#saveNewEventButton',
    )

    bindEventTypeFields(form)
    enableDateTimePickers(form)

    modalRoot
      .querySelectorAll('[data-close-new-event]')
      .forEach((element) => {
        element.addEventListener('click', (event) => {
          if (
            element === backdrop &&
            event.target !== backdrop
          ) {
            return
          }

          closeNewEventModal()
        })
      })

    form?.addEventListener('submit', async (event) => {
      event.preventDefault()

      const formData = new FormDataCtor(form)
      const eventType = String(
        formData.get('eventType') ?? 'training',
      )
      const date = formData.get('date')
      const time = formData.get('time')
      const locationChoice = String(formData.get('location') ?? '').trim()
      const customLocation = String(formData.get('customLocation') ?? '').trim()
      const location = eventType === 'rest' ? '' : (locationChoice === '__custom__' ? customLocation : locationChoice)
      const matchType = eventType === 'match' ? String(formData.get('matchType') || 'friendly') : null
      const opponent = eventType === 'match' ? String(formData.get('opponent') || '').trim() : ''
      const matchDay = isTrainingEventType(eventType)
        ? String(formData.get('matchDay') ?? '').trim() || null
        : null
      const presentCount = null
      const squadTotal = null
      const restNote = eventType === 'rest' ? String(formData.get('restNote') || '').trim() : ''

      if (eventType === 'match' && !opponent) {
        message.textContent = 'Inserisci il nome della squadra avversaria.'
        return
      }

      if (!date || !time || (isTrainingEventType(eventType) && !location)) {
        message.textContent = !date || !time
          ? 'Inserisci data e ora.'
          : 'Seleziona il campo dell’allenamento.'
        return
      }

      saveButton.disabled = true
      saveButton.textContent = 'Salvataggio...'
      message.textContent = ''

      const eventTitle = buildEventTitle(eventType, matchType, opponent)

      const startAt = new Date(
        `${date}T${time}:00`,
      ).toISOString()

      let insertError = null
      try {
        await createCalendarEvent({
          title: eventTitle,
          event_type: eventType,
          start_at: startAt,
          location: location || null,
          match_day: matchDay,
          present_count: presentCount,
          squad_total: squadTotal,
          training_sheet_path: null,
          notes: eventType === 'rest' ? JSON.stringify({ type: 'rest_event', rest_note: restNote }) : null,
        })
      } catch (error) {
        insertError = error
      }

      if (insertError) {
        message.textContent = getDataAccessUserMessage(insertError, undefined, { stage: 'calendar-event-create' })
        saveButton.disabled = false
        saveButton.textContent = 'Salva evento'
        return
      }

      closeNewEventModal()
      await loadCalendarEvents()
      root.innerHTML = calendarView()
      bindDynamic()
    })
  }

  function openEditEventModal(eventId) {
    if (!can(capabilities.CALENDAR_UPDATE)) { showAccessNotice(); return }
    const currentEvent = appState.calendarEvents.find(
      (item) => String(item.id) === String(eventId),
    )

    if (!currentEvent || !modalRoot) {
      return
    }

    modalRoot.innerHTML = editEventModalHtml(currentEvent)
    documentRef.body.classList.add('new-event-modal-open')

    const backdrop = modalRoot.querySelector(
      '.new-event-modal-backdrop',
    )
    const form = modalRoot.querySelector('#editEventForm')
    const message = modalRoot.querySelector('#newEventMessage')
    const saveButton = modalRoot.querySelector(
      '#saveNewEventButton',
    )

    bindEventTypeFields(form)
    enableDateTimePickers(form)

    modalRoot
      .querySelectorAll('[data-close-new-event]')
      .forEach((element) => {
        element.addEventListener('click', (clickEvent) => {
          if (
            element === backdrop &&
            clickEvent.target !== backdrop
          ) {
            return
          }

          closeNewEventModal()
        })
      })

    form?.addEventListener('submit', async (submitEvent) => {
      submitEvent.preventDefault()

      const formData = new FormDataCtor(form)
      const eventType = String(
        formData.get('eventType') ?? 'training',
      )
      const date = formData.get('date')
      const time = formData.get('time')
      const locationChoice = String(formData.get('location') ?? '').trim()
      const customLocation = String(formData.get('customLocation') ?? '').trim()
      const location = eventType === 'rest' ? '' : (locationChoice === '__custom__' ? customLocation : locationChoice)
      const matchType = eventType === 'match' ? String(formData.get('matchType') || 'friendly') : null
      const opponent = eventType === 'match' ? String(formData.get('opponent') || '').trim() : ''
      const matchDay = isTrainingEventType(eventType)
        ? String(formData.get('matchDay') ?? '').trim() || null
        : null
      const presentCount = null
      const squadTotal = null
      const restNote = eventType === 'rest' ? String(formData.get('restNote') || '').trim() : ''

      if (eventType === 'match' && !opponent) {
        message.textContent = 'Inserisci il nome della squadra avversaria.'
        return
      }

      if (!date || !time || (isTrainingEventType(eventType) && !location)) {
        message.textContent = !date || !time
          ? 'Inserisci data e ora.'
          : 'Seleziona il campo dell’allenamento.'
        return
      }

      saveButton.disabled = true
      saveButton.textContent = 'Salvataggio...'
      message.textContent = ''

      const eventTitle = buildEventTitle(eventType, matchType, opponent)

      if (
        currentEvent.trainingSheetPath &&
        isTrainingEventType(currentEvent.type) &&
        !isTrainingEventType(eventType)
      ) {
        message.textContent = 'Questo allenamento ha una Training Sheet pubblicata. Mantieni il tipo Allenamento e gestisci la scheda dal TS Editor.'
        saveButton.disabled = false
        saveButton.textContent = 'Salva modifiche'
        return
      }

      const nextFilePath = isTrainingEventType(eventType)
        ? currentEvent.trainingSheetPath
        : null

      const startAt = new Date(
        `${date}T${time}:00`,
      ).toISOString()

      let updateError = null
      try {
        await updateCalendarEvent(currentEvent.id, {
          title: eventTitle,
          event_type: eventType,
          start_at: startAt,
          location: location || null,
          match_day: matchDay,
          present_count: presentCount,
          squad_total: squadTotal,
          training_sheet_path: nextFilePath,
          notes: eventType === 'rest'
            ? JSON.stringify({ type: 'rest_event', rest_note: restNote })
            : (isTrainingEventType(eventType) ? currentEvent.rawNotes : null),
        })
      } catch (error) {
        updateError = error
      }

      if (updateError) {
        message.textContent = getDataAccessUserMessage(updateError, undefined, { stage: 'calendar-event-update' })
        saveButton.disabled = false
        saveButton.textContent = 'Salva modifiche'
        return
      }

      closeNewEventModal()
      await loadCalendarEvents()
      root.innerHTML = calendarView()
      bindDynamic()
    })
  }

  async function deleteEvent(eventId) {
    if (!can(capabilities.CALENDAR_DELETE)) { showAccessNotice(); return }
    const currentEvent = appState.calendarEvents.find(
      (item) => String(item.id) === String(eventId),
    )

    if (!currentEvent) {
      return
    }

    const linkedTrainingSheetWarning = currentEvent.trainingSheetPath
      ? ' La Training Sheet collegata verrà eliminata definitivamente.'
      : ''
    const confirmed = confirmUser(
      `Eliminare "${currentEvent.title}" del ${new Date(
        currentEvent.startAt,
      ).toLocaleDateString('it-IT')}?${linkedTrainingSheetWarning}`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteCalendarEvent(currentEvent.id)
    } catch (deleteError) {
      alertUser(getDataAccessUserMessage(deleteError, undefined, { stage: 'calendar-event-delete' }))
      return
    }

    if (currentEvent.trainingSheetPath) {
      await supabase.storage
        .from('training-sheets')
        .remove([currentEvent.trainingSheetPath])
    }

    closeDrawer()
    await loadCalendarEvents()
    root.innerHTML = calendarView()
    bindDynamic()
  }

  function openDrawer(eventId) {
    const event = appState.calendarEvents.find(
      (item) => String(item.id) === String(eventId),
    )

    if (!event) {
      return
    }

    drawerRoot.innerHTML = drawerHtml(event)

    documentRef.body.classList.add('drawer-open')

    drawerRoot
      .querySelectorAll('[data-close-drawer]')
      .forEach((element) => {
        element.addEventListener('click', closeDrawer)
      })

    drawerRoot
      .querySelector('[data-edit-event]')
      ?.addEventListener('click', () => {
        closeDrawer()
        openEditEventModal(event.id)
      })

    drawerRoot
      .querySelector('[data-delete-event]')
      ?.addEventListener('click', async () => {
        await deleteEvent(event.id)
      })

    drawerRoot
      .querySelector('[data-view-training-sheet]')
      ?.addEventListener('click', () => {
        try {
          requirePublishedDocumentView()
          documentViewer.open({
            title: trainingSheetName(event),
            url: event.trainingSheetUrl,
            downloadUrl: event.trainingSheetUrl,
            mimeType: String(event.trainingSheetPath || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : '',
          })
        } catch (error) {
          showAccessNotice(getDataAccessUserMessage(error, undefined, { stage: 'calendar-document-open' }))
        }
      })

    drawerRoot
      .querySelector('[data-open-training-sheet-editor]')
      ?.addEventListener('click', async () => {
        if (event.editorData) {
          storage.setItem('nz-training-sheet-editor-v6-2', JSON.stringify(event.editorData))
        }
        storage.setItem('nz-training-sheet-open-event-id', event.id)
        storage.setItem('nz-active-section', 'training-sheet')
        closeDrawer()
        setActiveNavigation('training-sheet')
        await setView('training-sheet', 'Training Sheet Editor')
      })
  }

  return {
    openDrawer,
    openSeasonCalendarImport,
    openCalendarBulkManagement,
    openNewEventModal,
  }
}
