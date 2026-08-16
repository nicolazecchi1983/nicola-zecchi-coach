import { icon } from '../design-system/iconRegistry.js'
import { bindStaffColorPickers } from '../design-system/colorPickerController.js'
import { escapeHtml } from '../shared/html/escapeHtml.js'
import { readLocalJson } from '../shared/storage/localJson.js'
import { toSlugKey } from '../shared/text/textNormalization.js'
import { formatDateInputValue } from '../shared/date/dateInput.js'
import { formationOptionsHtml } from '../shared/pitch/formationOptions.js'
import { APP_MENU, renderSidebarMenu } from './appNavigation.js'
import { renderAppShell } from './appShellView.js'
import { renderDashboardView } from '../modules/dashboard/dashboardView.js'
import { createAppViewRegistry } from './appViewRegistry.js'
import { createAppWorkspaceEngine } from './appWorkspaceEngine.js'
import { resolveWorkspaceRestore } from './appSessionRestore.js'
import { appState } from './appStateStore.js'
import {
  loadAccessProfile,
  loadCalendarEventModels,
  loadMatchAnalysisEntries,
} from './appDataGateway.js'
import { renderCallupsView } from '../modules/match/ui/callupsView.js'
import { renderMatchAnalysisView } from '../modules/match/ui/matchAnalysisView.js'
import { renderRosterView } from '../modules/roster/rosterView.js'
import { loadTeamRoster, removeRosterPlayer, rosterPlayerIdentity, rosterPlayerKey, saveRosterPlayer } from '../modules/roster/rosterService.js'
import { loadPlayerProfileMap, savePlayerProfile } from '../modules/roster/playerProfileService.js'
import {
  buildEventTitle,
  eventTypeIcon,
  isTrainingEventType,
  matchTypeLabel,
  renderCalendarView,
} from '../modules/calendar/ui/calendarView.js'
import { renderTrainingLibraryView, trainingSheetName } from '../modules/training/ui/trainingLibraryView.js'
import { renderTrainingSheetEditorPage } from '../modules/training/ui/trainingSheetEditorPageView.js'
import { saveTrainingLibraryFeedback } from '../modules/training/trainingLibraryService.js'
import { renderBoardView } from '../modules/board/boardView.js'
import { renderTeamSettingsView } from '../modules/settings/teamSettingsView.js'
import { renderPlaceholderView } from '../modules/settings/placeholderView.js'
import { renderProfileView } from '../modules/profile/profileView.js'
import { renderSettingsView } from '../modules/settings/settingsView.js'
import { renderStaffManagementView } from '../modules/staff/staffManagementView.js'
import { supabase } from '../supabase.js'
import { getTeamProfile, loadTeamProfile, saveTeamProfile } from '../services/teamProfile.js'
import { parseTrainingSheetNarration } from '../services/trainingSheetParser.js'
import { getTeamLocationOptions, hasTeamLocation } from '../modules/team/teamLocationModel.js'
import { loadTeamFacilities, replaceTeamFacilities } from '../modules/team/teamFacilitiesService.js'
import { printHtmlDocument } from '../services/pdfService.js'
import {
  createStaffUser,
  deleteStaffUser,
  generateTemporaryPassword,
  loadTeamStaffProfiles,
  updateStaffProfile,
} from '../modules/staff/staffService.js'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  deleteCalendarEvents,
  getCalendarEvent,
  updateCalendarEvent,
} from '../modules/calendar/calendarService.js'
import { accessLevelLabel, appRoleOptions, technicalRoleOptions } from '../modules/staff/staffModel.js'
import { publishTrainingSheet } from '../modules/training/trainingSheetService.js'
import {
  buildTrainingDraftFromCalendarEvent,
  resolveTrainingCalendarPublishTarget,
  trainingCalendarStatus,
} from '../modules/training/trainingCalendarIntegration.js'
import { TRAINING_SHEET_STATUS, normalizeTrainingSheetData } from '../modules/training/trainingSheetModel.js'
import { getUserErrorMessage } from '../core/appError.js'
import { getDataAccessUserMessage } from '../infrastructure/dataAccess/dataAccessUserFeedback.js'
import { createDocumentViewerController } from '../shared/documentViewer/documentViewerController.js'
import { getCustomFormationLayout, getFormationLayout } from '../shared/pitch/formationLayouts.js'
import { createPitchState, PITCH_POSITION_MODE } from '../shared/pitch/pitchState.js'
import { createPitchController } from '../shared/pitch/pitchController.js'
import { bindPitchTokenDragging } from '../shared/pitch/dragController.js'
import { createMatchDraftService } from '../modules/match/matchService.js'
import { createMatchCalendarService } from '../modules/match/matchCalendarService.js'
import { createSeasonCalendarImportService } from '../modules/calendar/seasonCalendarImportService.js'
import { findOfficialSeasonCalendar } from '../modules/calendar/officialSeasonCalendarRegistry.js'
import { createCalendarBulkManagementService } from '../modules/calendar/calendarBulkManagementService.js'
import { renderCalendarBulkManagementModal } from '../modules/calendar/ui/calendarBulkManagementView.js'
import { parseSeasonCalendarCsv, renderSeasonCalendarImportModal } from '../modules/calendar/ui/seasonCalendarImportView.js'
import { createMatchLibraryService } from '../modules/match/matchLibraryService.js'
import { createMatchWorkspaceView } from '../modules/match/ui/matchWorkspaceView.js'
import { createMatchLibraryView } from '../modules/match/ui/matchLibraryView.js'
import { renderMatchWorkflowSectionView } from '../modules/match/ui/matchWorkflowSectionView.js'
import { renderMatchReportWorkspaceView } from '../modules/match/ui/matchReportWorkspaceView.js'
import { formatSavedReportTime, readSavedMatchReportMeta } from '../modules/match/matchReportWorkspaceModel.js'
import { renderMatchOpponentStudyView } from '../modules/match/ui/matchOpponentStudyView.js'
import { bindMatchOpponentStudy } from '../modules/match/ui/matchOpponentStudyController.js'
import { createMatchOpponentStudyService } from '../modules/match/matchOpponentStudyService.js'
import { createMatchPostMatchService } from '../modules/match/matchPostMatchService.js'
import { renderMatchPostMatchView } from '../modules/match/ui/matchPostMatchView.js'
import { createMatchStatisticsView } from '../modules/match/ui/matchStatisticsView.js'
import { bindMatchAnalysisSchemaEditors } from '../modules/match/ui/matchAnalysisSchemaView.js'
import { createAnalysisTemplateService } from '../modules/match/analysisTemplateService.js'
import { renderNativeMatchSectionView } from '../modules/match/ui/matchNativeSectionView.js'
import { createLegacyMatchCompatibilityView } from '../modules/match/ui/legacyMatchCompatibilityView.js'
import { getMatchOutcome } from '../modules/match/matchLibraryModel.js'
import { normalizeScore } from '../modules/match/matchModel.js'
import { createMatchReportRenderer } from '../modules/match/matchReportRenderer.js'
import { createMatchReportService } from '../modules/match/matchReportService.js'
import { buildMatchReportModel } from '../modules/match/matchReportModel.js'
import { validateMatchReport } from '../modules/match/matchReportValidation.js'
import { printMatchReport } from '../modules/match/matchReportPrint.js'
import { requirePublishedDocumentView } from '../shared/documentViewer/documentViewerPermissions.js'
import {
  ACCESS_CAPABILITIES,
  can,
  canAccessSection,
  filterAccessibleMenu,
  getFirstAccessibleSection,
  setAccessRole,
} from '../core/permissions.js'
import {
  applyAccessPolicy,
  bindGlobalAccessGuard,
  showAccessNotice,
} from '../core/accessGuard.js'

