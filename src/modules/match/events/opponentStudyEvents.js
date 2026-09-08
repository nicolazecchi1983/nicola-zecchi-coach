export function wireOpponentStudyEvents({
  root,
  getActiveMatchContext,
  createMatchOpponentStudyService,
  getCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
  bindMatchOpponentStudy,
  getTeamProfile,
  analysisTemplateOptions,
  setView,
}) {
    const opponentStudy = root.querySelector('[data-opponent-study]')
    if (opponentStudy) {
      const activeMatch = getActiveMatchContext()
      const service = createMatchOpponentStudyService({
        getEvent: getCalendarEvent,
        updateEvent: updateCalendarEvent,
        reloadEvents: loadCalendarEvents,
      })
      if (activeMatch?.id) {
        service.reconcileStorageRecovery(activeMatch.id)
          .catch((error) => console.warn('Recovery asset Studio avversario in attesa:', error))
      }
      bindMatchOpponentStudy({
        root,
        service,
        activeMatch,
        team: getTeamProfile(),
        analysisTemplateOptions: analysisTemplateOptions(),
        refresh: async () => setView('opponent-study', 'Studio avversario'),
      })
    }
}
