import { collectPostMatchSections, wirePostMatchSectionsEvents } from './matchPostMatchSectionsEvents.js'
import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'
import { wireMatchCenterEvents } from './matchCenterEvents.js'
export function wireMatchWorkspaceEvents({
  root,
  setActiveNavigation,
  setView,
  storage = globalThis.localStorage,
  getActiveMatchContext,
  printMatchReport,
  alertUser = globalThis.alert,
  createMatchPostMatchService,
  getCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
}) {
    wireMatchCenterEvents({ root, getActiveMatchContext, getCalendarEvent, updateCalendarEvent, loadCalendarEvents, setView })
    const matchWorkspace = root.querySelector('[data-match-workspace], .match-workspace--empty')
    matchWorkspace?.addEventListener('click', async (event) => {
      const actionButton = event.target.closest('[data-workspace-action]')
      if (!actionButton || actionButton.disabled) return
      const action = actionButton.dataset.workspaceAction
      if (action === 'match-library') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'match-library')
        await setView('match-library', 'Match Library')
        return
      }
      if (action === 'our-team') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'our-team')
        await setView('our-team', 'Nostra squadra')
        return
      }
      if (action === 'opponent') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'opponent')
        await setView('opponent', 'Avversario')
        return
      }
      if (action === 'opponent-study') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'opponent-study')
        await setView('opponent-study', 'Studio avversario')
        return
      }
      if (action === 'match-center') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'match-center')
        await setView('match-center', 'Match Center')
        return
      }
      if (action === 'analysis') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'analysis')
        await setView('analysis', 'Analisi gara')
        return
      }
      if (action === 'callups') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'callups')
        await setView('callups', 'Convocazioni')
        root.querySelector('[data-callups-match]')?.focus()
      }
      if (action === 'report') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'match-report-workspace')
        await setView('match-report-workspace', 'Report partita')
        return
      }
      if (action === 'post-match') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'post-match')
        await setView('post-match', 'Post gara')
        return
      }
      if (action === 'statistics') {
        setActiveNavigation('match-library')
        storage?.setItem('nz-active-section', 'match-statistics')
        await setView('match-statistics', 'Statistiche partita')
      }
    })

    root.querySelector('[data-match-report-workspace-print]')?.addEventListener('click', (event) => {
      const button = event.currentTarget
      const paper = root.querySelector('[data-match-report-workspace-preview] .match-report-paper')
      if (!paper) return
      button.disabled = true
      try {
        const activeMatch = getActiveMatchContext()
        printMatchReport(paper, { title: `Match Report - ${activeMatch?.opponent || 'Partita'}` })
      } catch (error) {
        console.error('Stampa Match Report non riuscita:', error)
        alertUser?.(getDataAccessUserMessage(error, undefined, { stage: 'match-report-print' }))
      } finally {
        button.disabled = false
      }
    })

    root.querySelector('[data-match-report-open-analysis]')?.addEventListener('click', async () => {
      setActiveNavigation('match-library')
      storage?.setItem('nz-active-section', 'analysis')
      await setView('analysis', 'Analisi gara')
    })

    const postMatchForm = root.querySelector('[data-post-match-form]')
    if (postMatchForm) {
      wirePostMatchSectionsEvents({ form: postMatchForm })
      const saveButton = postMatchForm.querySelector('[data-post-match-save]')
      const message = postMatchForm.querySelector('[data-post-match-message]')
      postMatchForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!saveButton) return

        const activeMatch = getActiveMatchContext()
        if (!activeMatch?.id) {
          if (message) message.textContent = 'Partita non disponibile.'
          return
        }

        const service = createMatchPostMatchService({
          getEvent: getCalendarEvent,
          updateEvent: updateCalendarEvent,
          reloadEvents: loadCalendarEvents,
        })
        const data = { sections: collectPostMatchSections(postMatchForm) }

        saveButton.disabled = true
        if (message) {
          message.textContent = 'Salvataggio…'
          message.className = 'post-match-message'
        }

        try {
          await service.save(activeMatch.id, data)
          if (message) {
            message.textContent = 'Post gara salvato.'
            message.className = 'post-match-message is-success'
          }
          await setView('post-match', 'Post gara')
        } catch (error) {
          console.error('Salvataggio Post gara non riuscito:', error)
          if (message) {
            message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'match-post-save' })
            message.className = 'post-match-message is-error'
          }
          saveButton.disabled = false
        }
      })
    }
}