import {
  players as legacyPlayers,
  analysisItems,
} from '../data/appData.js'
import { createAppViewAdapters } from './appViewAdapters.js'
import { wireDashboardEvents } from './events/dashboardEvents.js'
import { wireProfileEvents } from './events/profileEvents.js'
import { wireTrainingLibraryEvents } from '../modules/training/events/trainingLibraryEvents.js'
import { wireCallupsEvents } from '../modules/match/events/callupsEvents.js'
import { wireBoardEvents } from '../modules/board/events/boardEvents.js'
import { wireCalendarEvents } from '../modules/calendar/events/calendarEvents.js'
import { createCalendarRuntimeActions } from '../modules/calendar/events/calendarRuntimeActions.js'
import { createCalendarEventViewBuilders } from '../modules/calendar/ui/calendarEventViewBuilders.js'
import { wireTeamAndRosterEvents } from '../modules/team/events/teamRosterEvents.js'
import { wireOpponentStudyEvents } from '../modules/match/events/opponentStudyEvents.js'
import { wirePlayerProfileEvents } from '../modules/roster/events/playerProfileEvents.js'
import { wireMatchWorkspaceEvents } from '../modules/match/events/matchWorkspaceEvents.js'
import { wireMatchLibraryEvents } from '../modules/match/events/matchLibraryEvents.js'
import { wireStaffEvents } from '../modules/staff/events/staffEvents.js'
import { wireMatchAnalysisEvents } from '../modules/match/events/matchAnalysisEvents.js'
import { wireLegacyMatchEditorEvents } from '../modules/match/events/legacyMatchEditorEvents.js'
import { wireTrainingDraftAndVoiceEvents } from '../modules/training/events/trainingDraftAndVoiceEvents.js'
import { wireTrainingEditorEvents } from '../modules/training/events/trainingEditorEvents.js'
import { createTrainingPresentationBuilders } from '../modules/training/ui/trainingPresentationBuilders.js'
import { wireGlobalShellEvents } from './events/globalShellEvents.js'
import { createRosterModalViews } from '../modules/roster/ui/rosterModalViews.js'

