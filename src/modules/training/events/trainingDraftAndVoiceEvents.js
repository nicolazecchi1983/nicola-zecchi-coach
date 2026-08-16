export async function wireTrainingDraftAndVoiceEvents({
  root,
  getDataAccessUserMessage,
  appState,
  supabase,
  trainingSheetResultHtml,
  parseTrainingSheetNarration,
  activePlayers,
  windowRef = globalThis.window,
  EventCtor = globalThis.Event,
  FormDataCtor = globalThis.FormData,
}) {
    const tsNarration = root.querySelector('[data-ts-narration]')
    const tsRecordButton = root.querySelector('[data-ts-record]')
    const tsStopButton = root.querySelector('[data-ts-stop]')
    const tsRecordLabel = root.querySelector('[data-ts-record-label]')
    const tsVoiceStatus = root.querySelector('[data-ts-voice-status]')
    const tsVoiceHelp = root.querySelector('[data-ts-voice-help]')
    const tsForm = root.querySelector('[data-ts-form]')
    const tsEmpty = root.querySelector('[data-ts-empty]')
    const tsStatus = root.querySelector('[data-ts-status]')
    const tsMessage = root.querySelector('[data-ts-message]')
    let tsDraftId = null
    let tsAutosaveTimer = null
    let tsSaving = false
    let tsSaveQueued = false
    let tsRecognition = null
    let tsRecognitionActive = false
    let tsRecognitionShouldRestart = false
    let tsRecognitionBaseText = ''
    let tsRecognitionFinalText = ''

    const SpeechRecognitionApi = windowRef.SpeechRecognition || windowRef.webkitSpeechRecognition

    const setTsVoiceState = (state, text) => {
      if (tsVoiceStatus) {
        tsVoiceStatus.textContent = text
        tsVoiceStatus.className = `ts-voice-status is-${state}`
      }
      if (tsRecordButton) {
        tsRecordButton.classList.toggle('is-recording', state === 'recording')
        tsRecordButton.disabled = state === 'unsupported' || state === 'starting'
      }
      if (tsStopButton) tsStopButton.disabled = state !== 'recording' && state !== 'starting'
      if (tsRecordLabel) tsRecordLabel.textContent = state === 'recording' ? 'In ascolto…' : 'Registra'
    }

    const normalizeTsSpeechText = (value = '') => String(value)
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()

    const joinTsSpeechText = (...parts) => parts
      .map(part => normalizeTsSpeechText(part))
      .filter(Boolean)
      .join(' ')
      .trim()

    const stopTsRecognition = () => {
      tsRecognitionShouldRestart = false
      if (tsRecognition && tsRecognitionActive) {
        try { tsRecognition.stop() } catch (error) { console.warn('Arresto microfono non riuscito:', error) }
      } else {
        tsRecognitionActive = false
        setTsVoiceState(SpeechRecognitionApi ? 'ready' : 'unsupported', SpeechRecognitionApi ? 'Microfono pronto' : 'Dettatura non supportata')
      }
    }

    const createTsRecognition = () => {
      if (!SpeechRecognitionApi || tsRecognition) return tsRecognition

      const recognition = new SpeechRecognitionApi()
      recognition.lang = 'it-IT'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        tsRecognitionActive = true
        setTsVoiceState('recording', 'Registrazione in corso')
        if (tsVoiceHelp) tsVoiceHelp.textContent = 'Parla normalmente. Il testo compare mentre detti.'
      }

      recognition.onresult = (event) => {
        let interimText = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0]?.transcript || ''
          if (event.results[index].isFinal) tsRecognitionFinalText = joinTsSpeechText(tsRecognitionFinalText, transcript)
          else interimText = joinTsSpeechText(interimText, transcript)
        }
        if (tsNarration) {
          tsNarration.value = joinTsSpeechText(tsRecognitionBaseText, tsRecognitionFinalText, interimText)
          tsNarration.dispatchEvent(new EventCtor('input', { bubbles: true }))
          tsNarration.scrollTop = tsNarration.scrollHeight
        }
      }

      recognition.onerror = (event) => {
        const messages = {
          'not-allowed': 'Permesso microfono negato. Abilitalo nelle impostazioni del sito.',
          'service-not-allowed': 'Servizio di dettatura non disponibile nel browser.',
          'audio-capture': 'Microfono non trovato o non disponibile.',
          'no-speech': 'Non ho rilevato la voce. Premi Registra e riprova.',
          network: 'Connessione necessaria per la dettatura del browser.',
          aborted: 'Registrazione interrotta.',
        }
        const message = messages[event.error] || `Errore microfono: ${event.error}`
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          tsRecognitionShouldRestart = false
        }
        setTsVoiceState('error', message)
      }

      recognition.onend = () => {
        tsRecognitionActive = false
        if (tsRecognitionShouldRestart) {
          windowRef.setTimeout(() => {
            if (!tsRecognitionShouldRestart) return
            try { recognition.start() } catch (error) {
              tsRecognitionShouldRestart = false
              setTsVoiceState('error', 'Impossibile riavviare il microfono. Premi Registra.')
            }
          }, 250)
          return
        }
        tsRecognitionBaseText = joinTsSpeechText(tsRecognitionBaseText, tsRecognitionFinalText)
        tsRecognitionFinalText = ''
        setTsVoiceState('ready', tsNarration?.value.trim() ? 'Trascrizione pronta' : 'Microfono pronto')
        if (tsVoiceHelp) tsVoiceHelp.textContent = 'Puoi correggere il testo e poi premere “Analizza seduta”.'
      }

      tsRecognition = recognition
      return recognition
    }

    if (!SpeechRecognitionApi) {
      setTsVoiceState('unsupported', 'Dettatura non supportata da questo browser')
      if (tsVoiceHelp) tsVoiceHelp.textContent = 'Apri il Coach Portal con Google Chrome o Microsoft Edge aggiornato.'
    } else {
      setTsVoiceState('ready', 'Microfono pronto')
    }

    tsRecordButton?.addEventListener('click', () => {
      if (!SpeechRecognitionApi || tsRecognitionActive) return
      const recognition = createTsRecognition()
      tsRecognitionBaseText = tsNarration?.value.trim() || ''
      tsRecognitionFinalText = ''
      tsRecognitionShouldRestart = true
      setTsVoiceState('starting', 'Attivazione microfono…')
      try {
        recognition.start()
      } catch (error) {
        tsRecognitionShouldRestart = false
        setTsVoiceState('error', 'Microfono già attivo o momentaneamente non disponibile.')
      }
    })

    tsStopButton?.addEventListener('click', stopTsRecognition)

    const setTsSaveState = (state, text) => {
      const saveMessage = tsForm?.querySelector('[data-ts-save-message]')
      const saveRow = tsForm?.querySelector('.ts-autosave-row')
      if (!saveMessage || !saveRow) return
      saveMessage.textContent = text
      saveRow.className = `ts-autosave-row is-${state}`
    }

    const buildTsPayload = () => {
      if (!tsForm?.dataset.parserResult) return null
      const formData = new FormDataCtor(tsForm)
      const original = JSON.parse(tsForm.dataset.parserResult)
      const payloadData = {
        ...original.data,
        date: formData.get('date') || null,
        time: formData.get('time') || null,
        location: String(formData.get('location') || '').trim() || null,
        focus_physical: String(formData.get('focus_physical') || '').trim() || null,
        intensity: Number(formData.get('intensity')) || null,
        volume: Number(formData.get('volume')) || null,
        objective: String(formData.get('objective') || '').trim(),
        principles: String(formData.get('principles') || '').split('·').map(v => v.trim()).filter(Boolean),
        phases: original.data.phases.map((phase, index) => ({
          ...phase,
          title: String(formData.get(`phase_${index}_title`) || '').trim(),
          duration_minutes: Number(formData.get(`phase_${index}_duration`)) || null,
          goalkeepers: formData.get(`phase_${index}_goalkeepers`) === 'true',
          description: String(formData.get(`phase_${index}_description`) || '').trim(),
          containers: String(formData.get(`phase_${index}_containers`) || '').split('·').map(v => v.trim()).filter(Boolean),
        })),
      }
      payloadData.total_duration_minutes = payloadData.phases.reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0)
      return payloadData
    }

    const saveTsDraft = async () => {
      if (!tsForm || tsForm.hidden || !appState.currentUser || !tsNarration?.value.trim()) return
      if (tsSaving) {
        tsSaveQueued = true
        return
      }

      const payloadData = buildTsPayload()
      if (!payloadData) return

      tsSaving = true
      setTsSaveState('saving', 'Salvataggio automatico in corso…')

      const row = {
        user_id: appState.currentUser.id,
        source_text: tsNarration.value.trim(),
        status: 'draft',
        session_date: payloadData.date,
        session_time: payloadData.time,
        location: payloadData.location,
        parsed_data: payloadData,
        updated_at: new Date().toISOString(),
      }

      let response
      if (tsDraftId) {
        response = await supabase
          .from('training_sheet_drafts')
          .update(row)
          .eq('id', tsDraftId)
          .eq('user_id', appState.currentUser.id)
          .select('id')
          .single()
      } else {
        response = await supabase
          .from('training_sheet_drafts')
          .insert(row)
          .select('id')
          .single()
      }

      tsSaving = false
      if (response.error) {
        setTsSaveState('error', getDataAccessUserMessage(response.error, undefined, { stage: 'training-draft-save' }))
      } else {
        tsDraftId = response.data?.id || tsDraftId
        setTsSaveState('saved', 'Bozza salvata automaticamente.')
      }

      if (tsSaveQueued) {
        tsSaveQueued = false
        await saveTsDraft()
      }
    }

    const scheduleTsAutosave = () => {
      windowRef.clearTimeout(tsAutosaveTimer)
      setTsSaveState('pending', 'Modifiche da sincronizzare…')
      tsAutosaveTimer = windowRef.setTimeout(saveTsDraft, 700)
    }

    const attachTsFieldAutosave = () => {
      tsForm?.querySelectorAll('input, textarea, select').forEach((field) => {
        field.addEventListener('input', scheduleTsAutosave)
        field.addEventListener('change', scheduleTsAutosave)
      })
    }

    const restoreLatestTsDraft = async () => {
      if (!appState.currentUser?.id || !tsNarration || !tsForm || !tsEmpty || !tsStatus) return

      const { data, error } = await supabase
        .from('training_sheet_drafts')
        .select('id, source_text, parsed_data, status, updated_at')
        .eq('user_id', appState.currentUser.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('Impossibile ripristinare la bozza Training Sheet:', error.message)
        return
      }

      if (!data?.parsed_data) return

      const parsed = data.parsed_data
      const missingFields = []
      if (!parsed.date) missingFields.push('Data')
      if (!parsed.time) missingFields.push('Orario')
      if (!parsed.location) missingFields.push('Campo')
      if (!Array.isArray(parsed.phases) || parsed.phases.length === 0) missingFields.push('Fasi')
      if (!parsed.focus_physical) missingFields.push('Focus fisico')
      if (!parsed.intensity) missingFields.push('Intensità')
      if (!parsed.volume) missingFields.push('Volume')

      const result = {
        data: parsed,
        missing_fields: missingFields,
        status: missingFields.length ? 'da_completare' : 'pronta',
      }

      tsDraftId = data.id
      tsNarration.value = data.source_text || ''
      tsEmpty.hidden = true
      tsForm.hidden = false
      tsForm.innerHTML = trainingSheetResultHtml(result)
      tsForm.dataset.parserResult = JSON.stringify(result)
      tsStatus.textContent = missingFields.length ? 'Da completare' : 'Pronta'
      tsStatus.className = `ts-status ${missingFields.length ? 'is-warning' : 'is-ready'}`
      attachTsFieldAutosave()
      setTsSaveState('saved', 'Bozza ripristinata e salvata automaticamente.')
      if (tsMessage) {
        tsMessage.textContent = 'Ultima bozza ripristinata.'
        tsMessage.className = 'form-message is-success'
      }
    }

    root.querySelector('[data-ts-clear]')?.addEventListener('click', () => {
      stopTsRecognition()
      windowRef.clearTimeout(tsAutosaveTimer)
      tsRecognitionBaseText = ''
      tsRecognitionFinalText = ''
      tsDraftId = null
      if (tsNarration) tsNarration.value = ''
      if (tsForm) { tsForm.hidden = true; tsForm.innerHTML = ''; delete tsForm.dataset.parserResult }
      if (tsEmpty) tsEmpty.hidden = false
      if (tsStatus) { tsStatus.textContent = 'In attesa'; tsStatus.className = 'ts-status is-empty' }
      if (tsMessage) { tsMessage.textContent = ''; tsMessage.className = 'form-message' }
    })

    root.querySelector('[data-ts-analyze]')?.addEventListener('click', async () => {
      const text = tsNarration?.value.trim() || ''
      if (!text) {
        tsMessage.textContent = 'Inserisci la dettatura prima di analizzare.'
        tsMessage.className = 'form-message is-error'
        return
      }

      const result = parseTrainingSheetNarration(text, activePlayers(), { coach: [appState.currentUserProfile?.first_name, appState.currentUserProfile?.last_name].filter(Boolean).join(' ') })
      tsMessage.textContent = 'Seduta analizzata. La bozza viene salvata automaticamente.'
      tsMessage.className = 'form-message is-success'
      tsEmpty.hidden = true
      tsForm.hidden = false
      tsForm.innerHTML = trainingSheetResultHtml(result)
      tsForm.dataset.parserResult = JSON.stringify(result)
      tsStatus.textContent = result.status === 'pronta' ? 'Pronta' : 'Da completare'
      tsStatus.className = `ts-status ${result.status === 'pronta' ? 'is-ready' : 'is-warning'}`

      attachTsFieldAutosave()

      await saveTsDraft()
    })

    await restoreLatestTsDraft()
}
