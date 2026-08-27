export function wireMatchAnalysisEvents({
  root,
  getDataAccessUserMessage,
  bindMatchAnalysisSchemaEditors,
  analysisTemplateOptions,
  getActiveMatchContext,
  storage = globalThis.localStorage,
  createMatchDraftService,
  buildMatchReportModel,
  getTeamProfile,
  validateMatchReport,
  createMatchReportRenderer,
  escapeHtml,
  documentRef = globalThis.document,
  createMatchCalendarService,
  createCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
  appState,
  printMatchReport,
  setView,
  setActiveNavigation,
  parseCsv,
  normalizeCsvHeader,
  parseItalianDate,
  supabase,
  loadAnalysisEntries,
  analysisView,
  bindDynamic,
}) {
    // Navigation is a core Match Workspace concern: bind it before optional analysis widgets.
    root.querySelectorAll('[data-match-context-section]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.matchContextSection
        const routeByAction = {
          'opponent-study': ['opponent-study', 'Studio avversario'],
          callups: ['callups', 'Convocazioni'],
          'our-team': ['our-team', 'Nostra squadra'],
          opponent: ['opponent', 'Avversario'],
          analysis: ['analysis', 'Analisi gara'],
          report: ['match-report-workspace', 'Report partita'],
          'post-match': ['post-match', 'Post gara'],
        }
        const target = routeByAction[action]
        if (!target) return
        storage?.setItem('nz-active-section', target[0])
        await setView(target[0], target[1])
      })
    })

    root.querySelectorAll('[data-return-to-match-workspace]').forEach((button) => {
      const origin = storage?.getItem('staff-match-entry-origin') === 'dashboard' ? 'dashboard' : 'match-library'
      const destination = origin === 'dashboard'
        ? ['dashboard', 'Dashboard']
        : ['match-library', 'Match Library']
      const label = button.querySelector('[data-match-context-back-label]')
      if (label) label.textContent = `Torna alla ${destination[1]}`
      button.addEventListener('click', async () => {
        setActiveNavigation(destination[0])
        storage?.setItem('nz-active-section', destination[0])
        await setView(destination[0], destination[1])
      })
    })

    try {
      bindMatchAnalysisSchemaEditors(root, analysisTemplateOptions())
    } catch (error) {
      console.error('Match analysis schema binding failed; workspace navigation remains active:', error)
    }

    const lifecycleAnalysis = root.querySelector('[data-match-lifecycle-analysis]')
    if (lifecycleAnalysis) {
      const activeMatch = getActiveMatchContext()
      const matchId = activeMatch?.id ? String(activeMatch.id) : ''
      const state = lifecycleAnalysis.querySelector('[data-match-analysis-state]')
      const collectAnalysis = () => ({
        ...Object.fromEntries(new FormData(lifecycleAnalysis).entries()),
        matchId,
        opponent: activeMatch?.opponent || '',
        date: activeMatch?.date || '',
        updatedAt: new Date().toISOString(),
      })
      const saveAnalysis = () => {
        if (!matchId) return null
        const payload = collectAnalysis()
        storage?.setItem(`staff-match-analysis-v1:${matchId}`, JSON.stringify(payload))
        if (state) state.textContent = 'Analisi salvata'
        return payload
      }
      lifecycleAnalysis.querySelector('[data-save-match-analysis]')?.addEventListener('click', saveAnalysis)
      lifecycleAnalysis.addEventListener('analysis-schema-structure-change', () => {
        saveAnalysis()
        if (state) state.textContent = 'Struttura salvata automaticamente'
      })
      lifecycleAnalysis.addEventListener('input', () => { if (state) state.textContent = 'Modifiche non salvate' })
      lifecycleAnalysis.querySelector('[data-generate-match-report]')?.addEventListener('click', async (event) => {
        const button = event.currentTarget
        const analysis = saveAnalysis() || collectAnalysis()
        const draftService = createMatchDraftService({ storage, storageKey: matchId ? `nz-match-sheet-editor-v2:${matchId}` : undefined })
        const matchData = draftService.load() || {}
        const mergedData = {
          ...matchData,
          opponent: matchData.opponent || activeMatch?.opponent || '',
          date: matchData.date || activeMatch?.date || '',
          ...analysis,
        }
        const model = buildMatchReportModel({ data: mergedData, team: getTeamProfile() })
        const validation = validateMatchReport(model)
        const renderer = createMatchReportRenderer({ escapeHtml })
        const wrapper = documentRef.createElement('div')
        wrapper.innerHTML = renderer.renderPaper(model)
        const paper = wrapper.firstElementChild
        if (!paper) return
        documentRef.querySelector('[data-match-report-dialog]')?.remove()
        const dialog = documentRef.createElement('div')
        dialog.className = 'match-report-dialog'
        dialog.dataset.matchReportDialog = ''
        dialog.innerHTML = `<section class="match-report-dialog-panel" role="dialog" aria-modal="true" aria-label="Anteprima Match Report"><header><div><span>ANTEPRIMA DI STAMPA</span><h2>Match Report</h2></div><button type="button" data-close-match-report aria-label="Chiudi">×</button></header><div class="match-report-dialog-body">${paper.outerHTML}</div><footer><span>${validation.valid ? 'Report pronto' : `Da completare: ${escapeHtml(validation.errors.join(' · '))}`}</span><button type="button" class="secondary-button" data-close-match-report>Annulla</button><button type="button" class="primary-button" data-confirm-match-report>Stampa / salva PDF</button></footer></section>`
        documentRef.body.appendChild(dialog)
        documentRef.body.classList.add('modal-open')
        const close = () => { dialog.remove(); documentRef.body.classList.remove('modal-open') }
        dialog.querySelectorAll('[data-close-match-report]').forEach((item) => item.addEventListener('click', close))
        dialog.querySelector('[data-confirm-match-report]')?.addEventListener('click', async () => {
          button.disabled = true
          try {
            const calendarService = createMatchCalendarService({ createEvent: createCalendarEvent, updateEvent: updateCalendarEvent, reloadEvents: loadCalendarEvents })
            await calendarService.publish({ matchData: mergedData, activeMatch, calendarEvents: appState.calendarEvents })
            storage?.setItem(`staff-match-report-v1:${matchId}`, JSON.stringify({ generatedAt: new Date().toISOString() }))
            printMatchReport(dialog.querySelector('.match-report-paper'))
            if (state) state.textContent = 'Analisi salvata · Report generato'
          } catch (error) {
            console.error('Generazione Match Report non riuscita:', error)
            if (state) state.textContent = getDataAccessUserMessage(error, undefined, { stage: 'match-analysis-report-generate' })
          } finally {
            button.disabled = false
          }
        })
      })
    }
    const analysisImportButton = root.querySelector('[data-import-analysis]')
    const analysisFileInput = root.querySelector('[data-analysis-file]')
    analysisImportButton?.addEventListener('click', () => analysisFileInput?.click())

    analysisFileInput?.addEventListener('change', async (event) => {
      const file = event.currentTarget.files?.[0]
      const message = root.querySelector('[data-analysis-message]')
      if (!file) return
      try {
        const text = await file.text()
        const rows = parseCsv(text)
        if (rows.length < 2) throw new Error('Il CSV non contiene risposte.')
        const headers = rows[0].map(normalizeCsvHeader)
        const records = rows.slice(1).filter(row => row.some(cell => String(cell).trim())).map((row) => {
          const obj = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
          const pick = (...keys) => {
            for (const key of keys) {
              const found = headers.find(header => header.includes(key))
              if (found && obj[found]) return String(obj[found]).trim()
            }
            return ''
          }
          const rawDate = pick('data della gara', 'data gara', 'data')
          return {
            observer: pick('nome osservatore', 'osservatore', 'nome'),
            match_date: parseItalianDate(rawDate),
            match_name: pick('partita analizzata', 'partita', 'gara'),
            minute: pick('minuto evento', 'minuto'),
            game_phase: pick('fase del gioco', 'fase di gioco', 'fase'),
            outcome: pick('esito'),
            observation: pick('osservazione riscontrata', 'osservazione', 'descrizione'),
            raw_data: obj,
          }
        })
        const { error } = await supabase.from('match_analysis').insert(records)
        if (error) throw error
        message.textContent = `${records.length} osservazioni importate.`
        message.className = 'form-message is-success'
        await loadAnalysisEntries()
        root.innerHTML = analysisView()
        bindDynamic()
      } catch (error) {
        message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'match-analysis-import' })
        message.className = 'form-message is-error'
      } finally {
        event.currentTarget.value = ''
      }
    })

    root.querySelector('[data-analysis-search]')?.addEventListener('input', (event) => {
      const query = event.currentTarget.value.trim().toLocaleLowerCase('it-IT')
      let visible = 0
      root.querySelectorAll('.match-analysis-row').forEach((row) => {
        const match = row.textContent.toLocaleLowerCase('it-IT').includes(query)
        row.hidden = !match
        if (match) visible += 1
      })
      const count = root.querySelector('[data-analysis-count]')
      if (count) count.textContent = `${visible} osservazioni`
    })
}