function teamLogoHtml(className = 'team-logo') {
  const team = getTeamProfile()
  if (team.logo) {
    return `<img class="${className}" src="${escapeHtml(team.logo)}" alt="Logo ${escapeHtml(team.shortName || team.name)}">`
  }
  const initials = String(team.shortName || team.name || 'TEAM')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return `<span class="${className} ${className}--fallback">${escapeHtml(initials || 'T')}</span>`
}

function activePlayers() {
  return Array.isArray(appState.players) ? appState.players : []
}

function roleLabel(role) {
  const labels = {
    owner: 'Proprietario',
    coach: 'Allenatore',
    assistant: 'Vice allenatore',
    athletic_coach: 'Preparatore fisico',
    goalkeeper_coach: 'Preparatore portieri',
    analyst: 'Match analyst',
    observer: 'Osservatore',
    physio: 'Fisioterapista',
    collaborator: 'Collaboratore',
    sporting_director: 'Direttore sportivo',
    read_only: 'Solo lettura',
  }

  return labels[role] ?? 'Staff'
}

function profileFullName(profile, user = appState.currentUser) {
  const joined = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (joined) return joined

  const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name
  if (metadataName) return metadataName

  const localPart = user?.email?.split('@')[0] || 'Utente'
  return localPart
    .replace(/\d+$/g, '')
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Utente'
}

async function loadCurrentUserRole(user) {
  const access = await loadAccessProfile(user)
  appState.currentUserProfile = access.profile
  appState.currentUserRole = access.role
  setAccessRole(access.accessRole)
}

async function loadAnalysisEntries() {
  appState.analysisEntries = await loadMatchAnalysisEntries()
}

async function loadPlayerProfiles() {
  appState.playerProfiles = await loadPlayerProfileMap(getTeamProfile().id || null)
}

async function loadRosterPlayers() {
  const result = await loadTeamRoster({
    team: getTeamProfile(),
    legacyPlayers,
  })
  appState.players = result.players
  appState.rosterPersistence = result
}

async function loadFacilities() {
  try {
    appState.teamFacilities = await loadTeamFacilities(getTeamProfile().id || null)
  } catch (error) {
    console.error('Errore caricamento impianti squadra:', error?.message || error)
    appState.teamFacilities = []
  }
}

async function loadStaffProfiles() {
  try {
    appState.staffProfiles = await loadTeamStaffProfiles(getTeamProfile().id || null, appState.currentUserProfile)
  } catch (error) {
    console.error('Errore caricamento staff:', error?.message || error)
    appState.staffProfiles = []
  }
}

