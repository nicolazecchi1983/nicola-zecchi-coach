/**
 * Thin view adapters for the application shell.
 *
 * These functions translate application state/services into already-modular renderers.
 * They contain no DOM event wiring and own no persistence.
 */
export function createAppViewAdapters(deps) {
  const {
    appState,
    getTeamProfile,
    can,
    capabilities,
    icon,
    escapeHtml,
    activePlayers,
    getActiveMatchContext,
    renderDashboardView,
    renderCalendarView,
    formatDateInputValue,
    renderTrainingSheetEditorPage,
    getTrainingSheetRosterPlayers,
    teamLocationSelectOptions,
    renderCallupsView,
    readMatchCallupsFromEventNotes,
    renderRosterView,
    rosterPlayerIdentity,
    renderMatchAnalysisView,
    createMatchOpponentStudyService,
    getCalendarEvent,
    updateCalendarEvent,
    loadCalendarEvents,
    renderMatchOpponentStudyView,
    readSavedMatchReportMeta,
    createMatchReportRenderer,
    buildMatchReportModel,
    formatSavedReportTime,
    renderMatchReportWorkspaceView,
    createMatchPostMatchService,
    renderMatchPostMatchView,
    renderBoardView,
    renderTeamSettingsView,
    teamLogoHtml,
    renderPlaceholderView,
    renderProfileView,
    profileFullName,
    roleLabel,
    renderSettingsView,
    renderStaffManagementView,
    technicalRoleOptions,
    appRoleOptions,
    accessLevelLabel,
    renderTrainingLibraryView,
    renderNativeMatchSectionView,
    legacyMatchCompatibilityView,
  } = deps

  const teamName = () => getTeamProfile().shortName || getTeamProfile().name || 'Squadra'

  function dashboardView() {
    return renderDashboardView(appState.calendarEvents, getTeamProfile())
  }

  function calendarView() {
    const candidateDate = appState.currentCalendarDate
    const currentDate = candidateDate instanceof Date && !Number.isNaN(candidateDate.getTime())
      ? candidateDate
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const events = Array.isArray(appState.calendarEvents) ? appState.calendarEvents : []

    try {
      return renderCalendarView({
        currentDate,
        events,
        canCreate: can(capabilities.CALENDAR_CREATE),
        icon,
        escapeHtml,
        formatDateInputValue,
        team: getTeamProfile(),
      })
    } catch (error) {
      console.error('Errore render Calendario:', error)
      return renderCalendarView({
        currentDate,
        events: [],
        canCreate: can(capabilities.CALENDAR_CREATE),
        icon,
        escapeHtml,
        formatDateInputValue,
        team: getTeamProfile(),
      })
    }
  }

  function trainingSheetEditorView() {
    return renderTrainingSheetEditorPage({
      canEdit: can(capabilities.TRAINING_SHEET_EDIT),
      rosterPlayers: getTrainingSheetRosterPlayers(),
      calendarEvents: appState.calendarEvents,
      icon,
      locationOptionsHtml: teamLocationSelectOptions(),
      escapeHtml,
    })
  }

  function callupsView() {
    const activeMatch = getActiveMatchContext()
    const eventModel = appState.calendarEvents.find((item) => String(item.id) === String(activeMatch?.id || '')) || null
    return renderCallupsView({
      teamName: teamName(),
      players: activePlayers(),
      activeMatch,
      savedCallups: readMatchCallupsFromEventNotes(eventModel?.notes || ''),
      escapeHtml,
    })
  }

  function squadView() {
    return renderRosterView({
      players: activePlayers(),
      icon,
      playerIdentity: rosterPlayerIdentity,
      team: getTeamProfile(),
      canEdit: can(capabilities.ROSTER_EDIT),
      persistence: appState.rosterPersistence,
    })
  }

  function analysisView() {
    const activeMatch = getActiveMatchContext()
    const matchId = activeMatch?.id ? String(activeMatch.id) : ''
    let savedAnalysis = {}
    if (matchId) {
      try {
        savedAnalysis = JSON.parse(localStorage.getItem(`staff-match-analysis-v1:${matchId}`) || '{}')
      } catch {}
    }

    return renderMatchAnalysisView({
      teamName: teamName(),
      activeMatch,
      savedAnalysis,
      analysisEntries: appState.analysisEntries,
      escapeHtml,
      canImport: can(capabilities.ANALYSIS_IMPORT),
      icon,
    })
  }

  function opponentStudyView() {
    const activeMatch = getActiveMatchContext()
    const eventModel = appState.calendarEvents.find((item) => String(item.id) === String(activeMatch?.id || '')) || null
    const service = createMatchOpponentStudyService({
      getEvent: getCalendarEvent,
      updateEvent: updateCalendarEvent,
      reloadEvents: loadCalendarEvents,
    })
    return renderMatchOpponentStudyView({
      teamName: teamName(),
      activeMatch,
      study: service.load(eventModel, activeMatch?.id),
      escapeHtml,
    })
  }

  function matchReportWorkspaceView() {
    const activeMatch = getActiveMatchContext()
    const eventModel = appState.calendarEvents.find((item) => String(item.id) === String(activeMatch?.id || '')) || null
    const reportMeta = readSavedMatchReportMeta(eventModel)
    const reportPaper = reportMeta.report
      ? createMatchReportRenderer({ escapeHtml }).renderPaper(
          buildMatchReportModel({ data: reportMeta.report, team: getTeamProfile() }),
        )
      : ''

    return renderMatchReportWorkspaceView({
      teamName: teamName(),
      activeMatch,
      reportPaper,
      savedAtLabel: formatSavedReportTime(reportMeta.savedAt),
      escapeHtml,
    })
  }

  function postMatchView() {
    const activeMatch = getActiveMatchContext()
    const eventModel = appState.calendarEvents.find((item) => String(item.id) === String(activeMatch?.id || '')) || null
    const service = createMatchPostMatchService({
      getEvent: getCalendarEvent,
      updateEvent: updateCalendarEvent,
      reloadEvents: loadCalendarEvents,
    })

    return renderMatchPostMatchView({
      teamName: teamName(),
      activeMatch,
      postMatch: service.load(eventModel),
      reportAvailable: Boolean(eventModel?.matchReportData),
      canEdit: can(capabilities.MATCH_SHEET_EDIT),
      escapeHtml,
    })
  }

  function boardView() {
    return renderBoardView()
  }

  function teamSettingsView() {
    return renderTeamSettingsView({
      can,
      capabilities,
      getTeamProfile,
      teamFacilities: appState.teamFacilities,
      teamLogoHtml,
      escapeHtml,
    })
  }

  function placeholderView(title) {
    return renderPlaceholderView(title)
  }

  function profileView() {
    return renderProfileView({
      currentUserProfile: appState.currentUserProfile,
      currentUser: appState.currentUser,
      currentUserRole: appState.currentUserRole,
      profileFullName,
      roleLabel,
    })
  }

  function settingsView() {
    return renderSettingsView({ can, capabilities, icon })
  }

  function staffManagementView() {
    return renderStaffManagementView({
      can,
      capabilities,
      staffProfiles: appState.staffProfiles,
      currentUser: appState.currentUser,
      staffFlashMessage: appState.staffFlashMessage,
      getTeamProfile,
      escapeHtml,
      technicalRoleOptions,
      appRoleOptions,
      accessLevelLabel,
    })
  }

  function trainingLibraryView() {
    return renderTrainingLibraryView({
      events: appState.calendarEvents,
      canCreate: can(capabilities.TRAINING_SHEET_CREATE),
      canEditFeedback: can(capabilities.TRAINING_SHEET_CREATE),
      icon,
    })
  }

  function nativeOurTeamView() {
    return renderNativeMatchSectionView({
      section: 'our-team',
      activeMatch: getActiveMatchContext(),
      team: getTeamProfile(),
      escapeHtml,
      legacyEditorHtml: legacyMatchCompatibilityView(),
    })
  }

  function nativeOpponentView() {
    return renderNativeMatchSectionView({
      section: 'opponent',
      activeMatch: getActiveMatchContext(),
      team: getTeamProfile(),
      escapeHtml,
      legacyEditorHtml: legacyMatchCompatibilityView(),
    })
  }

  return {
    dashboardView,
    calendarView,
    trainingSheetEditorView,
    callupsView,
    squadView,
    analysisView,
    opponentStudyView,
    matchReportWorkspaceView,
    postMatchView,
    boardView,
    teamSettingsView,
    placeholderView,
    profileView,
    settingsView,
    staffManagementView,
    trainingLibraryView,
    nativeOurTeamView,
    nativeOpponentView,
  }
}
