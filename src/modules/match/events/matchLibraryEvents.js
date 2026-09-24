export function wireMatchLibraryEvents({
  root,
  createMatchLibraryService,
  storage = globalThis.localStorage,
  setActiveNavigation,
  setView,
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
        storage?.setItem('staff-match-entry-origin', 'match-library')
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', sectionKey)
        return true
      }
      const searchInput = matchLibrary.querySelector('[data-match-library-search]')
      const readSearchQuery = () => searchInput?.value.trim().toLocaleLowerCase('it-IT') || ''

      const applyMatchFilters = () => {
        const scope = matchLibrary.dataset.matchLibraryScope || 'operational'
        const activePanel = matchLibrary.querySelector(`[data-match-library-scope-panel="${scope}"]`)
        if (!activePanel) return

        const query = readSearchQuery()
        const competition = matchLibrary.querySelector('[data-match-library-competition]')?.value || ''
        const location = matchLibrary.querySelector('[data-match-library-location]')?.value || ''
        const outcome = matchLibrary.querySelector('[data-match-library-outcome]')?.value || ''
        const canonicalCompetitionQuery = ['campionato', 'coppa', 'amichevole'].includes(query) ? query : ''
        let visible = 0

        activePanel.querySelectorAll('[data-match-library-card]').forEach((card) => {
          const cardCompetition = String(card.dataset.competition || '').toLocaleLowerCase('it-IT')
          const matchesQuery = !query || (canonicalCompetitionQuery ? cardCompetition === canonicalCompetitionQuery : card.dataset.searchText.includes(query))
          const show = matchesQuery
            && (!competition || card.dataset.competition === competition)
            && (!location || card.dataset.location === location)
            && (!outcome || card.dataset.outcome === outcome)
          card.hidden = !show
          if (show) visible += 1
        })

        activePanel.querySelectorAll('[data-match-library-month]').forEach((month) => {
          const visibleCards = [...month.querySelectorAll('[data-match-library-card]')].filter((card) => !card.hidden)
          month.hidden = visibleCards.length === 0
          const count = month.querySelector('[data-match-month-visible-count]')
          if (count) count.textContent = String(visibleCards.length)
          if (visibleCards.length && (query || competition || location || outcome)) month.open = true
        })

        if (scope === 'operational') {
          const totalVisible = matchLibrary.querySelector('[data-match-library-visible-count]')
          if (totalVisible) totalVisible.textContent = String(visible)
        }
        const empty = activePanel.querySelector('[data-match-library-empty]')
        if (empty) empty.hidden = visible > 0
      }

      const setMatchLibraryScope = (requestedScope) => {
        const nextScope = ['operational', 'history', 'all'].includes(requestedScope) ? requestedScope : 'operational'
        matchLibrary.dataset.matchLibraryScope = nextScope
        matchLibrary.querySelectorAll('[data-match-library-scope]').forEach((button) => {
          button.setAttribute('aria-pressed', button.dataset.matchLibraryScope === nextScope ? 'true' : 'false')
        })
        matchLibrary.querySelectorAll('[data-match-library-scope-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.matchLibraryScopePanel !== nextScope
        })
        if (nextScope !== 'operational') {
          const base = matchLibrary.querySelector('[data-match-library-scope="operational"] strong')?.textContent
          const totalVisible = matchLibrary.querySelector('[data-match-library-visible-count]')
          if (base != null && totalVisible) totalVisible.textContent = base
        }
        applyMatchFilters()
      }

      const handleGlobalSearch = () => {
        const query = readSearchQuery()
        if (query) {
          if (matchLibrary.dataset.matchLibrarySearchMode !== 'global') {
            matchLibrary.dataset.matchLibrarySearchMode = 'global'
            matchLibrary.dataset.matchLibrarySearchReturnScope = matchLibrary.dataset.matchLibraryScope || 'operational'
          }
          setMatchLibraryScope('all')
          return
        }

        const returnScope = matchLibrary.dataset.matchLibrarySearchReturnScope || matchLibrary.dataset.matchLibraryScope || 'operational'
        delete matchLibrary.dataset.matchLibrarySearchMode
        delete matchLibrary.dataset.matchLibrarySearchReturnScope
        setMatchLibraryScope(returnScope)
      }

      searchInput?.addEventListener('input', handleGlobalSearch)
      matchLibrary.querySelectorAll('[data-match-library-competition], [data-match-library-location], [data-match-library-outcome]').forEach((control) => {
        control.addEventListener('change', applyMatchFilters)
      })
      matchLibrary.querySelectorAll('[data-match-library-scope]').forEach((button) => {
        button.addEventListener('click', () => {
          if (searchInput && readSearchQuery()) searchInput.value = ''
          delete matchLibrary.dataset.matchLibrarySearchMode
          delete matchLibrary.dataset.matchLibrarySearchReturnScope
          setMatchLibraryScope(button.dataset.matchLibraryScope)
        })
      })
      setMatchLibraryScope('operational')
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