function syncProfileHeader() {
  const name = profileFullName(appState.currentUserProfile)
  const initial = name.charAt(0).toUpperCase() || 'N'
  const label = roleLabel(appState.currentUserRole)

  document.querySelectorAll('.profile-menu-identity strong, .profile-dropdown-head strong')
    .forEach((node) => { node.textContent = name })
  document.querySelectorAll('.profile-menu-identity small')
    .forEach((node) => { node.textContent = label })
  document.querySelectorAll('.avatar-initial')
    .forEach((node) => { node.textContent = initial })
}

async function loadCalendarEvents() {
  try {
    appState.calendarEvents = await loadCalendarEventModels()
  } catch (error) {
    alert(getDataAccessUserMessage(error, undefined, { stage: 'calendar-events-load' }))
  }
}

const analysisTemplateService = createAnalysisTemplateService()

function analysisTemplateOptions() {
  return {
    templateService: analysisTemplateService,
    teamId: getTeamProfile().id || null,
    userId: appState.currentUser?.id || null,
  }
}

const menu = APP_MENU

function goToCurrentMonth() {
  const today = new Date()
  appState.currentCalendarDate = new Date(today.getFullYear(), today.getMonth(), 1)
}

function getActiveMatchContext() {
  try {
    return JSON.parse(localStorage.getItem('staff-active-match') || 'null') || null
  } catch {
    return null
  }
}

const {
  getTrainingSheetRosterPlayers,
  trainingSheetResultHtml,
  trainingSheetPreviewHtml,
  trainingSheetStructuredHtml,
} = createTrainingPresentationBuilders({
  activePlayers,
})

const {
  teamLocationSelectOptions,
  isConfiguredTeamFacility,
  drawerHtml,
  newEventModalHtml,
  editEventModalHtml,
} = createCalendarEventViewBuilders({
  getFacilities: () => appState.teamFacilities,
  getTeamLocationOptions,
  hasTeamLocation,
  escapeHtml,
  icon,
  eventTypeIcon,
  matchTypeLabel,
  isTrainingEventType,
  trainingSheetName,
  trainingSheetStructuredHtml,
  trainingSheetPreviewHtml,
  can,
  capabilities: ACCESS_CAPABILITIES,
  trainingCalendarStatus,
  formatDateInputValue,
})

const legacyMatchCompatibilityView = createLegacyMatchCompatibilityView({
  canEditMatch: () => can(ACCESS_CAPABILITIES.MATCH_SHEET_EDIT),
  getTeamProfile,
  getActiveMatchContext,
  getEditorIdentity: () => ({
    name: profileFullName(appState.currentUserProfile, appState.currentUser),
    role: roleLabel(appState.currentUserRole),
  }),
  getRosterPlayers: getTrainingSheetRosterPlayers,
  escapeHtml,
})

const {
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
} = createAppViewAdapters({
  appState,
  getTeamProfile,
  can,
  capabilities: ACCESS_CAPABILITIES,
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
})

const matchWorkspaceView = createMatchWorkspaceView({
  storage: localStorage,
  createMatchLibraryService,
  getCalendarEvents: () => appState.calendarEvents,
  getTeamProfile,
  escapeHtml,
})

const matchStatisticsView = createMatchStatisticsView({
  storage: localStorage,
  createMatchLibraryService,
  getCalendarEvents: () => appState.calendarEvents,
  getTeamProfile,
})

const matchLibraryView = createMatchLibraryView({
  createMatchLibraryService,
  getMatchOutcome,
  getTeamProfile,
  getCalendarEvents: () => appState.calendarEvents,
  storage: localStorage,
  escapeHtml,
  icon,
})

const {
  playerProfileModalHtml,
  rosterPlayerModalHtml,
} = createRosterModalViews({
  appState,
  rosterPlayerIdentity,
  rosterPlayerKey,
  escapeHtml,
  icon,
})


export async function prepareAppData(user) {
  appState.currentUser = user
  await Promise.all([
    loadTeamProfile(user),
    loadCurrentUserRole(user),
  ])
}

