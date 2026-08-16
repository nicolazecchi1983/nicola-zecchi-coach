export function wireMatchLibraryEvents({
  root,
  createMatchLibraryService,
  storage = globalThis.localStorage,
  formatDateInputValue,
  appState,
  createMatchCalendarService,
  createCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
  setActiveNavigation,
  setView,
  getUserErrorMessage,
  getDataAccessUserMessage = getUserErrorMessage,
  confirmUser = globalThis.confirm,
}) {
    const matchLibrary = root.querySelector('[data-match-library]')
    if (matchLibrary) {
      const service = createMatchLibraryService({ storage })
      const activateMatchContext = (match, sectionKey) => {
        if (!match?.id) return false
        storage?.setItem('staff-active-match', JSON.stringify({
          id: match.id,
          opponent: match.opponent || 'Da definire',
          date: String(match.date || '').slice(0, 10),
        }))
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', sectionKey)
        return true
      }
      const createForm = matchLibrary.querySelector('[data-match-create-form]')
      const toggleCreate = (show) => {
        createForm.hidden = !show
        if (show) createForm.elements.date.value ||= formatDateInputValue(new Date())
      }
      matchLibrary.querySelector('[data-toggle-match-create]')?.addEventListener('click', () => toggleCreate(createForm.hidden))
      matchLibrary.querySelector('[data-cancel-match-create]')?.addEventListener('click', () => toggleCreate(false))
      const sourceMode = createForm?.querySelector('[data-match-source-mode]')
      const calendarSourceField = createForm?.querySelector('[data-match-calendar-source]')
      const newFields = createForm?.querySelector('[data-match-new-fields]')
      const createSubmit = createForm?.querySelector('[data-match-create-submit]')
      const createMessage = createForm?.querySelector('[data-match-create-message]')

      const refreshMatchCreateMode = () => {
        const useCalendar = sourceMode?.value !== 'new'
        if (calendarSourceField) calendarSourceField.hidden = !useCalendar
        if (newFields) newFields.hidden = useCalendar
        if (createSubmit) createSubmit.textContent = useCalendar ? 'Apri partita' : 'Crea partita'
        createForm?.querySelectorAll('[data-match-new-fields] input[name="date"], [data-match-new-fields] input[name="opponent"]').forEach((input) => {
          input.required = !useCalendar
        })
      }
      sourceMode?.addEventListener('change', refreshMatchCreateMode)
      refreshMatchCreateMode()

      createForm?.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (createSubmit?.disabled) return

        const data = Object.fromEntries(new FormData(createForm).entries())
        const useCalendar = data.sourceMode !== 'new'
        createSubmit.disabled = true
        if (createMessage) createMessage.textContent = ''

        try {
          let activeMatch = null

          if (useCalendar) {
            const eventId = String(data.calendarEventId || '').trim()
            const calendarMatch = appState.calendarEvents.find((item) => item.type === 'match' && String(item.id) === eventId)
            if (!calendarMatch) throw new Error('Seleziona una partita già presente nel Calendario.')
            activeMatch = {
              id: calendarMatch.id,
              opponent: calendarMatch.opponent || 'Da definire',
              date: String(calendarMatch.startAt || '').slice(0, 10),
            }
          } else {
            const calendarService = createMatchCalendarService({
              createEvent: createCalendarEvent,
              updateEvent: updateCalendarEvent,
              reloadEvents: loadCalendarEvents,
            })
            const created = await calendarService.createMatch(data)
            if (!created.eventId) throw new Error('La partita è stata creata ma non è stato restituito un identificativo valido.')
            const calendarMatch = appState.calendarEvents.find((item) => String(item.id) === String(created.eventId))
            activeMatch = {
              id: created.eventId,
              opponent: calendarMatch?.opponent || created.match?.opponent || data.opponent || 'Da definire',
              date: String(calendarMatch?.startAt || created.match?.date || data.date || '').slice(0, 10),
            }
          }

          activateMatchContext(activeMatch, 'opponent-study')
          await setView('opponent-study', 'Studio avversario')
        } catch (error) {
          console.error('Creazione partita non riuscita:', error)
          if (createMessage) createMessage.textContent = getDataAccessUserMessage(error, undefined, { stage: 'match-create' })
        } finally {
          createSubmit.disabled = false
        }
      })
      const applyMatchFilters = () => {
        const query = matchLibrary.querySelector('[data-match-library-search]')?.value.trim().toLocaleLowerCase('it-IT') || ''
        const competition = matchLibrary.querySelector('[data-match-library-competition]')?.value || ''
        const location = matchLibrary.querySelector('[data-match-library-location]')?.value || ''
        const outcome = matchLibrary.querySelector('[data-match-library-outcome]')?.value || ''
        const canonicalCompetitionQuery = ['campionato', 'coppa', 'amichevole'].includes(query) ? query : ''
        let visible = 0
        matchLibrary.querySelectorAll('[data-match-library-card]').forEach((card) => {
          const cardCompetition = String(card.dataset.competition || '').toLocaleLowerCase('it-IT')
          const matchesQuery = !query
            || (canonicalCompetitionQuery
              ? cardCompetition === canonicalCompetitionQuery
              : card.dataset.searchText.includes(query))
          const show = matchesQuery
            && (!competition || card.dataset.competition === competition)
            && (!location || card.dataset.location === location)
            && (!outcome || card.dataset.outcome === outcome)
          card.hidden = !show
          if (show) visible += 1
        })

        matchLibrary.querySelectorAll('[data-match-library-month]').forEach((month) => {
          const visibleCards = [...month.querySelectorAll('[data-match-library-card]')]
            .filter((card) => !card.hidden)
          month.hidden = visibleCards.length === 0
          const count = month.querySelector('[data-match-month-visible-count]')
          if (count) count.textContent = String(visibleCards.length)
          if (visibleCards.length && (query || competition || location || outcome)) month.open = true
        })

        const totalVisible = matchLibrary.querySelector('[data-match-library-visible-count]')
        if (totalVisible) totalVisible.textContent = String(visible)
        const empty = matchLibrary.querySelector('[data-match-library-empty]')
        if (empty) empty.hidden = visible > 0
      }
      matchLibrary.querySelectorAll('[data-match-library-search], [data-match-library-competition], [data-match-library-location], [data-match-library-outcome]').forEach((control) => {
        control.addEventListener(control.matches('input') ? 'input' : 'change', applyMatchFilters)
      })
      matchLibrary.addEventListener('click', async (event) => {
        const openButton = event.target.closest('[data-open-match-workspace]')
        if (openButton) {
          activateMatchContext({ id: openButton.dataset.openMatchWorkspace, opponent: openButton.dataset.matchOpponent, date: openButton.dataset.matchDate }, 'opponent-study')
          await setView('opponent-study', 'Studio avversario')
          return
        }
        const statisticsButton = event.target.closest('[data-open-match-statistics]')
        if (statisticsButton) {
          activateMatchContext({ id: statisticsButton.dataset.openMatchStatistics, opponent: statisticsButton.dataset.matchOpponent, date: statisticsButton.dataset.matchDate }, 'match-statistics')
          await setView('match-statistics', 'Statistiche partita')
          return
        }
        const deleteButton = event.target.closest('[data-delete-library-match]')
        if (deleteButton && confirmUser?.('Eliminare questa gara dalla Match Library?')) {
          service.remove(deleteButton.dataset.deleteLibraryMatch)
          await setView('match-library', 'Match Library')
        }
      })
    }
}