export function renderApp(user) {
  appState.currentUser = user
  return renderAppShell({
    user,
    team: getTeamProfile(),
    currentUserRole: appState.currentUserRole,
    currentUserProfile: appState.currentUserProfile,
    renderTeamLogo: teamLogoHtml,
    renderDashboard: dashboardView,
    escapeHtml,
  })
}

function normalizeCsvHeader(value) {
  return String(value ?? '').trim().toLocaleLowerCase('it-IT')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1 }
      else if (char === '"') quoted = false
      else value += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(value); value = '' }
    else if (char === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = '' }
    else value += char
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row) }
  return rows
}

function parseItalianDate(value) {
  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export async function attachAppEvents(user) {
  appState.currentUser = user
  await loadTeamProfile(user)
  await loadCurrentUserRole(user)
  syncProfileHeader()
  applyAccessPolicy(document)
  await loadCalendarEvents()
  await loadFacilities()
  await loadRosterPlayers()
  await loadPlayerProfiles()
  
  const root = document.querySelector('#viewRoot')
  const drawerRoot = document.querySelector('#drawerRoot')
  const modalRoot = document.querySelector('#modalRoot')
  const documentViewerRoot = document.querySelector('#documentViewerRoot')
  const documentViewer = createDocumentViewerController(documentViewerRoot)

  function setActiveNavigation(sectionKey) {
    document
      .querySelectorAll('.nav-item')
      .forEach((item) => {
        const isActive = item.dataset.section === sectionKey
        item.classList.toggle('is-active', isActive)
        if (isActive) {
          const group = item.closest('[data-nav-group]')
          const toggle = group?.querySelector('[data-nav-group-toggle]')
          group?.classList.remove('is-collapsed')
          toggle?.setAttribute('aria-expanded', 'true')
        }
      })
  }

  const moduleViews = {
    dashboard: dashboardView,
    calendar: calendarView,
    'training-sheet': trainingSheetEditorView,
    'match-library': matchLibraryView,
    'match-workspace': matchWorkspaceView,
    'our-team': nativeOurTeamView,
    opponent: nativeOpponentView,
    'match-statistics': matchStatisticsView,
    'opponent-study': opponentStudyView,
    'match-report-workspace': matchReportWorkspaceView,
    'post-match': postMatchView,
    board: boardView,
    library: trainingLibraryView,
    squad: squadView,
    callups: callupsView,
    analysis: analysisView,
    profile: profileView,
    settings: settingsView,
    staff: staffManagementView,
    'team-settings': teamSettingsView,
  }

  const modulePrepare = {
    dashboard: loadCalendarEvents,
    calendar: loadCalendarEvents,
    'training-sheet': loadCalendarEvents,
    'match-library': loadCalendarEvents,
    'match-workspace': loadCalendarEvents,
    'our-team': loadCalendarEvents,
    opponent: loadCalendarEvents,
    'match-statistics': loadCalendarEvents,
    'opponent-study': loadCalendarEvents,
    'match-report-workspace': loadCalendarEvents,
    'post-match': loadCalendarEvents,
    library: loadCalendarEvents,
    squad: loadPlayerProfiles,
    callups: loadPlayerProfiles,
    analysis: loadAnalysisEntries,
    staff: loadStaffProfiles,
  }

  const moduleRegistry = createAppViewRegistry(
    Object.entries(moduleViews).map(([key, render]) => ({
      key,
      render,
      prepare: modulePrepare[key],
    })),
    placeholderView,
  )

  const workspaceEngine = createAppWorkspaceEngine({
    root,
    registry: moduleRegistry,
    menu,
    canAccessSection,
    getFirstAccessibleSection,
    onAccessDenied: () => showAccessNotice('Sezione non disponibile per il tuo livello di accesso.'),
    onNavigationChange: setActiveNavigation,
    beforeActivate: () => {
      closeDrawer()
      closeNewEventModal()
      document.body.classList.remove('drawer-open', 'new-event-modal-open')
      document.body.style.removeProperty('overflow')
    },
    afterActivate: async () => {
      await bindDynamic()
      applyAccessPolicy(root)
    },
  })

  async function setView(key, label) {
    return workspaceEngine.open(key, label)
  }

  const calendarRuntime = createCalendarRuntimeActions({
    root,
    drawerRoot,
    modalRoot,
    documentViewer,
    appState,
    can,
    capabilities: ACCESS_CAPABILITIES,
    showAccessNotice,
    isTrainingEventType,
    teamLocationSelectOptions,
    isConfiguredTeamFacility,
    createMatchCalendarService,
    createCalendarEvent,
    updateCalendarEvent,
    createSeasonCalendarImportService,
    loadCalendarEvents,
    getTeamProfile,
    findOfficialSeasonCalendar,
    renderSeasonCalendarImportModal,
    escapeHtml,
    parseSeasonCalendarCsv,
    createCalendarBulkManagementService,
    deleteCalendarEvents,
    renderCalendarBulkManagementModal,
    calendarView,
    bindDynamic,
    newEventModalHtml,
    editEventModalHtml,
    buildEventTitle,
  eventTypeIcon,
    deleteCalendarEvent,
    supabase,
    drawerHtml,
    requirePublishedDocumentView,
    trainingSheetName,
    closeDrawer,
    closeNewEventModal,
    setActiveNavigation,
    setView,
    getDataAccessUserMessage,
    alertUser: alert,
    confirmUser: window.confirm,
    documentRef: document,
    FormDataCtor: FormData,
    storage: localStorage,
  })
  const { openDrawer, openSeasonCalendarImport, openCalendarBulkManagement, openNewEventModal } = calendarRuntime

  function closeNewEventModal() {
    if (!modalRoot) {
      return
    }

    modalRoot.innerHTML = ''
    document.body.classList.remove('new-event-modal-open')
  }

  function closeDrawer() {
    drawerRoot.innerHTML = ''
    document.body.classList.remove('drawer-open')
  }

  async function bindDynamic() {

    wireMatchLibraryEvents({
      root,
      createMatchLibraryService,
      storage: localStorage,
      formatDateInputValue,
      appState,
      createMatchCalendarService,
      createCalendarEvent,
      updateCalendarEvent,
      loadCalendarEvents,
      setActiveNavigation,
      setView,
      getUserErrorMessage,
      getDataAccessUserMessage,
      confirmUser: window.confirm,
    })
    wireOpponentStudyEvents({
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
    })
    wireMatchWorkspaceEvents({
      root,
      setActiveNavigation,
      setView,
      storage: localStorage,
      getActiveMatchContext,
      printMatchReport,
      alertUser: alert,
      createMatchPostMatchService,
      getCalendarEvent,
      updateCalendarEvent,
      loadCalendarEvents,
    })




    wireTeamAndRosterEvents({
      root,
      setView,
      bindStaffColorPickers,
      saveTeamProfile,
      appState,
      replaceTeamFacilities,
      getTeamProfile,
      teamLogoHtml,
      modalRoot,
      rosterPlayerModalHtml,
      saveRosterPlayer,
      legacyPlayers,
      loadRosterPlayers,
      activePlayers,
      rosterPlayerIdentity,
      removeRosterPlayer,
      showAccessNotice,
      getDataAccessUserMessage,
      documentRef: document,
      windowRef: window,
      FileCtor: File,
      FileReaderCtor: FileReader,
    })
    wireCallupsEvents({
      root,
      getTeamProfile,
      escapeHtml,
      printHtmlDocument,
      alertUser: alert,
    })
    wireBoardEvents({
      root,
      readLocalJson,
      storage: localStorage,
      cssEscape: CSS.escape,
      createPitchState,
      pitchPositionMode: PITCH_POSITION_MODE,
      createPitchController,
      getTeamProfile,
      bindPitchTokenDragging,
    })
    wireMatchAnalysisEvents({
      root,
      getDataAccessUserMessage,
      bindMatchAnalysisSchemaEditors,
      analysisTemplateOptions,
      getActiveMatchContext,
      storage: localStorage,
      createMatchDraftService,
      buildMatchReportModel,
      getTeamProfile,
      validateMatchReport,
      createMatchReportRenderer,
      escapeHtml,
      documentRef: document,
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
    })
    wireLegacyMatchEditorEvents({
      root,
      getActiveMatchContext,
      createMatchDraftService,
      storage: localStorage,
      getTrainingSheetRosterPlayers,
      escapeHtml,
      getFormationLayout,
      getCustomFormationLayout,
      getTeamProfile,
      createMatchReportRenderer,
      createMatchReportService,
      formationOptionsHtml,
      bindStaffColorPickers,
      bindMatchAnalysisSchemaEditors,
      analysisTemplateOptions,
      createMatchCalendarService,
      createCalendarEvent,
      updateCalendarEvent,
      loadCalendarEvents,
      appState,
      printMatchReport,
      windowRef: window,
      documentRef: document,
      urlApi: URL,
      requestFrame: requestAnimationFrame,
    })
    wireTrainingEditorEvents({
      root,
      TRAINING_SHEET_STATUS,
      normalizeTrainingSheetData,
      getTrainingSheetRosterPlayers,
      activePlayers,
      getTeamProfile,
      profileFullName,
      appState,
      teamLogoHtml,
      hasTeamLocation,
      resolveTrainingCalendarPublishTarget,
      publishTrainingSheet,
      getUserErrorMessage,
      getDataAccessUserMessage,
      updateCalendarEvent,
      createCalendarEvent,
      deleteCalendarEvent,
      loadCalendarEvents,
      supabase,
      getCalendarEvent,
      buildTrainingDraftFromCalendarEvent,
    })
    wireCalendarEvents({
      root,
      appState,
      openDrawer,
      openSeasonCalendarImport,
      openCalendarBulkManagement,
      openNewEventModal,
      calendarView,
      bindDynamic,
      goToCurrentMonth,
    })
    wireProfileEvents({
      root,
      supabase,
      appState,
      syncProfileHeader,
      setView,
    })

    wireStaffEvents({
      root,
      getDataAccessUserMessage,
      can,
      capabilities: ACCESS_CAPABILITIES,
      showAccessNotice,
      generateTemporaryPassword,
      getTeamProfile,
      createStaffUser,
      appState,
      loadStaffProfiles,
      staffManagementView,
      bindDynamic,
      updateStaffProfile,
      setAccessRole,
      syncProfileHeader,
      deleteStaffUser,
      supabase,
      confirmUser: window.confirm,
    })
    await wireTrainingDraftAndVoiceEvents({
      root,
      getDataAccessUserMessage,
      appState,
      supabase,
      trainingSheetResultHtml,
      parseTrainingSheetNarration,
      activePlayers,
      windowRef: window,
      EventCtor: Event,
      FormDataCtor: FormData,
    })
    wirePlayerProfileEvents({
      root,
      activePlayers,
      rosterPlayerIdentity,
      modalRoot,
      playerProfileModalHtml,
      savePlayerProfile,
      appState,
      rosterPlayerKey,
      documentRef: document,
    })
    wireDashboardEvents({
      root,
      setActiveNavigation,
      setView,
      storage: localStorage,
    })
    wireTrainingLibraryEvents({
      root,
      getDataAccessUserMessage,
      appState,
      saveTrainingLibraryFeedback,
      updateCalendarEvent,
      loadCalendarEvents,
      setView,
    })
}

  wireGlobalShellEvents({
    document,
    workspaceEngine,
    setView,
    setActiveNavigation,
    bindGlobalAccessGuard,
    showAccessNotice,
    closeDrawer,
    closeNewEventModal,
  })

  await bindDynamic()

  const savedSection = localStorage.getItem('nz-active-section')
  const restoreTarget = resolveWorkspaceRestore({
    savedSection,
    activeMatch: getActiveMatchContext(),
    calendarEvents: appState.calendarEvents,
    canAccessSection,
    availableSections: moduleRegistry.keys(),
    firstAccessibleSection: getFirstAccessibleSection(menu),
  })

  setActiveNavigation(restoreTarget.navigationKey)
  if (restoreTarget.key !== 'dashboard') {
    await setView(restoreTarget.key, restoreTarget.label)
  } else {
    localStorage.setItem('nz-active-section', 'dashboard')
  }

  if (restoreTarget.reason !== 'restored' && savedSection && restoreTarget.key !== savedSection) {
    localStorage.setItem('nz-active-section', restoreTarget.key)
  }
}