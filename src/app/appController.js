import { icon } from '../design-system/iconRegistry.js'
import { editorFooterHtml, matchContextBackButtonHtml } from '../design-system/uiComponents.js'
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
import { createDocumentViewerController } from '../shared/documentViewer/documentViewerController.js'
import { COMMON_FORMATIONS, getCustomFormationLayout, getFormationLayout } from '../shared/pitch/formationLayouts.js'
import { createPitchState, PITCH_POSITION_MODE } from '../shared/pitch/pitchState.js'
import { createPitchController } from '../shared/pitch/pitchController.js'
import { bindPitchTokenDragging } from '../shared/pitch/dragController.js'
import { createMatchDraftService } from '../modules/match/matchService.js'
import { createMatchCalendarService } from '../modules/match/matchCalendarService.js'
import { createSeasonCalendarImportService } from '../modules/calendar/seasonCalendarImportService.js'
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
import { renderMatchSquadStep } from '../modules/match/ui/matchSquadView.js'
import { renderNativeMatchSectionView } from '../modules/match/ui/matchNativeSectionView.js'
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

function scoreFieldsHtml(prefix, label) {
  return `<label class="match-score-field">
    <span>${label}</span>
    <div class="match-input-with-icon match-score-input" data-score-control="${prefix}">
      <i aria-hidden="true">#</i>
      <div class="match-score-compact" role="group" aria-label="${label}">
        <input type="text" inputmode="numeric" maxlength="2" name="${prefix}_home" placeholder="0" autocomplete="off" aria-label="Gol noi">
        <b aria-hidden="true">-</b>
        <input type="text" inputmode="numeric" maxlength="2" name="${prefix}_away" placeholder="0" autocomplete="off" aria-label="Gol avversari">
      </div>
      <input type="hidden" name="${prefix}">
    </div>
  </label>`
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
    alert(`Errore Supabase: ${error?.message || 'caricamento calendario non riuscito'}`)
  }
}

const menu = APP_MENU

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
      canCreate: can(ACCESS_CAPABILITIES.CALENDAR_CREATE),
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
      canCreate: can(ACCESS_CAPABILITIES.CALENDAR_CREATE),
      icon,
      escapeHtml,
      formatDateInputValue,
      team: getTeamProfile(),
    })
  }
}

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

function callupsView() {
  return renderCallupsView({
    players: activePlayers(),
    activeMatch: getActiveMatchContext(),
    escapeHtml,
  })
}

function squadView() {
  return renderRosterView({
    players: activePlayers(),
    icon,
    playerIdentity: rosterPlayerIdentity,
    team: getTeamProfile(),
    canEdit: can(ACCESS_CAPABILITIES.ROSTER_EDIT),
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
    activeMatch,
    savedAnalysis,
    analysisEntries: appState.analysisEntries,
    escapeHtml,
    canImport: can(ACCESS_CAPABILITIES.ANALYSIS_IMPORT),
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
    ? createMatchReportRenderer({ escapeHtml }).renderPaper(buildMatchReportModel({ data: reportMeta.report, team: getTeamProfile() }))
    : ''

  return renderMatchReportWorkspaceView({
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
    activeMatch,
    postMatch: service.load(eventModel),
    reportAvailable: Boolean(eventModel?.matchReportData),
    canEdit: can(ACCESS_CAPABILITIES.MATCH_SHEET_EDIT),
    escapeHtml,
  })
}

function boardView() {
  return renderBoardView()
}

function teamSettingsView() {
  return renderTeamSettingsView({ can, capabilities: ACCESS_CAPABILITIES, getTeamProfile, teamFacilities: appState.teamFacilities, teamLogoHtml, escapeHtml })
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
  return renderSettingsView({ can, capabilities: ACCESS_CAPABILITIES, icon })
}

function staffManagementView() {
  return renderStaffManagementView({
    can,
    capabilities: ACCESS_CAPABILITIES,
    staffProfiles: appState.staffProfiles,
    currentUser: appState.currentUser,
    staffFlashMessage: appState.staffFlashMessage,
    getTeamProfile, escapeHtml, technicalRoleOptions, appRoleOptions, accessLevelLabel,
  })
}

function trainingLibraryView() {
  return renderTrainingLibraryView({
    events: appState.calendarEvents,
    canCreate: can(ACCESS_CAPABILITIES.TRAINING_SHEET_CREATE),
    canEditFeedback: can(ACCESS_CAPABILITIES.TRAINING_SHEET_CREATE),
    icon,
  })
}


function tsEscapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const TS_DEPARTMENT_ORDER = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']
const TS_DEPARTMENT_LABELS = {
  Portiere: 'Portieri',
  Difensore: 'Difensori',
  Centrocampista: 'Centrocampisti',
  Attaccante: 'Attaccanti',
}

function toItalianTitleCase(value = '') {
  return String(value)
    .toLocaleLowerCase('it-IT')
    .replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_, prefix, letter) => prefix + letter.toLocaleUpperCase('it-IT'))
}

function getTrainingSheetRosterPlayers() {
  return activePlayers()
    .map((player) => {
      const canonicalName = toItalianTitleCase(player.name)
      const parts = canonicalName.trim().split(/\s+/)
      const surname = parts.pop() || ''
      const firstName = parts.join(' ')
      return {
        ...player,
        canonicalName,
        displayName: `${surname} ${firstName}`.trim(),
        surname,
        department: TS_DEPARTMENT_ORDER.includes(player.role) ? player.role : 'Difensore',
      }
    })
    .sort((a, b) => a.surname.localeCompare(b.surname, 'it', { sensitivity: 'base' }))
}

function teamLocationSelectOptions(selected = '') {
  const locations = getTeamLocationOptions(appState.teamFacilities)
  const selectedValue = String(selected || '').trim()
  const selectedFacility = locations.find((location) => location.toLocaleLowerCase('it-IT') === selectedValue.toLocaleLowerCase('it-IT')) || ''
  const options = ['<option value="">Seleziona campo</option>']
  locations.forEach((location) => {
    options.push(`<option value="${escapeHtml(location)}" ${location === selectedFacility ? 'selected' : ''}>${escapeHtml(location)}</option>`)
  })
  options.push(`<option value="__custom__" ${selectedValue && !selectedFacility ? 'selected' : ''}>Altro campo…</option>`)
  return options.join('')
}

function isConfiguredTeamFacility(value = '') {
  return hasTeamLocation(getTeamLocationOptions(appState.teamFacilities), value)
}

function trainingSheetEditorView() {
  if (!can(ACCESS_CAPABILITIES.TRAINING_SHEET_EDIT)) {
    return `
      <section class="view page-view">
        <div class="page-head"><div><h1>Training Sheet Editor</h1><p><span>ACCESSO RISERVATO</span><b>•</b>Permesso di modifica necessario</p></div></div>
        <div class="placeholder-panel"><h2>Editor non disponibile</h2><p>Puoi consultare le Training Sheet pubblicate direttamente dal Calendario.</p></div>
      </section>
    `
  }

  const rosterPlayers = getTrainingSheetRosterPlayers()

  const playerOptions = TS_DEPARTMENT_ORDER.map((department) => {
    const rows = rosterPlayers.filter((player) => player.department === department).map((player) => `
      <label class="ts-player-option">
        <input type="checkbox" value="${tsEscapeHtml(player.canonicalName)}" data-canonical-name="${tsEscapeHtml(player.canonicalName)}" data-surname="${tsEscapeHtml(player.surname)}">
        <span>${tsEscapeHtml(player.displayName)}</span>
      </label>`).join('')
    return `<div class="ts-roster-department"><strong>${TS_DEPARTMENT_LABELS[department]}</strong>${rows}</div>`
  }).join('')

  const editableSheets = appState.calendarEvents
    .filter((event) => event.trainingSheetPath)
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
    .map((event) => {
      const date = new Date(event.startAt).toLocaleDateString('it-IT')
      const code = event.trainingSheetPath.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || ''
      return `<option value="${tsEscapeHtml(event.id)}">${code ? `ALL_${String(code).padStart(3, '0')} · ` : ''}${date} · ${tsEscapeHtml(event.place || 'Campo da definire')}</option>`
    }).join('')

  return `
    <section class="view page-view ts-manual-editor" data-ts-manual-editor>
      <div class="page-head ts-editor-titlebar">
        <div>
          <h1>Training Sheet Editor</h1>
          <p><span>CREAZIONE SEDUTA</span><b>•</b>Compila, controlla l’anteprima e genera il PDF</p>
        </div>
        <div class="ts-editor-actions-wrap">
          <div class="ts-editor-actions">
            <label class="ts-open-sheet"><span>Training Sheet pubblicate</span><select data-open-training-sheet><option value="">Seleziona una TS</option>${editableSheets}</select></label>
            <button class="staff-button staff-button--primary ts-open-button" type="button" data-open-training-sheet-button disabled>Apri TS</button>
            <details class="ts-more-menu">
              <summary class="staff-button staff-button--secondary ts-more-button" aria-label="Altre azioni">•••</summary>
              <div class="ts-more-menu-popover">
                <button class="ts-menu-danger" type="button" data-reset-training-sheet>Reset editor</button>
              </div>
            </details>
          </div>
          <div class="ts-draft-state ts-draft-state--compact" data-ts-draft-state data-status="draft"><i></i><span>Bozza</span></div>
        </div>
      </div>

      <nav class="ts-step-nav" aria-label="Sezioni Training Sheet">
        ${['Informazioni seduta','Rosa e presenze','Carico e focus fisico','Fasi allenamento','Obiettivo e principi','Riepilogo'].map((label,index)=>`<button type="button" class="${index===0?'is-active':''}" data-ts-step-button="${index+1}"><b>${String(index+1).padStart(2,'0')}</b><span>${label}</span></button>`).join('')}
      </nav>

      <div class="ts-workspace ts-workspace--steps">
        <form class="ts-manual-form" data-ts-manual-form>
          <section class="ts-form-card ts-step is-active" data-ts-step="1">
            <div class="ts-card-head"><span>01</span><div><h2>Informazioni seduta</h2><p>Data, orario, campo e progressivo della sessione.</p></div></div>
            <div class="ts-fields-grid ts-session-grid">
              <label class="ts-field"><span>Data</span><div class="ts-input-icon"><i>${icon('calendar')}</i><input name="date" type="date" required></div></label>
              <label class="ts-field"><span>Orario</span><div class="ts-input-icon"><i>${icon('clock')}</i><input name="time" type="time" value="17:30" required></div></label>
              <label class="ts-field ts-field--location"><span>Campo</span><select name="location">${teamLocationSelectOptions()}</select></label>
              <label class="ts-field ts-custom-location" data-ts-custom-location hidden><span>Nome campo / impianto</span><input name="custom_location" type="text" maxlength="100" autocomplete="off" placeholder="Scrivi il nome del campo"></label>
              <label class="ts-field"><span>Allenamento n°</span><input name="progressive" type="number" min="1" value="1"><small class="ts-field-help">Proposto automaticamente, modificabile</small></label>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="2">
            <div class="ts-card-head"><span>02</span><div><h2>Rosa e presenze</h2><p>Gestisci la disponibilità dei giocatori.</p></div></div>
            <div class="ts-roster-summary">
              <label class="ts-field ts-present-count"><span>Presenti</span><input name="present" type="number" min="0" value="28" readonly aria-readonly="true"><small class="ts-field-help">Calcolati automaticamente dalla Rosa</small></label>
            </div>
            <div class="ts-roster-grid ts-roster-grid--four">
              ${[['absent','Assenti',''],['injured','Infortunati','is-injured'],['differentiated','Differenziato','is-differentiated']].map(([type,label,className]) => `
                <details class="ts-multiselect ${className}" data-player-select="${type}">
                  <summary><span>${label}</span><b data-count>0 selezionati</b></summary>
                  <div class="ts-player-search"><input type="search" data-player-search placeholder="Cerca per nome o cognome" autocomplete="off"><button type="button" data-clear-player-search aria-label="Pulisci ricerca">×</button></div>
                  <div class="ts-player-options">${playerOptions}</div>
                </details>`).join('')}
              <div class="ts-selection-card ts-aggregated-select">
                <span class="ts-selection-card__label">Aggregati</span>
                <details class="ts-aggregated-menu" data-aggregated-menu>
                  <summary><span data-aggregated-summary>Gestisci</span></summary>
                  <div class="ts-aggregated-panel">
                    <label class="ts-aggregated-source-row">
                      <span>Prova</span>
                      <input name="aggregated_prova_count" type="number" min="0" max="99" step="1" value="0" inputmode="numeric" aria-label="Numero giocatori in prova">
                    </label>
                    <label class="ts-aggregated-source-row">
                      <span>Settore giovanile</span>
                      <input name="aggregated_youth_count" type="number" min="0" max="99" step="1" value="0" inputmode="numeric" aria-label="Numero giocatori dal settore giovanile">
                    </label>
                  </div>
                </details>
                <input name="aggregated" type="hidden" value="">
                <input name="aggregated_count" type="hidden" value="0">
              </div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="3">
            <div class="ts-card-head"><span>03</span><div><h2>Carico e focus fisico</h2><p>Collocazione settimanale e parametri fisici della seduta.</p></div></div>
            <div class="ts-choice-block ts-match-day-block"><span class="ts-choice-label">Match Day</span><div class="ts-md-selector" data-ts-md-selector>
              ${['','PREPARAZIONE','MD+1','MD+2','MD+3','MD-3','MD-2','MD-1','MD'].map((md) => `<button type="button" data-md="${md}">${md || '—'}</button>`).join('')}
              <input name="match_day" type="hidden">
            </div></div>
            <div class="ts-load-grid">
              <label class="ts-field ts-load-focus"><span>Focus fisico</span><select name="focus"><option value="">Seleziona</option><option>Metabolico</option><option>Forza</option><option>Resistenza alla velocità</option><option>Velocità</option></select></label>
              <div class="ts-choice-block ts-load-metric ts-load-intensity"><span class="ts-choice-label">Intensità</span><div class="ts-rating" data-rating="intensity">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="intensity" type="hidden"></div></div>
              <div class="ts-choice-block ts-load-metric ts-load-volume"><span class="ts-choice-label">Volume</span><div class="ts-rating" data-rating="volume">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('')}<input name="volume" type="hidden"></div></div>
            </div>
          </section>

          <section class="ts-form-card ts-step" data-ts-step="4">
            <div class="ts-card-head"><span>04</span><div><h2>Fasi allenamento</h2><p>Descrivi la seduta nell’ordine reale di lavoro.</p></div></div>
            <div class="ts-phases-editor" data-ts-phases></div>
            <button class="staff-button staff-button--secondary ts-add-phase" type="button" data-add-phase>＋ Aggiungi fase</button>
          </section>
          <section class="ts-form-card ts-step" data-ts-step="5">
            <div class="ts-card-head"><span>05</span><div><h2>Obiettivo e principi</h2><p>Definisci i riferimenti metodologici della seduta.</p></div></div>
            <div class="ts-pillars" data-ts-pillars>
              ${[
                ['create','Creare il vantaggio'],['keep','Conservare il vantaggio'],['exploit','Sfruttare il vantaggio'],['defend','Difendere il vantaggio']
              ].map(([key,label])=>`<label class="ts-pillar ts-pillar--${key}"><input type="checkbox" name="pillars" value="${label}"><span>${label}</span></label>`).join('')}
            </div>
            <div class="ts-analysis-fields">
              <button class="staff-button staff-button--secondary ts-ai-button" type="button" data-analyze-exercises>✦ Analizza esercitazioni</button>
              <p class="ts-ai-note" data-ai-note>Nessuna modifica viene pubblicata automaticamente.</p>
              <label class="ts-field ts-field-full"><span>Obiettivo della seduta</span><textarea name="objective" rows="3" placeholder="Puoi scriverlo manualmente o generarlo dopo aver compilato i contenitori."></textarea></label>
              <label class="ts-field ts-field-full"><span>Principi di gioco</span><textarea name="principles" rows="4" placeholder="Puoi scriverli manualmente o generarli dopo aver compilato i contenitori."></textarea></label>
            </div>
          </section>

        </form>

        <aside class="ts-live-column ts-step" data-ts-step="6">
          <div class="ts-card-head ts-summary-head"><span>06</span><div><h2>Riepilogo</h2><p>Controlla la Training Sheet prima della pubblicazione.</p></div></div>
          <div class="ts-preview-stage">
            <div class="ts-preview-toolbar"><div><span>ANTEPRIMA LIVE</span><strong>Training Sheet</strong></div><button type="button" data-print-sheet>${icon('sheet')}<span>Crea PDF</span></button></div>
            <div class="ts-paper-frame"><article class="ts-paper" data-ts-preview></article></div>
          </div>
          <p class="ts-publish-note" data-publish-note>Il PDF verrà salvato, archiviato e collegato al giorno del Calendario.</p>
        </aside>
      </div>

      <footer class="match-form-footer ts-step-footer" data-ts-step-footer>
        <button type="button" class="staff-button staff-button--secondary" data-ts-step-prev><span aria-hidden="true">←</span> Indietro</button>
        <span data-ts-step-status>Sezione 1 di 6</span>
        <button type="button" class="staff-button staff-button--primary" data-ts-step-next>Continua <span aria-hidden="true">→</span></button>
      </footer>
    </section>
  `
}

function trainingSheetResultHtml(result) {
  const data = result.data
  const absenceRows = [
    ...data.absences.injured.map(name => `<span class="ts-person-chip is-injured">${tsEscapeHtml(name)}</span>`),
    ...data.absences.absent.map(name => `<span class="ts-person-chip">${tsEscapeHtml(name)}</span>`),
  ].join('') || '<span class="ts-muted">Nessun assente riconosciuto</span>'

  const phases = data.phases.map((phase, index) => `
    <article class="ts-phase-card">
      <div class="ts-phase-title"><span>${index + 1}</span><input name="phase_${index}_title" value="${tsEscapeHtml(phase.title)}"></div>
      <div class="ts-phase-fields">
        <label><span>Durata</span><input name="phase_${index}_duration" type="number" min="1" value="${phase.duration_minutes ?? ''}"></label>
        <label><span>Portieri</span><select name="phase_${index}_goalkeepers"><option value="false" ${phase.goalkeepers ? '' : 'selected'}>No</option><option value="true" ${phase.goalkeepers ? 'selected' : ''}>Sì</option></select></label>
      </div>
      <label><span>Descrizione</span><textarea name="phase_${index}_description">${tsEscapeHtml(phase.description)}</textarea></label>
      <label><span>Contenitori</span><input name="phase_${index}_containers" value="${tsEscapeHtml(phase.containers.join(' · '))}"></label>
      ${phase.exercises?.length ? `<div class="ts-exercise-list">${phase.exercises.map(ex => `<div><strong>${tsEscapeHtml(ex.title)}</strong><span>${ex.duration_minutes ?? '—'}'</span></div>`).join('')}</div>` : ''}
    </article>
  `).join('')

  const missing = result.missing_fields.length
    ? `<div class="ts-checks is-warning"><strong>Da completare</strong>${result.missing_fields.map(item => `<span>• ${tsEscapeHtml(item)}</span>`).join('')}</div>`
    : '<div class="ts-checks is-ready"><strong>Seduta completa</strong><span>Tutti i controlli obbligatori sono superati.</span></div>'

  return `
    <div class="ts-summary-grid">
      <label><span>Data</span><input name="date" type="date" value="${data.date ?? ''}"></label>
      <label><span>Orario</span><input name="time" type="time" value="${data.time ?? ''}"></label>
      <label><span>Campo</span><input name="location" value="${tsEscapeHtml(data.location ?? '')}"></label>
      <label><span>Focus fisico</span><input name="focus_physical" value="${tsEscapeHtml(data.focus_physical ?? '')}"></label>
      <label><span>Intensità</span><input name="intensity" type="number" min="1" max="5" value="${data.intensity ?? ''}"></label>
      <label><span>Volume</span><input name="volume" type="number" min="1" max="5" value="${data.volume ?? ''}"></label>
    </div>
    <div class="ts-section-block"><h3>Assenti riconosciuti</h3><div class="ts-person-list">${absenceRows}</div></div>
    <div class="ts-section-block"><div class="ts-section-title"><h3>Fasi</h3><strong>${data.total_duration_minutes ?? '—'} minuti</strong></div><div class="ts-phases">${phases}</div></div>
    <div class="ts-section-block ts-bottom-fields">
      <label><span>Obiettivo della seduta</span><textarea name="objective">${tsEscapeHtml(data.objective ?? '')}</textarea></label>
      <label><span>Principi di gioco</span><input name="principles" value="${tsEscapeHtml(data.principles.join(' · '))}"></label>
    </div>
    ${missing}
    <div class="ts-autosave-row" aria-live="polite"><span class="ts-autosave-dot"></span><span data-ts-save-message>Bozza non ancora sincronizzata.</span></div>
  `
}


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

function legacyMatchCompatibilityView() {
  if (!can(ACCESS_CAPABILITIES.MATCH_SHEET_EDIT)) {
    return `<section class="placeholder"><h1>Sezione Match non disponibile</h1><p>Il tuo livello di accesso non consente di modificare questa partita.</p></section>`
  }

  const formations = COMMON_FORMATIONS
  const team = getTeamProfile()
  const activeMatch = getActiveMatchContext()
  const opponentName = activeMatch?.opponent || 'Avversario da definire'
  const editorUserName = profileFullName(appState.currentUserProfile, appState.currentUser)
  const editorRoleLabel = roleLabel(appState.currentUserRole)
  const editorUserInitial = editorUserName.charAt(0).toUpperCase() || 'N'
  const rosterOptions = getTrainingSheetRosterPlayers()
    .map((player) => `<option value="${escapeHtml(player.canonicalName)}">${escapeHtml(player.surname)} ${escapeHtml(player.firstName)}</option>`)
    .join('')

  return `
    <section class="match-editor staff-editor-template" data-match-editor>
      <header class="match-page-header staff-page-header">
        <div class="match-page-header__copy">
          <span class="match-page-header__eyebrow">SCHEDA PARTITA</span>
          <h1>Compatibilità Match</h1>
          <p>Motore interno di compatibilità dati.</p>
        </div>
        <div class="match-page-header__right">
          <div class="match-page-header__actions staff-page-header__actions">
            ${matchContextBackButtonHtml()}
            <button class="staff-button staff-button--danger match-reset-button" type="button" data-match-reset>Reset editor</button>
          </div>
          <div class="match-page-header__profile" aria-label="Utente corrente">
            <span class="match-page-header__avatar" aria-hidden="true">${escapeHtml(editorUserInitial)}</span>
            <span><strong>${escapeHtml(editorUserName)}</strong><small>${escapeHtml(editorRoleLabel)}</small></span>
          </div>
        </div>
      </header>

      <nav class="match-step-nav match-step-nav--five staff-stepper" aria-label="Sezioni Match Sheet">
        ${['Dati gara',team.shortName || 'Propria squadra','Avversario','Eventi e note','Riepilogo'].map((label,i)=>`<button type="button" class="staff-stepper__item ${i===0?'is-active':''}" data-match-step-button="${i+1}"><b>${String(i+1).padStart(2,'0')}</b><span>${label}</span></button>`).join('')}
      </nav>

      <form data-match-form>
        <section class="match-step staff-card is-active" data-match-step="1">
          <header class="section-title"><span>01</span><div><h2>Dati gara</h2><p>Informazioni ufficiali e risultato.</p></div></header>
          <div class="match-form-grid three match-game-data-grid">
            <label><span>Data</span><div class="match-input-with-icon"><i aria-hidden="true">▣</i><input type="date" name="date" required></div></label>
            <label><span>Ora</span><div class="match-input-with-icon"><i aria-hidden="true">◷</i><input type="time" name="time" value="15:30"></div></label>
            <label><span>Competizione</span><div class="match-input-with-icon"><i aria-hidden="true">★</i><select name="competition"><option>Campionato</option><option>Coppa</option><option>Amichevole</option></select></div></label>
            <label><span>Avversario</span><div class="match-input-with-icon"><i aria-hidden="true">VS</i><input name="opponent" value="Da definire" required></div></label>
            <label><span>Casa / Trasferta</span><div class="match-input-with-icon"><i aria-hidden="true">⌂</i><select name="venue"><option>Casa</option><option>Trasferta</option><option>Campo neutro</option></select></div></label>
            <label><span>Campo</span><div class="match-input-with-icon"><i aria-hidden="true">⌖</i><input name="location" placeholder="Impianto sportivo"></div></label>
            ${scoreFieldsHtml('result','Risultato finale')}
            ${scoreFieldsHtml('half_result','Risultato 1° tempo')}
            <label><span>Giornata / turno</span><div class="match-input-with-icon"><i aria-hidden="true">#</i><input name="round" placeholder="Es. 12ª giornata"></div></label>
          </div>
        </section>

        ${renderMatchSquadStep({
          teamName: team.shortName || 'Propria squadra',
          formationOptions: formationOptionsHtml('4-4-2'),
          rosterOptions,
        })}

        <section class="match-step staff-card" data-match-step="3">
          <header class="section-title"><span>03</span><div><h2>${escapeHtml(opponentName)}</h2><p>Distinta, sistemi utilizzati e analisi per fase di gioco.</p></div></header>
          <div class="opponent-top-grid opponent-top-grid--visual"><label class="upload-card"><span>Foto distinta avversaria</span><input type="file" name="opponent_sheet" accept="image/*" capture="environment"><b>Scatta o carica foto</b><img data-opponent-sheet-preview hidden alt="Anteprima distinta"></label><div class="opponent-visual-panel"><div class="opponent-panel-head"><div><h3>Disposizione avversaria</h3><p>Seleziona il sistema e sposta liberamente le pedine.</p></div></div><div class="opponent-football-pitch" data-opponent-pitch><div class="pitch-markings"><span class="pitch-goal pitch-goal-top"></span><span class="pitch-goal pitch-goal-bottom"></span></div>${Array.from({length:11},(_,i)=>`<button type="button" class="opponent-token" data-opponent-token="${i}" style="--x:50;--y:${88-i*7}" aria-label="Sposta giocatore avversario ${i+1}">${i+1}</button><input type="hidden" name="opponent_position_x_${i}" value="50"><input type="hidden" name="opponent_position_y_${i}" value="${88-i*7}">`).join('')}</div></div></div>
          <div class="opponent-token-style">
            <div><h3>Stile pedine avversarie</h3><p>Personalizza colori e maglia per riconoscere subito la squadra.</p></div>
            <label><span>Colore interno</span><input type="color" name="opponent_token_primary" value="#9f1239"></label>
            <label><span>Colore bordo / secondo colore</span><input type="color" name="opponent_token_secondary" value="#f8fafc"></label>
            <label><span>Stile</span><select name="opponent_token_pattern"><option value="solid">Tinta unita</option><option value="vertical">Strisce verticali</option><option value="horizontal">Strisce orizzontali</option></select></label>
          </div>
          <div class="opponent-formations-panel opponent-formations-panel--full"><div class="opponent-panel-head"><div><h3>Sistemi di gioco avversari</h3><p>Sistema iniziale ed eventuali variazioni.</p></div></div><div class="opponent-formations-list" data-opponent-formations></div><button class="portal-action-button portal-action-button--secondary opponent-add-system-button" type="button" data-add-opponent-formation><span aria-hidden="true">＋</span> Aggiungi cambio sistema</button></div>
          <div class="opponent-phase-columns"><article><h3>Fase di possesso</h3>${['Costruzione da rimessa','Costruzione media','Sviluppo e rifinitura','Finalizzazione','Transizione positiva'].map((label,i)=>`<label><span>${label}</span><textarea name="opponent_possession_note_${i}" rows="4"></textarea></label>`).join('')}</article><article><h3>Fase di non possesso</h3>${['Prima pressione','Blocco medio','Blocco basso','Transizione negativa'].map((label,i)=>`<label><span>${label}</span><textarea name="opponent_nonpossession_note_${i}" rows="4"></textarea></label>`).join('')}</article></div>
          <section class="set-pieces-analysis"><div class="set-pieces-title"><div><h3>Palle inattive avversarie</h3><p>Struttura, battitore, traiettoria e zona di attacco.</p></div></div><div class="set-pieces-grid"><article><h4>Calci d’angolo</h4><textarea name="opponent_corners" rows="5"></textarea></article><article><h4>Punizioni laterali</h4><textarea name="opponent_wide_free_kicks" rows="5"></textarea></article></div><div class="penalty-analysis"><label class="penalty-toggle"><input type="checkbox" name="opponent_penalty_taken"> <span>Rigore battuto</span></label><label><span>Esito</span><select name="opponent_penalty_result"><option value="">Da definire</option><option>Gol</option><option>Parato</option><option>Fuori</option><option>Palo / traversa</option></select></label><label><span>Direzione</span><select name="opponent_penalty_direction"><option value="">Da definire</option><option>Sinistra portiere</option><option>Centro</option><option>Destra portiere</option></select></label><label class="penalty-note"><span>Dettagli</span><input name="opponent_penalty_note"></label></div></section>
          <div class="section-insight-grid section-insight-grid--three"><label><span>Punti di forza avversari</span><textarea name="opp_strengths" rows="4"></textarea></label><label><span>Punti deboli avversari</span><textarea name="opp_weaknesses" rows="4"></textarea></label><label><span>Indicazioni per il ritorno</span><textarea name="return_notes" rows="4"></textarea></label></div>
        </section>

        <section class="match-step staff-card" data-match-step="4">
          <header class="section-title"><span>04</span><div><h2>Eventi e note</h2><p>Minuti, sostituzioni, gol, sanzioni e lettura della partita.</p></div></header>
          <div class="match-events-grid match-events-grid--dynamic"><article class="match-event-card"><div class="match-event-card-head"><div><span>CAMBI</span><h3>Sostituzioni</h3></div><button class="icon-add-button" type="button" data-add-match-row="substitution">＋</button></div><div data-substitutions></div></article><article class="match-event-card"><div class="match-event-card-head"><div><span>RETE</span><h3>Marcatori e assist</h3></div><button class="icon-add-button" type="button" data-add-match-row="goal">＋</button></div><div data-goals></div></article><article class="match-event-card"><div class="match-event-card-head"><div><span>DISCIPLINA</span><h3>Sanzioni</h3></div><button class="icon-add-button" type="button" data-add-match-row="card">＋</button></div><div data-cards></div></article></div>
          <div class="notes-mode"><label><span>Struttura note</span><select name="notes_mode"><option value="free">Campo unico</option><option value="halves">Due tempi</option><option value="quarters">Intervalli da 15 minuti</option></select></label></div><div data-note-fields></div>
        </section>

        <section class="match-step staff-card" data-match-step="5">
          <header class="section-title"><span>05</span><div><h2>Riepilogo Match Sheet</h2><p>Controlla i dati inseriti e salva la scheda. Il report PDF si genera dall’Analisi gara.</p></div></header><div class="match-report-preview" data-match-report-preview></div>
        </section>

        ${editorFooterHtml({ progressText: 'Passaggio 1 di 5', progressAttribute: 'data-match-progress', previousAttribute: 'data-match-prev', nextAttribute: 'data-match-next', saveAttribute: 'data-match-save-final', saveLabel: 'Salva Match Sheet' })}
      </form>
    </section>`
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

function trainingSheetPreviewHtml(event) {
  if (!event.trainingSheetUrl) {
    return '<small>Nessuna Training Sheet collegata.</small>'
  }

  const lowerPath = String(
    event.trainingSheetPath ?? '',
  ).toLowerCase()

  if (lowerPath.endsWith('.pdf')) {
    return `
      <iframe
        class="training-sheet-preview training-sheet-preview--pdf"
        src="${event.trainingSheetUrl}#toolbar=0&navpanes=0&scrollbar=1"
        title="Anteprima Training Sheet"
      ></iframe>
    `
  }

  return `
    <img
      class="training-sheet-preview"
      src="${event.trainingSheetUrl}"
      alt="Anteprima Training Sheet"
    >
  `
}

function trainingSheetStructuredHtml(event) {
  const data = event.editorData
  if (!data) return ''
  const phases = Array.isArray(data.phases) ? data.phases : []
  return `
    <section class="drawer-ts-readable">
      <div class="drawer-ts-summary">
        <span><small>Codice</small><b>ALL_${String(data.progressive || '---').padStart(3,'0')}</b></span>
        <span><small>Focus</small><b>${escapeHtml(data.focus || '—')}</b></span>
        <span><small>Presenti</small><b>${escapeHtml(data.present ?? event.presentCount ?? '—')}</b></span>
      </div>
      ${data.pillars?.length ? `<div class="drawer-ts-pillars">${data.pillars.map((pillar)=>`<span>${escapeHtml(pillar)}</span>`).join('')}</div>` : ''}
      <div class="drawer-ts-text"><small>OBIETTIVO</small><p>${escapeHtml(data.objective || 'Da definire')}</p></div>
      <div class="drawer-ts-text"><small>PRINCIPI</small><p>${escapeHtml(data.principles || 'Da definire')}</p></div>
      <div class="drawer-ts-phases">${phases.map((phase,index)=>`<article><header><b>FASE ${index+1}</b><span>${escapeHtml(phase.duration || '—')}'</span></header><strong>${escapeHtml(phase.title || 'Senza titolo')}</strong><p>${escapeHtml(phase.description || '')}</p><small>Portieri: ${phase.goalkeepers==='yes'?'Sì':phase.goalkeepers==='separate'?'Separati':'No'}</small></article>`).join('')}</div>
    </section>`
}

function playerProfileModalHtml(player) {
  const identity = rosterPlayerIdentity(player)
  const legacyKey = rosterPlayerKey(player)
  const saved = appState.playerProfiles[identity] || appState.playerProfiles[legacyKey] || {}
  return `
    <div class="new-event-modal-backdrop player-profile-backdrop" data-close-player-profile>
      <section class="new-event-modal player-profile-modal" role="dialog" aria-modal="true" aria-labelledby="playerProfileTitle">
        <div class="new-event-modal__head"><div><span>SCHEDA GIOCATORE</span><h2 id="playerProfileTitle">${escapeHtml(player.name)}</h2></div><button type="button" class="new-event-modal__close" data-close-player-profile>${icon('close')}</button></div>
        <form class="player-profile-form" data-player-profile-form data-player-id="${escapeHtml(player.id || '')}" data-player-legacy-key="${escapeHtml(legacyKey)}">
          <div class="player-profile-scroll">
          <div class="player-profile-grid">
            <label class="form-field"><span>Nome e cognome</span><input name="full_name" value="${escapeHtml(saved.full_name || player.name)}" required></label>
            <label class="form-field"><span>Ruolo</span><select name="role">${['Portiere','Difensore','Centrocampista','Attaccante'].map(role=>`<option ${role===(saved.role||player.role)?'selected':''}>${role}</option>`).join('')}</select></label>
            <label class="form-field"><span>Anno di nascita</span><input name="birth_year" inputmode="numeric" value="${escapeHtml(saved.birth_year || player.year || '')}"></label>
            <label class="form-field"><span>Piede preferito</span><select name="preferred_foot"><option value="">Da definire</option><option value="DX" ${(saved.preferred_foot||player.foot)==='DX'?'selected':''}>Destro</option><option value="SX" ${(saved.preferred_foot||player.foot)==='SX'?'selected':''}>Sinistro</option><option value="AMB" ${saved.preferred_foot==='AMB'?'selected':''}>Ambidestro</option></select></label>
            <label class="form-field"><span>Altezza (cm)</span><input name="height_cm" type="number" min="120" max="230" value="${escapeHtml(saved.height_cm || '')}"></label>
            <label class="form-field"><span>Peso (kg)</span><input name="weight_kg" type="number" min="35" max="180" step="0.1" value="${escapeHtml(saved.weight_kg || '')}"></label>
            <label class="form-field"><span>Telefono</span><input name="phone" type="tel" value="${escapeHtml(saved.phone || '')}"></label>
            <label class="form-field"><span>Email</span><input name="email" type="email" value="${escapeHtml(saved.email || '')}"></label>
          </div>
          <div class="player-profile-notes-grid">
            <label class="form-field"><span>Note tecniche</span><textarea name="technical_notes" rows="4">${escapeHtml(saved.technical_notes || '')}</textarea></label>
            <label class="form-field"><span>Note infortuni</span><textarea name="injury_notes" rows="4">${escapeHtml(saved.injury_notes || '')}</textarea></label>
          </div>
          <p class="form-message" data-player-profile-message></p>
          </div>
          <div class="modal-actions player-profile-actions"><button type="button" class="ghost-button" data-close-player-profile>Annulla</button><button type="submit" class="primary-action">Salva scheda</button></div>
        </form>
      </section>
    </div>`
}


function rosterPlayerModalHtml(player = null) {
  const isEditing = Boolean(player)
  const key = rosterPlayerKey(player || {})
  return `
    <div class="new-event-modal-backdrop" data-close-roster-player>
      <section class="new-event-modal roster-player-modal" role="dialog" aria-modal="true" aria-labelledby="rosterPlayerTitle">
        <div class="new-event-modal__head">
          <div><span>ROSA SQUADRA</span><h2 id="rosterPlayerTitle">${isEditing ? 'Modifica giocatore' : 'Nuovo giocatore'}</h2></div>
          <button type="button" class="new-event-modal__close" data-close-roster-player>${icon('close')}</button>
        </div>
        <form class="roster-player-form" data-roster-player-form>
          <input type="hidden" name="id" value="${escapeHtml(player?.id || '')}">
          <input type="hidden" name="key" value="${escapeHtml(key)}">
          <div class="player-profile-grid">
            <label class="form-field"><span>Nome e cognome</span><input name="name" value="${escapeHtml(player?.name || '')}" required></label>
            <label class="form-field"><span>Ruolo</span><select name="role">${['Portiere','Difensore','Centrocampista','Attaccante'].map((role)=>`<option value="${role}" ${role===(player?.role || 'Difensore')?'selected':''}>${role}</option>`).join('')}</select></label>
            <label class="form-field"><span>Anno di nascita</span><input name="year" inputmode="numeric" maxlength="4" value="${escapeHtml(player?.year || '')}" placeholder="Es. 2007"></label>
            <label class="form-field"><span>Piede preferito</span><select name="foot"><option value="">Da definire</option><option value="DX" ${player?.foot==='DX'?'selected':''}>Destro</option><option value="SX" ${player?.foot==='SX'?'selected':''}>Sinistro</option><option value="AMB" ${player?.foot==='AMB'?'selected':''}>Ambidestro</option></select></label>
            <label class="form-field"><span>Numero maglia</span><input name="number" type="number" min="1" max="99" value="${escapeHtml(player?.number ?? '')}"></label>
            <label class="form-field"><span>Stato</span><select name="status">${['Disponibile','Infortunato','Differenziato','Non disponibile'].map((status)=>`<option value="${status}" ${status===(player?.status || 'Disponibile')?'selected':''}>${status}</option>`).join('')}</select></label>
          </div>
          <p class="form-message" data-roster-player-message></p>
          <div class="modal-actions">
            <button type="button" class="ghost-button" data-close-roster-player>Annulla</button>
            <button type="submit" class="primary-action">${isEditing ? 'Salva modifiche' : 'Aggiungi alla Rosa'}</button>
          </div>
        </form>
      </section>
    </div>`
}

function drawerHtml(event) {
  const eventDate = new Date(event.startAt)
  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(eventDate)

  return `
    <div class="drawer-backdrop" data-close-drawer></div>

    <aside class="event-drawer">
      <div class="drawer-head">
        <div>
          <span class="event-type-badge event-type-badge--${event.type}">
            ${eventTypeIcon(event.type, icon)}
            ${event.title.toUpperCase()}
          </span>
          <h2 class="drawer-event-date">${formattedDate}</h2>
          <time class="drawer-event-time">${event.time}</time>
        </div>

        <button type="button" data-close-drawer aria-label="Chiudi">
          ${icon('close')}
        </button>
      </div>

      <div class="drawer-section">
        <div class="event-info-grid">
          <div class="event-info-card">
            <span>Campo</span>
            <strong class="event-info-card__value">
              <i class="event-info-card__icon">${icon('location')}</i>
              ${event.place || 'Non indicato'}
            </strong>
          </div>

          ${event.type === 'match' && event.matchType ? `
                <div class="event-info-card">
                  <span>Tipo partita</span>
                  <strong class="event-info-card__value">${escapeHtml(matchTypeLabel(event.matchType))}</strong>
                </div>` : ''}

          ${event.type === 'match' && event.opponent ? `
                <div class="event-info-card">
                  <span>Avversario</span>
                  <strong class="event-info-card__value">${escapeHtml(event.opponent)}</strong>
                </div>` : ''}

          ${isTrainingEventType(event.type)
            ? `
                <div class="event-info-card">
                  <span>Match Day</span>
                  <strong class="event-info-card__value">${event.matchDay || 'Nessuno'}</strong>
                </div>
              `
            : ''}
        </div>
      </div>

      ${isTrainingEventType(event.type)
        ? `
            <div class="drawer-section">
              <label>Training Sheet</label>

              <div class="training-sheet-meta">
                <div><span>Data</span><strong>${eventDate.toLocaleDateString('it-IT')}</strong></div>
                <div><span>Ora</span><strong>${event.time}</strong></div>
                <div><span>Campo</span><strong>${event.place || 'Non indicato'}</strong></div>
                <div><span>Match Day</span><strong>${event.matchDay || 'Nessuno'}</strong></div>
                <div><span>Presenti</span><strong>${event.presentCount ?? '—'}${event.squadTotal ? `/${event.squadTotal}` : ''}</strong></div>
              </div>

              ${trainingSheetStructuredHtml(event)}
              <div class="training-sheet-preview-wrap">
                ${trainingSheetPreviewHtml(event)}
              </div>

              ${event.trainingSheetUrl && can(ACCESS_CAPABILITIES.TRAINING_SHEET_VIEW_PUBLISHED) ? `
                <div class="drawer-ts-view-actions">
                  <button class="wide-button drawer-sheet-link" type="button" data-view-training-sheet="${event.id}"><span class="drawer-sheet-link__icon">${icon('sheet')}</span><span>Visualizza Training Sheet</span></button>
                </div>` : ''}
              ${can(ACCESS_CAPABILITIES.TRAINING_SHEET_EDIT) ? `
                <div class="drawer-ts-owner-actions">
                  <button class="wide-button" type="button" data-open-training-sheet-editor="${event.id}">${icon('sheet')} ${trainingCalendarStatus(event) === 'published' ? 'Apri nel TS Editor' : 'Crea Training Sheet'}</button>
                </div>` : ''}
            </div>
          `
        : ''}

      ${can(ACCESS_CAPABILITIES.CALENDAR_UPDATE) || can(ACCESS_CAPABILITIES.CALENDAR_DELETE)
        ? `
            <div class="drawer-actions">
              ${can(ACCESS_CAPABILITIES.CALENDAR_UPDATE) ? `<button
                type="button"
                data-edit-event="${event.id}"
              >
                Modifica evento
              </button>` : ''}

              ${can(ACCESS_CAPABILITIES.CALENDAR_DELETE) ? `<button
                class="drawer-delete-button"
                type="button"
                data-delete-event="${event.id}"
              >
                Elimina evento
              </button>` : ''}
            </div>
          `
        : ''}
    </aside>
  `
}

function newEventModalHtml(selectedDate = formatDateInputValue(new Date())) {
  const today = selectedDate

  return `
    <div class="new-event-modal-backdrop" data-close-new-event>
      <section
        class="new-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newEventTitle"
      >
        <div class="new-event-modal__head">
          <div>
            <span>CALENDARIO</span>
            <h2 id="newEventTitle">Nuovo evento</h2>
          </div>

          <button
            class="new-event-modal__close"
            type="button"
            data-close-new-event
            aria-label="Chiudi"
          >
            ${icon('close')}
          </button>
        </div>

        <form id="newEventForm" class="new-event-form">
          <label>
            Tipo evento
            <select name="eventType" required>
              <option value="training">Allenamento</option>
              <option value="match">Partita</option>
              <option value="meeting">Riunione</option>
              <option value="rest">Riposo</option>
            </select>
          </label>

          <div data-match-fields hidden>
            <label>
              Tipo partita
              <select name="matchType">
                <option value="friendly">Amichevole</option>
                <option value="cup">Coppa</option>
                <option value="league">Campionato</option>
              </select>
            </label>
            <label>
              Avversario
              <input name="opponent" type="text" maxlength="80" autocomplete="off" value="Da definire" placeholder="Nome squadra avversaria">
            </label>
          </div>

          <div data-standard-event-fields>
            <div class="new-event-form__row">
              <label>
                Data
                <input name="date" type="date" value="${today}" required>
              </label>

              <label>
                Ora
                <input name="time" type="time" value="17:30" required>
              </label>
            </div>

            <label>
              Campo
              <select name="location" required>
                ${teamLocationSelectOptions()}
              </select>
            </label>

            <label data-custom-location hidden>
              Nome campo / impianto
              <input name="customLocation" type="text" maxlength="100" autocomplete="off" placeholder="Scrivi il nome del campo">
            </label>

          <label data-md-field>
            MD
            <select name="matchDay">
              <option value="">Nessuno</option>
              <option value="MD">MD</option>
              <option value="MD-1">MD-1</option>
              <option value="MD-2">MD-2</option>
              <option value="MD-3">MD-3</option>
              <option value="MD+1">MD+1</option>
              <option value="MD+2">MD+2</option>
              <option value="MD+3">MD+3</option>
            </select>
          </label>

          <div class="new-event-form__document-info" data-training-sheet-info>
            <span>Training Sheet</span>
            <strong>Si crea dopo aver salvato l’allenamento</strong>
            <small>Salva l’evento, poi usa “Crea Training Sheet” dal dettaglio nel Calendario.</small>
          </div>

          </div>

          <label data-rest-fields hidden>
            Note riposo
            <textarea name="restNote" rows="7" maxlength="1200" placeholder="Motivo, indicazioni o comunicazioni per la giornata di riposo"></textarea>
          </label>

          <p
            id="newEventMessage"
            class="new-event-form__message"
            aria-live="polite"
          ></p>

          <div class="new-event-modal__actions">
            <button
              class="new-event-modal__secondary"
              type="button"
              data-close-new-event
            >
              Annulla
            </button>

            <button
              id="saveNewEventButton"
              class="primary-action"
              type="submit"
            >
              Salva evento
            </button>
          </div>
        </form>
      </section>
    </div>
  `
}

function editEventModalHtml(event) {
  const localDate = new Date(event.startAt)
  const date = formatDateInputValue(localDate)
  const time = localDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const restNote = (() => {
    try { return JSON.parse(event.rawNotes || '{}')?.rest_note || '' } catch { return '' }
  })()

  return `
    <div class="new-event-modal-backdrop" data-close-new-event>
      <section
        class="new-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editEventTitle"
      >
        <div class="new-event-modal__head">
          <div>
            <span>CALENDARIO</span>
            <h2 id="editEventTitle">Modifica evento</h2>
          </div>

          <button
            class="new-event-modal__close"
            type="button"
            data-close-new-event
            aria-label="Chiudi"
          >
            ${icon('close')}
          </button>
        </div>

        <form id="editEventForm" class="new-event-form">
          <input name="eventId" type="hidden" value="${event.id}">

          <label>
            Tipo evento
            <select name="eventType" required>
              <option value="training" ${event.type === 'training' ? 'selected' : ''}>
                Allenamento
              </option>
              <option value="match" ${event.type === 'match' ? 'selected' : ''}>
                Partita
              </option>
              <option value="meeting" ${event.type === 'meeting' ? 'selected' : ''}>
                Riunione
              </option>
              <option value="rest" ${event.type === 'rest' ? 'selected' : ''}>
                Riposo
              </option>
            </select>
          </label>

          <div data-match-fields ${event.type === 'match' ? '' : 'hidden'}>
            <label>
              Tipo partita
              <select name="matchType">
                <option value="friendly" ${event.matchType === 'friendly' ? 'selected' : ''}>Amichevole</option>
                <option value="cup" ${event.matchType === 'cup' ? 'selected' : ''}>Coppa</option>
                <option value="league" ${event.matchType === 'league' ? 'selected' : ''}>Campionato</option>
              </select>
            </label>
            <label>
              Avversario
              <input name="opponent" type="text" maxlength="80" autocomplete="off" value="${escapeHtml(event.opponent || 'Da definire')}" placeholder="Nome squadra avversaria">
            </label>
          </div>

          <div data-standard-event-fields>
          <div class="new-event-form__row">
            <label>
              Data
              <input name="date" type="date" value="${date}" required>
            </label>

            <label>
              Ora
              <input name="time" type="time" value="${time}" required>
            </label>
          </div>

          <label>
            Campo
            <select name="location" required>
              ${teamLocationSelectOptions(event.place)}
            </select>
          </label>

          <label data-custom-location hidden>
            Nome campo / impianto
            <input name="customLocation" type="text" maxlength="100" autocomplete="off" value="${escapeHtml(event.place && !isConfiguredTeamFacility(event.place) ? event.place : '')}" placeholder="Scrivi il nome del campo">
          </label>

          <label data-md-field ${isTrainingEventType(event.type) ? '' : 'hidden'}>
            MD
            <select name="matchDay">
              <option value="" ${!event.matchDay ? 'selected' : ''}>Nessuno</option>
              <option value="MD" ${event.matchDay === 'MD' ? 'selected' : ''}>MD</option>
              <option value="MD-1" ${event.matchDay === 'MD-1' ? 'selected' : ''}>MD-1</option>
              <option value="MD-2" ${event.matchDay === 'MD-2' ? 'selected' : ''}>MD-2</option>
              <option value="MD-3" ${event.matchDay === 'MD-3' ? 'selected' : ''}>MD-3</option>
              <option value="MD+1" ${event.matchDay === 'MD+1' ? 'selected' : ''}>MD+1</option>
              <option value="MD+2" ${event.matchDay === 'MD+2' ? 'selected' : ''}>MD+2</option>
              <option value="MD+3" ${event.matchDay === 'MD+3' ? 'selected' : ''}>MD+3</option>
            </select>
          </label>

          <div
            class="new-event-form__document-info"
            data-training-sheet-info
            ${isTrainingEventType(event.type) ? '' : 'hidden'}
          >
            <span>Training Sheet</span>
            <strong>${event.trainingSheetPath ? `${trainingSheetName(event)} · Pubblicata` : 'Nessuna Training Sheet collegata'}</strong>
            <small>${event.trainingSheetPath
              ? 'La Training Sheet si modifica dal suo Editor, non caricando un file dal Calendario.'
              : 'Salva l’evento, poi usa “Crea Training Sheet” dal dettaglio nel Calendario.'}</small>
          </div>

          </div>

          <label data-rest-fields ${event.type === 'rest' ? '' : 'hidden'}>
            Note riposo
            <textarea name="restNote" rows="7" maxlength="1200" placeholder="Motivo, indicazioni o comunicazioni per la giornata di riposo">${escapeHtml(restNote)}</textarea>
          </label>

          <p
            id="newEventMessage"
            class="new-event-form__message"
            aria-live="polite"
          ></p>

          <div class="new-event-modal__actions">
            <button
              class="new-event-modal__secondary"
              type="button"
              data-close-new-event
            >
              Annulla
            </button>

            <button
              id="saveNewEventButton"
              class="primary-action"
              type="submit"
            >
              Salva modifiche
            </button>
          </div>
        </form>
      </section>
    </div>
  `
}

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

  const logoutButton =
    document.querySelector('#logoutButton')

  const profileMenuButton =
    document.querySelector('#profileMenuButton')

  const profileDropdown =
    document.querySelector('#profileDropdown')

  const mobileMoreToggle = document.querySelector('[data-mobile-more-toggle]')
  const mobileMoreSheet = document.querySelector('[data-mobile-more-sheet]')
  const mobileMoreClose = document.querySelector('[data-mobile-more-close]')

  const closeMobileMore = () => {
    if (!mobileMoreSheet || !mobileMoreToggle) return
    mobileMoreSheet.classList.remove('is-open')
    mobileMoreSheet.setAttribute('aria-hidden', 'true')
    mobileMoreToggle.setAttribute('aria-expanded', 'false')
  }

  const openMobileMore = () => {
    if (!mobileMoreSheet || !mobileMoreToggle) return
    mobileMoreSheet.classList.add('is-open')
    mobileMoreSheet.setAttribute('aria-hidden', 'false')
    mobileMoreToggle.setAttribute('aria-expanded', 'true')
  }

  const toggleMobileMore = () => {
    if (!mobileMoreSheet?.classList.contains('is-open')) openMobileMore()
    else closeMobileMore()
  }

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

    const mobileMoreHasActiveSection = [...document.querySelectorAll('.mobile-more-item')]
      .some((item) => item.dataset.section === sectionKey)
    mobileMoreToggle?.classList.toggle('is-active', mobileMoreHasActiveSection)
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

  function closeNewEventModal() {
    if (!modalRoot) {
      return
    }

    modalRoot.innerHTML = ''
    document.body.classList.remove('new-event-modal-open')
  }

  function bindEventTypeFields(form) {
    const typeSelect = form?.querySelector('[name="eventType"]')
    const trainingSheetInfo = form?.querySelector('[data-training-sheet-info]')
    const mdField = form?.querySelector('[data-md-field]')
    const mdSelect = form?.querySelector('[name="matchDay"]')
    const matchFields = form?.querySelector('[data-match-fields]')
    const matchTypeSelect = form?.querySelector('[name="matchType"]')
    const opponentInput = form?.querySelector('[name="opponent"]')
    const locationSelect = form?.querySelector('[name="location"]')
    const customLocationField = form?.querySelector('[data-custom-location]')
    const customLocationInput = form?.querySelector('[name="customLocation"]')
    const standardFields = form?.querySelector('[data-standard-event-fields]')
    const restFields = form?.querySelector('[data-rest-fields]')

    if (!typeSelect) return

    const refreshLocation = () => {
      const isCustom = locationSelect?.value === '__custom__'
      if (customLocationField) customLocationField.hidden = !isCustom
      if (customLocationInput) {
        customLocationInput.required = Boolean(isCustom)
        if (!isCustom) customLocationInput.value = ''
      }
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
        if (currentLocation && customLocationInput) customLocationInput.value = currentLocation
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
      if (locationSelect) locationSelect.required = !isRest
      if (customLocationInput && isRest) customLocationInput.required = false
    }

    typeSelect.addEventListener('change', refresh)
    locationSelect?.addEventListener('change', refreshLocation)
    refresh()
    refreshLocation()
  }

  function closeSeasonCalendarImport() {
    if (modalRoot) modalRoot.innerHTML = ''
    document.body.classList.remove('new-event-modal-open')
  }

  function openSeasonCalendarImport(rows = []) {
    if (!can(ACCESS_CAPABILITIES.CALENDAR_CREATE) || !modalRoot) return
    const matchCalendarService = createMatchCalendarService({
      createEvent: createCalendarEvent,
      updateEvent: updateCalendarEvent,
      reloadEvents: null,
    })
    const importService = createSeasonCalendarImportService({
      createMatch: (row) => matchCalendarService.createMatch(row),
      reloadEvents: loadCalendarEvents,
    })
    const preview = importService.preview(rows, appState.calendarEvents)
    modalRoot.innerHTML = renderSeasonCalendarImportModal({ rows: preview.rows, escapeHtml })
    document.body.classList.add('new-event-modal-open')

    modalRoot.querySelectorAll('[data-close-season-import]').forEach((node) => node.addEventListener('click', (event) => {
      if (node.classList.contains('season-import-backdrop') && event.target !== node) return
      closeSeasonCalendarImport()
    }))

    modalRoot.querySelector('[data-season-import-file]')?.addEventListener('change', async (event) => {
      const file = event.currentTarget.files?.[0]
      if (!file) return
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
      if (!isCsv) {
        alert('PDF e immagini sono previsti dal flusso R19. Il collegamento dell’estrattore documentale verrà completato sul calendario ufficiale reale, così evitiamo una lettura fragile o specifica di un formato ipotetico.')
        event.currentTarget.value = ''
        return
      }
      const parsedRows = parseSeasonCalendarCsv(await file.text())
      if (!parsedRows.length) {
        alert('Il file non contiene righe importabili.')
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
        alert(`Importazione completata: ${result.created.length} nuove partite, ${result.skipped.length} già presenti.`)
      } catch (error) {
        if (message) message.textContent = error?.message || 'Importazione non riuscita.'
        submit.disabled = false
      }
    })
  }

  function closeCalendarBulkManagement() {
    if (modalRoot) modalRoot.innerHTML = ''
    document.body.classList.remove('new-event-modal-open')
  }

  function readCalendarBulkCriteria(form) {
    const data = new FormData(form)
    return {
      mode: String(data.get('mode') || 'range'),
      from: String(data.get('from') || ''),
      to: String(data.get('to') || ''),
      type: String(data.get('type') || 'training'),
      competition: String(data.get('competition') || 'league'),
    }
  }

  function openCalendarBulkManagement(criteria = { mode: 'range' }) {
    if (!can(ACCESS_CAPABILITIES.CALENDAR_DELETE) || !modalRoot) {
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
    document.body.classList.add('new-event-modal-open')

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
      if (!window.confirm(question)) return

      submit.disabled = true
      if (message) message.textContent = 'Eliminazione…'

      try {
        const result = await service.commit(appState.calendarEvents, criteriaNow)
        closeCalendarBulkManagement()
        root.innerHTML = calendarView()
        bindDynamic()
        alert(`Operazione completata: ${result.deleted} eventi eliminati${result.protectedEvents.length ? `, ${result.protectedEvents.length} protetti e mantenuti` : ''}.`)
      } catch (error) {
        console.error('Eliminazione massiva Calendario non riuscita:', error)
        if (message) message.textContent = error?.message || 'Eliminazione non riuscita.'
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
    if (!can(ACCESS_CAPABILITIES.CALENDAR_CREATE)) { showAccessNotice(); return }
    if (!modalRoot) {
      return
    }

    modalRoot.innerHTML = newEventModalHtml(selectedDate)
    document.body.classList.add('new-event-modal-open')

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

      const formData = new FormData(form)
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

      if (!date || !time || (eventType !== 'rest' && !location)) {
        message.textContent = eventType === 'rest' ? 'Data non disponibile.' : 'Inserisci data, ora e campo.'
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
        message.textContent =
          `Errore salvataggio: ${insertError.message}`
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
    if (!can(ACCESS_CAPABILITIES.CALENDAR_UPDATE)) { showAccessNotice(); return }
    const currentEvent = appState.calendarEvents.find(
      (item) => String(item.id) === String(eventId),
    )

    if (!currentEvent || !modalRoot) {
      return
    }

    modalRoot.innerHTML = editEventModalHtml(currentEvent)
    document.body.classList.add('new-event-modal-open')

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

      const formData = new FormData(form)
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

      if (!date || !time || (eventType !== 'rest' && !location)) {
        message.textContent = eventType === 'rest' ? 'Data non disponibile.' : 'Inserisci data, ora e campo.'
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
        message.textContent =
          `Errore modifica: ${updateError.message}`
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
    if (!can(ACCESS_CAPABILITIES.CALENDAR_DELETE)) { showAccessNotice(); return }
    const currentEvent = appState.calendarEvents.find(
      (item) => String(item.id) === String(eventId),
    )

    if (!currentEvent) {
      return
    }

    const linkedTrainingSheetWarning = currentEvent.trainingSheetPath
      ? ' La Training Sheet collegata verrà eliminata definitivamente.'
      : ''
    const confirmed = window.confirm(
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
      alert(`Errore eliminazione: ${deleteError?.message || 'operazione non riuscita'}`)
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

    document.body.classList.add('drawer-open')

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
          showAccessNotice(error?.message)
        }
      })

    drawerRoot
      .querySelector('[data-open-training-sheet-editor]')
      ?.addEventListener('click', async () => {
        if (event.editorData) {
          localStorage.setItem('nz-training-sheet-editor-v6-2', JSON.stringify(event.editorData))
        }
        localStorage.setItem('nz-training-sheet-open-event-id', event.id)
        localStorage.setItem('nz-active-section', 'training-sheet')
        closeDrawer()
        setActiveNavigation('training-sheet')
        await setView('training-sheet', 'Training Sheet Editor')
      })
  }

  function closeDrawer() {
    drawerRoot.innerHTML = ''
    document.body.classList.remove('drawer-open')
  }

  function openProfileMenu() {
    if (!profileMenuButton || !profileDropdown) {
      return
    }

    profileMenuButton.setAttribute(
      'aria-expanded',
      'true',
    )

    profileDropdown.inert = false
    profileDropdown.setAttribute(
      'aria-hidden',
      'false',
    )

    profileDropdown.classList.add('is-open')
    document.body.classList.add('profile-menu-open')
  }

  function closeProfileMenu() {
    if (!profileMenuButton || !profileDropdown) {
      return
    }

    profileMenuButton.setAttribute(
      'aria-expanded',
      'false',
    )

    if (profileDropdown.contains(document.activeElement)) {
      profileMenuButton.focus({ preventScroll: true })
    }

    profileDropdown.inert = true
    profileDropdown.setAttribute(
      'aria-hidden',
      'true',
    )

    profileDropdown.classList.remove('is-open')
    document.body.classList.remove('profile-menu-open')
  }

  function toggleProfileMenu() {
    const isOpen =
      profileDropdown?.classList.contains('is-open')

    if (isOpen) {
      closeProfileMenu()
      return
    }

    openProfileMenu()
  }

  async function bindDynamic() {
    const matchLibrary = root.querySelector('[data-match-library]')
    if (matchLibrary) {
      const service = createMatchLibraryService({ storage: localStorage })
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

          localStorage.setItem('staff-active-match', JSON.stringify(activeMatch))
          setActiveNavigation('match-library')
          localStorage.setItem('nz-active-section', 'match-workspace')
          await setView('match-workspace', 'Match Workspace')
        } catch (error) {
          console.error('Creazione partita non riuscita:', error)
          if (createMessage) createMessage.textContent = getUserErrorMessage(error, 'Creazione partita non riuscita.')
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
          localStorage.setItem('staff-active-match', JSON.stringify({ id: openButton.dataset.openMatchWorkspace, opponent: openButton.dataset.matchOpponent, date: openButton.dataset.matchDate }))
          setActiveNavigation('match-library')
          localStorage.setItem('nz-active-section', 'match-workspace')
          await setView('match-workspace', 'Match Workspace')
          return
        }
        const deleteButton = event.target.closest('[data-delete-library-match]')
        if (deleteButton && window.confirm('Eliminare questa gara dalla Match Library?')) {
          service.remove(deleteButton.dataset.deleteLibraryMatch)
          await setView('match-library', 'Match Library')
        }
      })
    }
    const opponentStudy = root.querySelector('[data-opponent-study]')
    if (opponentStudy) {
      const activeMatch = getActiveMatchContext()
      const service = createMatchOpponentStudyService({
        getEvent: getCalendarEvent,
        updateEvent: updateCalendarEvent,
        reloadEvents: loadCalendarEvents,
      })
      bindMatchOpponentStudy({
        root,
        service,
        activeMatch,
        team: getTeamProfile(),
        refresh: async () => setView('opponent-study', 'Studio avversario'),
      })
    }

    const matchWorkspace = root.querySelector('[data-match-workspace], .match-workspace--empty')
    matchWorkspace?.addEventListener('click', async (event) => {
      const actionButton = event.target.closest('[data-workspace-action]')
      if (!actionButton || actionButton.disabled) return
      const action = actionButton.dataset.workspaceAction
      if (action === 'match-library') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'match-library')
        await setView('match-library', 'Match Library')
        return
      }
      if (action === 'our-team') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'our-team')
        await setView('our-team', 'Nostra squadra')
        return
      }
      if (action === 'opponent') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'opponent')
        await setView('opponent', 'Avversario')
        return
      }
      if (action === 'opponent-study') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'opponent-study')
        await setView('opponent-study', 'Studio avversario')
        return
      }
      if (action === 'analysis') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'analysis')
        await setView('analysis', 'Analisi gara')
        return
      }
      if (action === 'callups') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'callups')
        await setView('callups', 'Convocazioni')
        root.querySelector('[data-callups-match]')?.focus()
      }
      if (action === 'report') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'match-report-workspace')
        await setView('match-report-workspace', 'Report partita')
        return
      }
      if (action === 'post-match') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'post-match')
        await setView('post-match', 'Post gara')
        return
      }
      if (action === 'statistics') {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'match-statistics')
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
        alert(error?.message || 'Impossibile aprire la stampa del Match Report.')
      } finally {
        button.disabled = false
      }
    })

    root.querySelector('[data-match-report-open-analysis]')?.addEventListener('click', async () => {
      setActiveNavigation('match-library')
      localStorage.setItem('nz-active-section', 'analysis')
      await setView('analysis', 'Analisi gara')
    })

    const postMatchForm = root.querySelector('[data-post-match-form]')
    if (postMatchForm) {
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
        const data = Object.fromEntries(new FormData(postMatchForm).entries())

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
            message.textContent = error?.userMessage || error?.message || 'Salvataggio non riuscito.'
            message.className = 'post-match-message is-error'
          }
          saveButton.disabled = false
        }
      })
    }

    root.querySelector('[data-open-team-settings]')?.addEventListener('click', () => setView('team-settings', 'Identità squadra'))
    root.querySelector('[data-open-team-roster]')?.addEventListener('click', () => setView('squad', 'Rosa'))

    const teamSettingsForm = root.querySelector('[data-team-settings-form]')
    if (teamSettingsForm) {
      const logoInput = teamSettingsForm.elements.logoFile
      const hiddenLogo = teamSettingsForm.elements.logo
      const message = teamSettingsForm.querySelector('[data-team-settings-message]')
      const preview = teamSettingsForm.querySelector('[data-team-brand-preview]')
      const refreshPreview = () => {
        const data = Object.fromEntries(new FormData(teamSettingsForm).entries())
        preview.style.setProperty('--team-primary', data.primaryColor || '#07194f')
        preview.style.setProperty('--team-secondary', data.secondaryColor || '#1f93e5')
        preview.querySelector('strong').textContent = data.name || 'Squadra'
        preview.querySelector('span').textContent = [data.category, data.season].filter(Boolean).join(' · ')
      }
      teamSettingsForm.addEventListener('input', refreshPreview)
      logoInput?.addEventListener('change', async () => {
        const file = logoInput.files?.[0]
        if (!file) return
        if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          message.textContent = 'Usa un’immagine PNG, JPG o WebP inferiore a 2 MB.'
          logoInput.value = ''
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          hiddenLogo.value = String(reader.result || '')
          const old = preview.querySelector('.team-brand-preview-logo')
          old?.replaceWith(Object.assign(document.createElement('img'), {
            className: 'team-brand-preview-logo',
            src: hiddenLogo.value,
            alt: 'Logo squadra',
          }))
        }
        reader.readAsDataURL(file)
      })
      teamSettingsForm.querySelector('[data-team-logo-remove]')?.addEventListener('click', () => {
        hiddenLogo.value = ''
        logoInput.value = ''
        const old = preview.querySelector('.team-brand-preview-logo')
        if (old) {
          const fallback = document.createElement('span')
          fallback.className = 'team-brand-preview-logo team-brand-preview-logo--fallback'
          fallback.textContent = (teamSettingsForm.elements.shortName.value || 'T').slice(0,2).toUpperCase()
          old.replaceWith(fallback)
        }
      })
      teamSettingsForm.querySelectorAll('[data-team-color-field]').forEach((field) => {
        const input = field.querySelector('input[type="color"]')
        field.querySelectorAll('[data-team-color-value]').forEach((button) => {
          button.addEventListener('click', () => {
            input.value = button.dataset.teamColorValue
            input.dispatchEvent(new Event('input', { bubbles: true }))
          })
        })
      })
      const tokenPreview = teamSettingsForm.querySelector('[data-team-token-preview] .team-token-preview')
      const refreshTeamPreview = () => {
        const primary = teamSettingsForm.elements.primaryColor.value
        const secondary = teamSettingsForm.elements.secondaryColor.value
        const pattern = teamSettingsForm.elements.kitPattern.value
        preview.style.setProperty('--team-primary', primary)
        preview.style.setProperty('--team-secondary', secondary)
        if (tokenPreview) {
          tokenPreview.style.setProperty('--token-primary', primary)
          tokenPreview.style.setProperty('--token-secondary', secondary)
          tokenPreview.className = `team-token-preview team-token-preview--${pattern}`
          const label = tokenPreview.querySelector('small')
          if (label) label.textContent = teamSettingsForm.elements.shortName.value || 'TEAM'
        }
      }
      teamSettingsForm.addEventListener('input', refreshTeamPreview)
      teamSettingsForm.addEventListener('change', refreshTeamPreview)

      const facilitiesList = teamSettingsForm.querySelector('[data-team-facilities-list]')
      const bindFacilityRemoveButtons = () => {
        facilitiesList?.querySelectorAll('[data-remove-team-facility]').forEach((button) => {
          if (button.dataset.bound === 'true') return
          button.dataset.bound = 'true'
          button.addEventListener('click', () => {
            button.closest('[data-team-facility-row]')?.remove()
            if (facilitiesList && !facilitiesList.querySelector('[data-team-facility-row]')) {
              facilitiesList.innerHTML = '<div class="team-facilities-empty" data-team-facilities-empty>Nessun impianto configurato. Aggiungi il primo campo della squadra.</div>'
            }
          })
        })
      }
      bindFacilityRemoveButtons()
      teamSettingsForm.querySelector('[data-add-team-facility]')?.addEventListener('click', () => {
        if (!facilitiesList) return
        facilitiesList.querySelector('[data-team-facilities-empty]')?.remove()
        const row = document.createElement('div')
        row.className = 'team-facility-row'
        row.dataset.teamFacilityRow = ''
        row.innerHTML = '<input type="text" maxlength="100" placeholder="Nome campo / impianto" aria-label="Nome campo o impianto"><button type="button" class="ghost-button team-facility-remove" data-remove-team-facility>Rimuovi</button>'
        facilitiesList.appendChild(row)
        bindFacilityRemoveButtons()
        row.querySelector('input')?.focus()
      })

      teamSettingsForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const submitButton = teamSettingsForm.querySelector('button[type="submit"]')
        const formData = new FormData(teamSettingsForm)
        const data = Object.fromEntries(formData.entries())
        const logoFile = formData.get('logoFile')
        delete data.logoFile
        submitButton.disabled = true
        submitButton.textContent = 'Salvataggio...'
        message.textContent = ''
        try {
          await saveTeamProfile(data, { user: appState.currentUser, logoFile, removeLogo: !data.logo && !(logoFile instanceof File && logoFile.size) })
          const facilityNames = [...teamSettingsForm.querySelectorAll('[data-team-facility-row] input')]
            .map((input) => input.value)
          appState.teamFacilities = await replaceTeamFacilities(getTeamProfile().id, facilityNames)
          message.textContent = 'Squadra, impianti e Rosa sincronizzati.'
          message.classList.remove('is-error')
          document.querySelectorAll('.team-brand-logo').forEach((node) => {
            const wrapper = document.createElement('div')
            wrapper.innerHTML = teamLogoHtml(node.className)
            node.replaceWith(wrapper.firstElementChild)
          })
        } catch (error) {
          console.error('Errore salvataggio identità squadra:', error)
          message.textContent = error?.message || 'Impossibile salvare la configurazione squadra.'
          message.classList.add('is-error')
        } finally {
          submitButton.disabled = false
          submitButton.textContent = 'Salva identità squadra'
        }
      })
    }


    const closeRosterPlayerModal = () => {
      modalRoot.innerHTML = ''
      document.body.classList.remove('new-event-modal-open')
    }

    const openRosterPlayerModal = (player = null) => {
      if (!modalRoot) return
      modalRoot.innerHTML = rosterPlayerModalHtml(player)
      document.body.classList.add('new-event-modal-open')

      modalRoot.querySelectorAll('[data-close-roster-player]').forEach((element) => {
        element.addEventListener('click', (event) => {
          if (element.classList.contains('new-event-modal-backdrop') && event.target !== element) return
          closeRosterPlayerModal()
        })
      })

      modalRoot.querySelector('[data-roster-player-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const message = form.querySelector('[data-roster-player-message]')
        const submit = form.querySelector('button[type="submit"]')
        const values = Object.fromEntries(new FormData(form).entries())
        submit.disabled = true
        message.textContent = ''
        try {
          await saveRosterPlayer({
            team: getTeamProfile(),
            legacyPlayers,
            player: {
              id: values.id || null,
              key: values.key || null,
              name: values.name,
              role: values.role,
              year: values.year,
              foot: values.foot,
              number: values.number,
              status: values.status,
            },
          })
          await loadRosterPlayers()
          closeRosterPlayerModal()
          await setView('squad', 'Rosa')
        } catch (error) {
          console.error('Salvataggio giocatore Rosa non riuscito:', error)
          message.textContent = error?.message || 'Salvataggio non riuscito.'
          message.className = 'form-message is-error'
          submit.disabled = false
        }
      })
    }

    root.querySelectorAll('[data-roster-create]').forEach((button) => {
      button.addEventListener('click', () => openRosterPlayerModal())
    })

    root.querySelectorAll('[data-roster-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const player = activePlayers().find((item) => rosterPlayerIdentity(item) === button.dataset.rosterEdit)
        if (player) openRosterPlayerModal(player)
      })
    })

    root.querySelectorAll('[data-roster-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const player = activePlayers().find((item) => String(item.id || '') === String(button.dataset.rosterRemove || ''))
        if (!player) return
        if (!window.confirm(`Rimuovere ${player.name} dalla Rosa? I dati storici delle partite resteranno invariati.`)) return
        button.disabled = true
        try {
          await removeRosterPlayer({
            team: getTeamProfile(),
            playerId: player.id,
            legacyPlayers,
          })
          await loadRosterPlayers()
          await setView('squad', 'Rosa')
        } catch (error) {
          console.error('Rimozione giocatore Rosa non riuscita:', error)
          showAccessNotice(error?.message || 'Rimozione non riuscita.')
          button.disabled = false
        }
      })
    })

    const callupsPanel = root.querySelector('[data-callups-panel]')
    root.querySelector('[data-open-callups]')?.addEventListener('click', () => {
      callupsPanel.hidden = !callupsPanel.hidden
      if (!callupsPanel.hidden) callupsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    if (callupsPanel) {
      const checks = [...callupsPanel.querySelectorAll('[data-callup-player]')]
      const countEl = callupsPanel.querySelector('[data-callups-count]')
      const alertEl = callupsPanel.querySelector('[data-callups-alert]')
      const pdfButton = callupsPanel.querySelector('[data-callups-pdf]')
      checks.forEach((check) => { check.checked = true })
      const updateCallups = () => {
        const selected = checks.filter((check) => check.checked)
        selected.forEach((check,index) => {
          check.closest('.callup-player').querySelector('[data-callup-order]').textContent = String(index + 1).padStart(2,'0')
        })
        checks.filter((check) => !check.checked).forEach((check) => {
          check.closest('.callup-player').querySelector('[data-callup-order]').textContent = '—'
        })
        countEl.textContent = String(selected.length)
        if (alertEl) { alertEl.hidden = true; alertEl.textContent = '' }
        pdfButton.disabled = selected.length === 0
        checks.forEach((check) => { check.disabled = false })
      }
      checks.forEach((check) => check.addEventListener('change', updateCallups))
      pdfButton?.addEventListener('click', async () => {
        const team = getTeamProfile()
        const selected = checks.filter((check) => check.checked).map((check,index)=>({
          order:index+1,
          name:check.value,
          role:check.dataset.callupRole || 'Altro',
        }))
        const match = callupsPanel.querySelector('[data-callups-match]').value || 'Partita da definire'
        const date = callupsPanel.querySelector('[data-callups-date]').value || ''
        const roleOrder = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante', 'Altro']
        const roleLabels = { Portiere:'PORTIERI', Difensore:'DIFENSORI', Centrocampista:'CENTROCAMPISTI', Attaccante:'ATTACCANTI', Altro:'ALTRI' }
        const groups = roleOrder.map((role) => ({ role, items:selected.filter((item) => item.role === role) })).filter((group) => group.items.length)
        const logo = team.logo ? `<img src="${escapeHtml(team.logo)}" alt="Logo ${escapeHtml(team.shortName)}">` : `<span>${escapeHtml((team.shortName||'T').slice(0,2).toUpperCase())}</span>`
        const html = `<main class="callups-print"><header>${logo}<div><span class="eyebrow">CONVOCAZIONI</span><h1>${escapeHtml(team.name)}</h1><p>${escapeHtml(match)}</p></div></header><div class="meta"><b>${date ? new Date(date+'T12:00:00').toLocaleDateString('it-IT') : 'Data da definire'}</b><span>${selected.length} convocati</span></div><div class="roles">${groups.map((group)=>`<section class="role"><h2>${roleLabels[group.role] || escapeHtml(group.role.toUpperCase())}</h2><div class="list">${group.items.map(item=>`<div class="player"><b>${String(item.order).padStart(2,'0')}</b><span>${escapeHtml(item.name)}</span></div>`).join('')}</div></section>`).join('')}</div></main>`
        const styles = `@page{size:A4;margin:10mm}*{box-sizing:border-box}html,body{background:#fff!important}.callups-print{font-family:Arial,sans-serif;color:#07194f;width:100%;max-width:190mm;margin:0 auto}.callups-print header{display:flex;align-items:center;gap:16px;border-bottom:4px solid ${escapeHtml(team.primaryColor || '#07194f')};padding-bottom:14px}.callups-print header img,.callups-print header>span{width:64px;height:64px;object-fit:contain;border-radius:12px;display:grid;place-items:center;background:${escapeHtml(team.primaryColor || '#07194f')};color:#fff;font-weight:800;flex:0 0 64px}.callups-print .eyebrow{display:block;font-size:11px;letter-spacing:.14em;font-weight:800;color:${escapeHtml(team.secondaryColor || '#1f93e5')};margin-bottom:4px}.callups-print h1{margin:0;font-size:27px;line-height:1.05}.callups-print p{margin:5px 0 0;font-size:14px}.callups-print .meta{display:flex;justify-content:space-between;gap:24px;margin:16px 0;padding:11px 13px;background:#f1f5f9;border-left:4px solid ${escapeHtml(team.secondaryColor || '#1f93e5')};font-size:13px}.roles{display:grid;gap:12px}.role{break-inside:avoid}.role h2{margin:0 0 6px;font-size:12px;letter-spacing:.12em;color:${escapeHtml(team.secondaryColor || '#1f93e5')};border-bottom:1px solid #d7e0e8;padding-bottom:5px}.list{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.player{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #d4dde5;border-radius:7px;break-inside:avoid;font-size:13px}.player b{min-width:24px;font-size:14px;color:${escapeHtml(team.secondaryColor || '#1f93e5')}}@media print{.callups-print{page-break-after:avoid}.role,.player{break-inside:avoid}}`
        pdfButton.disabled = true
        try { await printHtmlDocument({ title: `Convocazioni - ${team.shortName}`, html, styles }) }
        catch (error) { alert(error?.message || 'Impossibile aprire la stampa.') }
        finally { pdfButton.disabled = false }
      })
      updateCallups()
    }

    const board = root.querySelector('[data-board-view]')
    if (board) {
      const pitch = board.querySelector('[data-board-pitch]')
      const saved = readLocalJson('nz-board-v1', {})
      const saveBoard = () => {
        const data = {}
        board.querySelectorAll('input[name], select[name]').forEach((field) => { data[field.name] = field.value })
        localStorage.setItem('nz-board-v1', JSON.stringify(data))
      }
      const createSideController = (side, defaultFormation, mirrored) => {
        const formationField = board.querySelector(`[name="board_${side}_formation"]`)
        const savedPositions = Array.from({ length: 11 }, (_, index) => {
          const x = Number(saved[`${side}_x_${index}`])
          const y = Number(saved[`${side}_y_${index}`])
          return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null
        })
        const hasSavedPositions = savedPositions.every(Boolean)
        const state = createPitchState({
          formation: saved[`board_${side}_formation`] || defaultFormation,
          positions: hasSavedPositions ? savedPositions : null,
          mode: hasSavedPositions ? PITCH_POSITION_MODE.CUSTOM : PITCH_POSITION_MODE.AUTOMATIC,
          mirrored,
        })
        return createPitchController({
          state,
          render(snapshot) {
            formationField.value = snapshot.formation
            snapshot.positions.forEach(([x, y], index) => {
              const token = board.querySelector(`[data-board-token="${side}-${index}"]`)
              if (!token) return
              token.style.setProperty('--x', x.toFixed(2))
              token.style.setProperty('--y', y.toFixed(2))
              board.querySelector(`[name="${side}_x_${index}"]`).value = x.toFixed(2)
              board.querySelector(`[name="${side}_y_${index}"]`).value = y.toFixed(2)
            })
            board.dataset[`${side}PositionMode`] = snapshot.mode
          },
          persist: saveBoard,
        })
      }
      if (Object.keys(saved).length) {
        Object.entries(saved).forEach(([key, value]) => {
          const field = board.querySelector(`[name="${CSS.escape(key)}"]`)
          if (field) field.value = value
        })
      }
      board.style.setProperty('--board-home', saved.board_home_color || getTeamProfile().primaryColor)
      board.style.setProperty('--board-away', saved.board_away_color || '#9f1239')
      const controllers = {
        home: createSideController('home', '4-3-3', false),
        away: createSideController('away', '4-4-2', true),
      }
      controllers.home.initialize()
      controllers.away.initialize()
      for (const side of ['home', 'away']) {
        board.querySelector(`[name="board_${side}_formation"]`)?.addEventListener('change', (event) => {
          controllers[side].applyFormation(event.currentTarget.value)
        })
      }
      board.querySelectorAll('input[type="color"]').forEach((input) => input.addEventListener('input', () => {
        const side = input.name.includes('home') ? 'home' : 'away'
        board.style.setProperty(`--board-${side}`, input.value)
        saveBoard()
      }))
      bindPitchTokenDragging({
        pitch,
        tokens: [...board.querySelectorAll('[data-board-token]')],
        getIndex: (token) => Number(token.dataset.boardToken.split('-')[1]),
        onMove: (index, x, y, token) => {
          const side = token.dataset.boardToken.startsWith('away-') ? 'away' : 'home'
          controllers[side].moveToken(index, x, y, false)
        },
        onCommit: () => saveBoard(),
      })
      board.querySelector('[data-board-reset]')?.addEventListener('click', () => {
        controllers.home.applyFormation(board.querySelector('[name="board_home_formation"]').value, false)
        controllers.away.applyFormation(board.querySelector('[name="board_away_formation"]').value, false)
        saveBoard()
      })
    }

    const matchEditor = root.querySelector('[data-match-editor]')
    if (matchEditor) {
      const form = matchEditor.querySelector('[data-match-form]')
      const steps = [...matchEditor.querySelectorAll('[data-match-step]')]
      const stepButtons = [...matchEditor.querySelectorAll('[data-match-step-button]')]
      const prev = matchEditor.querySelector('[data-match-prev]')
      const next = matchEditor.querySelector('[data-match-next]')
      const finalSave = matchEditor.querySelector('[data-match-save-final]')
      const progress = matchEditor.querySelector('[data-match-progress]')
      const state = matchEditor.querySelector('[data-match-save-state]')
      const activeMatchForDraft = getActiveMatchContext()
      const draftService = createMatchDraftService({ storage: localStorage, storageKey: activeMatchForDraft?.id ? `nz-match-sheet-editor-v2:${activeMatchForDraft.id}` : undefined })
      const matchRosterOptions = getTrainingSheetRosterPlayers()
        .map((player) => `<option value="${escapeHtml(player.canonicalName)}">${escapeHtml(player.surname)} ${escapeHtml(player.firstName)}</option>`)
        .join('')
      let activeStep = 1
      let saveTimer
      let hasSavedTokenPositions = false
      let restoredBenchNumbers = new Map()
      const escape = (value='') => String(value).replace(/[&<>\"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[char]))
      const showStep = (value) => {
        activeStep = Math.min(5, Math.max(1, Number(value)))
        steps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.matchStep) === activeStep))
        stepButtons.forEach((button) => button.classList.toggle('is-active', Number(button.dataset.matchStepButton) === activeStep))
        prev.disabled = activeStep === 1
        next.hidden = activeStep === 5
        finalSave.hidden = activeStep !== 5
        progress.textContent = `Passaggio ${activeStep} di 5`
        renderReport()
        window.scrollTo({top:0, behavior:'smooth'})
      }
      const syncCompactScore = (prefix) => {
        const display = form.elements[prefix]
        const home = form.elements[`${prefix}_home`]
        const away = form.elements[`${prefix}_away`]
        if (!display || !home || !away) return
        const left = String(home.value || '').replace(/\D/g, '').slice(0, 2)
        const right = String(away.value || '').replace(/\D/g, '').slice(0, 2)
        home.value = left
        away.value = right
        display.value = left || right ? `${left || 0}-${right || 0}` : ''
      }
      const bindCompactScore = (prefix) => {
        const home = form.elements[`${prefix}_home`]
        const away = form.elements[`${prefix}_away`]
        if (!home || !away) return
        home.addEventListener('input', () => {
          syncCompactScore(prefix)
          if (home.value.length === 1) away.focus()
        })
        away.addEventListener('input', () => syncCompactScore(prefix))
        away.addEventListener('keydown', (event) => {
          if (event.key === 'Backspace' && !away.value) home.focus()
        })
      }
      bindCompactScore('result')
      bindCompactScore('half_result')
      const collect = () => draftService.collect(form)
      const save = () => {
        draftService.save(form)
        if (state) state.textContent = 'Bozza salvata'
      }
      const scheduleSave = () => {
        if (state) state.textContent = 'Salvataggio…'
        clearTimeout(saveTimer)
        saveTimer = setTimeout(save, 350)
      }
      const renderNotes = () => {
        const rootNotes = matchEditor.querySelector('[data-note-fields]')
        const mode = form.elements.notes_mode.value
        const labels = mode==='halves' ? ['Primo tempo','Intervallo','Secondo tempo','Considerazioni finali'] : mode==='quarters' ? ['0’–15’','16’–30’','31’–45’','46’–60’','61’–75’','76’–90’','Recupero'] : ['Note partita']
        rootNotes.innerHTML = `<div class="dynamic-notes-grid ${mode==='free'?'single':''}">${labels.map((label,i)=>`<label><span>${label}</span><textarea name="own_note_${i}" rows="${mode==='free'?12:5}"></textarea></label>`).join('')}</div>`
      }
      const eventContainers = {
        substitution: matchEditor.querySelector('[data-substitutions]'),
        goal: matchEditor.querySelector('[data-goals]'),
        card: matchEditor.querySelector('[data-cards]'),
      }
      const eventRowCounts = { substitution: 0, goal: 0, card: 0 }
      const eventRowMarkup = (type, index, values = {}) => {
        const remove = '<button type="button" class="event-remove-button" data-remove-match-row aria-label="Rimuovi riga">×</button>'
        if (type === 'substitution') return `<div class="event-row event-row--sub" data-match-row="substitution"><input type="number" name="sub_minute_${index}" min="1" max="130" placeholder="Min." value="${escape(values.minute || '')}"><select name="sub_out_${index}"><option value="">Esce</option>${matchRosterOptions}</select><select name="sub_in_${index}"><option value="">Entra</option>${matchRosterOptions}</select><select name="sub_reason_${index}"><option>Tattico</option><option>Tecnico</option><option>Fisico</option><option>Infortunio</option><option>Gestione</option></select>${remove}</div>`
        if (type === 'goal') return `<div class="event-row event-row--goal" data-match-row="goal"><input type="number" name="goal_minute_${index}" min="1" max="130" placeholder="Min." value="${escape(values.minute || '')}"><select name="scorer_${index}"><option value="">Marcatore</option>${matchRosterOptions}</select><select name="assist_${index}"><option value="">Assist</option>${matchRosterOptions}</select>${remove}</div>`
        return `<div class="event-row event-row--card" data-match-row="card"><input type="number" name="card_minute_${index}" min="1" max="130" placeholder="Min." value="${escape(values.minute || '')}"><select name="card_player_${index}"><option value="">Giocatore</option>${matchRosterOptions}</select><select name="card_type_${index}"><option>Ammonizione</option><option>Doppia ammonizione</option><option>Espulsione</option></select>${remove}</div>`
      }
      const addEventRow = (type, values = {}) => {
        const container = eventContainers[type]
        if (!container) return
        const limit = type === 'substitution' ? 5 : 12
        if (container.children.length >= limit) return
        const index = eventRowCounts[type]++
        container.insertAdjacentHTML('beforeend', eventRowMarkup(type, index, values))
        const row = container.lastElementChild
        Object.entries(values).forEach(([key, value]) => {
          const fieldMap = type === 'substitution' ? {out:`sub_out_${index}`,in:`sub_in_${index}`,reason:`sub_reason_${index}`} : type === 'goal' ? {scorer:`scorer_${index}`,assist:`assist_${index}`} : {player:`card_player_${index}`,cardType:`card_type_${index}`}
          const field = form.elements[fieldMap[key]]
          if (field) field.value = value
        })
        row.querySelector('[data-remove-match-row]')?.addEventListener('click', () => { row.remove(); scheduleSave(); renderReport() })
      }
      matchEditor.addEventListener('click', (event) => {
        const addButton = event.target.closest('[data-add-match-row]')
        if (!addButton || !matchEditor.contains(addButton)) return
        event.preventDefault()
        try {
          addEventRow(addButton.dataset.addMatchRow)
          scheduleSave()
          renderReport()
        } catch (error) {
          console.error('Errore aggiunta evento Match Sheet:', error)
          if (state) state.textContent = 'Errore: impossibile aggiungere la riga'
        }
      })
      const autoAssignCoreRoles = () => {
        const roster = getTrainingSheetRosterPlayers()
        const currentSelections = Array.from({ length: 11 }, (_, i) => form.elements[`starter_${i}`]?.value).filter(Boolean)
        if (currentSelections.length) return
        const byRole = (pattern) => roster.filter((player) => pattern.test(player.role || ''))
        const pools = {
          goalkeeper: byRole(/portier/i),
          defenders: byRole(/difensor/i),
          midfielders: byRole(/centrocamp/i),
          attackers: byRole(/attacc/i),
        }
        const assignment = [
          pools.goalkeeper[0],
          pools.defenders[0], pools.defenders[1], pools.defenders[2], pools.defenders[3],
          pools.midfielders[0], pools.midfielders[1], pools.midfielders[2], pools.midfielders[3], pools.attackers[1] || pools.midfielders[4],
          pools.attackers[0],
        ]
        assignment.forEach((player, index) => {
          if (player && form.elements[`starter_${index}`]) form.elements[`starter_${index}`].value = player.canonicalName
        })
      }
      let pendingLeadershipRole = ''
      const leadershipField = (role) => role === 'vice_captain' ? form.elements.vice_captain : form.elements.captain
      const assignLeadershipRole = (role, playerIndex) => {
        const targetField = leadershipField(role)
        const otherField = leadershipField(role === 'captain' ? 'vice_captain' : 'captain')
        const index = String(playerIndex)
        const selectedPlayer = form.elements[`starter_${index}`]?.value
        if (!targetField || !selectedPlayer) return
        if (otherField?.value === index) otherField.value = ''
        targetField.value = targetField.value === index ? '' : index
        pendingLeadershipRole = ''
        matchEditor.querySelectorAll('[data-leadership-badge]').forEach((badge) => badge.classList.remove('is-armed'))
        updateTokens()
        renderReport()
        scheduleSave()
      }
      const updateTokens = () => {
        const showNumber = Boolean(form.elements.token_number?.checked)
        const showSurname = Boolean(form.elements.token_surname?.checked)
        const showPhoto = Boolean(form.elements.token_photo?.checked)
        const captainIndex = String(form.elements.captain?.value ?? '')
        const viceCaptainIndex = String(form.elements.vice_captain?.value ?? '')
        if (captainIndex && !form.elements[`starter_${captainIndex}`]?.value) form.elements.captain.value = ''
        if (viceCaptainIndex && !form.elements[`starter_${viceCaptainIndex}`]?.value) form.elements.vice_captain.value = ''
        matchEditor.querySelectorAll('[data-player-token]').forEach((token) => {
          const i = Number(token.dataset.playerToken)
          const name = form.elements[`starter_${i}`]?.value || `Giocatore ${i + 1}`
          const number = form.elements[`starter_number_${i}`]?.value || i + 1
          const surname = name.trim().split(/\s+/).at(-1) || name
          const badge = token.querySelector('.token-photo')
          const label = token.querySelector('small')
          token.classList.toggle('show-photo', showPhoto)
          token.classList.toggle('is-captain', String(form.elements.captain?.value ?? '') === String(i))
          token.classList.toggle('is-vice-captain', String(form.elements.vice_captain?.value ?? '') === String(i))
          badge.textContent = showPhoto ? surname.slice(0, 2).toUpperCase() : (showNumber ? number : '')
          badge.hidden = !showPhoto && !showNumber
          label.textContent = showSurname ? surname : ''
          label.hidden = !showSurname
        })
      }
      const bindLeadershipBadges = () => {
        matchEditor.querySelectorAll('[data-leadership-badge]').forEach((badge) => {
          badge.addEventListener('dragstart', (event) => {
            event.dataTransfer?.setData('text/staff-leadership-role', badge.dataset.leadershipBadge)
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
            badge.classList.add('is-dragging')
          })
          badge.addEventListener('dragend', () => badge.classList.remove('is-dragging'))
          badge.addEventListener('click', () => {
            pendingLeadershipRole = pendingLeadershipRole === badge.dataset.leadershipBadge ? '' : badge.dataset.leadershipBadge
            matchEditor.querySelectorAll('[data-leadership-badge]').forEach((item) => item.classList.toggle('is-armed', item.dataset.leadershipBadge === pendingLeadershipRole))
          })
        })
        matchEditor.querySelectorAll('[data-player-token]').forEach((token) => {
          token.addEventListener('dragover', (event) => {
            const role = event.dataTransfer?.types?.includes('text/staff-leadership-role')
            if (!role) return
            event.preventDefault()
            token.classList.add('is-leadership-target')
          })
          token.addEventListener('dragleave', () => token.classList.remove('is-leadership-target'))
          token.addEventListener('drop', (event) => {
            event.preventDefault()
            token.classList.remove('is-leadership-target')
            const role = event.dataTransfer?.getData('text/staff-leadership-role')
            if (role) assignLeadershipRole(role, token.dataset.playerToken)
          })
          token.addEventListener('click', () => {
            if (pendingLeadershipRole) assignLeadershipRole(pendingLeadershipRole, token.dataset.playerToken)
          })
        })
      }

      const getBenchExcluded = () => {
        try {
          const parsed = JSON.parse(form.elements.bench_excluded?.value || '[]')
          return new Set(Array.isArray(parsed) ? parsed : [])
        } catch {
          return new Set()
        }
      }
      const setBenchExcluded = (values) => {
        if (form.elements.bench_excluded) form.elements.bench_excluded.value = JSON.stringify([...values])
      }
      const updateStarterOptions = () => {
        const selected = Array.from({ length: 11 }, (_, index) => form.elements[`starter_${index}`]?.value || '')
        for (let index = 0; index < 11; index += 1) {
          const select = form.elements[`starter_${index}`]
          if (!select) continue
          Array.from(select.options).forEach((option) => {
            if (!option.value) return
            option.disabled = selected.some((value, selectedIndex) => selectedIndex !== index && value === option.value)
          })
        }
      }
      const updateAutomaticBench = () => {
        const benchRoot = matchEditor.querySelector('[data-auto-bench]')
        const countNode = matchEditor.querySelector('[data-bench-count]')
        const limitMessage = matchEditor.querySelector('[data-bench-limit-message]')
        if (!benchRoot) return
        const previousNumbers = new Map(
          [...benchRoot.querySelectorAll('[data-bench-player]')].map((row) => [
            row.dataset.benchPlayer,
            row.querySelector('input[type="number"]')?.value || '',
          ]),
        )
        const starters = new Set(Array.from({ length: 11 }, (_, index) => form.elements[`starter_${index}`]?.value).filter(Boolean))
        const excluded = getBenchExcluded()
        const benchPlayers = getTrainingSheetRosterPlayers().filter((player) => !starters.has(player.canonicalName) && !excluded.has(player.canonicalName))
        benchRoot.innerHTML = benchPlayers.map((player, index) => `
          <div class="bench-row bench-row--automatic" data-bench-player="${escapeHtml(player.canonicalName)}">
            <span class="bench-index">${String(index + 12).padStart(2, '0')}</span>
            <input type="number" min="1" max="99" name="bench_number_${index}" value="${escapeHtml(previousNumbers.get(player.canonicalName) || restoredBenchNumbers.get(player.canonicalName) || '')}" placeholder="N°" aria-label="Numero maglia ${escapeHtml(player.displayName)}">
            <input type="hidden" name="bench_${index}" value="${escapeHtml(player.canonicalName)}">
            <div class="bench-player-copy"><strong>${escapeHtml(player.surname)}</strong><span>${escapeHtml(player.firstName || player.role)}</span></div>
            <button type="button" class="bench-remove-button" data-remove-bench-player="${escapeHtml(player.canonicalName)}" aria-label="Escludi ${escapeHtml(player.displayName)} dalla distinta">×</button>
          </div>`).join('')
        const total = starters.size + benchPlayers.length
        if (countNode) {
          countNode.textContent = `Distinta: ${total}/20`
          countNode.classList.toggle('is-over-limit', total > 20)
          countNode.classList.toggle('is-complete', total === 20)
        }
        if (limitMessage) limitMessage.hidden = total <= 20
        if (finalSave) finalSave.disabled = total > 20
        benchRoot.querySelectorAll('[data-remove-bench-player]').forEach((button) => button.addEventListener('click', () => {
          const nextExcluded = getBenchExcluded()
          nextExcluded.add(button.dataset.removeBenchPlayer)
          setBenchExcluded(nextExcluded)
          updateAutomaticBench()
          renderReport()
          scheduleSave()
        }))
      }

      const setOpponentTokenPosition = (index, x, y, persist = true) => {
        const token = matchEditor.querySelector(`[data-opponent-token="${index}"]`)
        if (!token) return
        const safeX = Math.min(93, Math.max(7, Number(x) || 50))
        const safeY = Math.min(93, Math.max(7, Number(y) || 50))
        token.style.setProperty('--x', safeX.toFixed(2))
        token.style.setProperty('--y', safeY.toFixed(2))
        const xInput = form.elements[`opponent_position_x_${index}`]
        const yInput = form.elements[`opponent_position_y_${index}`]
        if (xInput) xInput.value = safeX.toFixed(2)
        if (yInput) yInput.value = safeY.toFixed(2)
        if (persist) scheduleSave()
      }
      const updateOpponentPitch = (formation = '4-4-2', persist = true) => {
        const layout = getFormationLayout(formation)
        layout.forEach(([x,y], index) => setOpponentTokenPosition(index, x, y, false))
        if (persist) scheduleSave()
      }
      const bindOpponentTokenDragging = () => {
        const pitch = matchEditor.querySelector('[data-opponent-pitch]')
        if (!pitch) return
        matchEditor.querySelectorAll('[data-opponent-token]').forEach((token) => {
          let dragging = false
          const move = (event) => {
            if (!dragging) return
            const rect = pitch.getBoundingClientRect()
            setOpponentTokenPosition(Number(token.dataset.opponentToken), ((event.clientX-rect.left)/rect.width)*100, ((event.clientY-rect.top)/rect.height)*100, false)
          }
          token.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return
            dragging = true
            token.classList.add('is-dragging')
            token.setPointerCapture?.(event.pointerId)
            event.preventDefault()
          })
          token.addEventListener('pointermove', move)
          token.addEventListener('pointerup', (event) => {
            if (!dragging) return
            move(event); dragging = false; token.classList.remove('is-dragging'); token.releasePointerCapture?.(event.pointerId); scheduleSave(); renderReport()
          })
          token.addEventListener('pointercancel', () => { dragging = false; token.classList.remove('is-dragging') })
        })
      }
      const clampPosition = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
      const setTokenPosition = (index, x, y, persist = true) => {
        const token = matchEditor.querySelector(`[data-player-token="${index}"]`)
        if (!token) return
        const safeX = clampPosition(x, 7, 93)
        const safeY = clampPosition(y, 7, 93)
        token.style.setProperty('--x', safeX.toFixed(2))
        token.style.setProperty('--y', safeY.toFixed(2))
        const xInput = form.elements[`position_x_${index}`]
        const yInput = form.elements[`position_y_${index}`]
        if (xInput) xInput.value = safeX.toFixed(2)
        if (yInput) yInput.value = safeY.toFixed(2)
        if (persist) scheduleSave()
      }
      const positionsFromCustomFormation = getCustomFormationLayout

      const applyFormation = (formation, persist = true) => {
        const layout = formation === 'Personalizzato'
          ? positionsFromCustomFormation(form.elements.custom_formation?.value)
          : getFormationLayout(formation)
        if (!layout || layout.length !== 11) return false
        layout.forEach(([x,y], index) => setTokenPosition(index, x, y, false))
        if (persist) scheduleSave()
        return true
      }
      const restoreTokenPositions = () => {
        if (!hasSavedTokenPositions) {
          applyFormation(form.elements.formation.value, false)
          return
        }
        let restored = true
        for (let i=0;i<11;i++) {
          const x = Number(form.elements[`position_x_${i}`]?.value)
          const y = Number(form.elements[`position_y_${i}`]?.value)
          if (!Number.isFinite(x) || !Number.isFinite(y)) { restored = false; break }
        }
        if (restored) {
          for (let i=0;i<11;i++) setTokenPosition(i, form.elements[`position_x_${i}`].value, form.elements[`position_y_${i}`].value, false)
        } else {
          applyFormation(form.elements.formation.value, false)
        }
      }
      const bindTokenDragging = () => {
        const pitch = matchEditor.querySelector('[data-football-pitch]')
        if (!pitch) return
        matchEditor.querySelectorAll('[data-player-token]').forEach((token) => {
          let dragging = false
          const move = (event) => {
            if (!dragging) return
            const rect = pitch.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / rect.width) * 100
            const y = ((event.clientY - rect.top) / rect.height) * 100
            setTokenPosition(Number(token.dataset.playerToken), x, y, false)
          }
          token.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return
            dragging = true
            token.classList.add('is-dragging')
            token.setPointerCapture?.(event.pointerId)
            event.preventDefault()
          })
          token.addEventListener('pointermove', move)
          token.addEventListener('pointerup', (event) => {
            if (!dragging) return
            move(event)
            dragging = false
            token.classList.remove('is-dragging')
            token.releasePointerCapture?.(event.pointerId)
            scheduleSave()
          })
          token.addEventListener('pointercancel', () => {
            dragging = false
            token.classList.remove('is-dragging')
          })
          token.addEventListener('keydown', (event) => {
            const delta = event.shiftKey ? 5 : 1
            const currentX = Number(form.elements[`position_x_${token.dataset.playerToken}`]?.value || 50)
            const currentY = Number(form.elements[`position_y_${token.dataset.playerToken}`]?.value || 50)
            const directions = {ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]}
            if (!directions[event.key]) return
            event.preventDefault()
            const [dx,dy] = directions[event.key]
            setTokenPosition(Number(token.dataset.playerToken), currentX+dx, currentY+dy)
          })
        })
      }
      const matchReportRenderer = createMatchReportRenderer({ escapeHtml: escape })
      const matchReportService = createMatchReportService({
        root: matchEditor,
        collectData: collect,
        getTeam: getTeamProfile,
        renderer: matchReportRenderer,
      })
      const renderReport = () => matchReportService.render()
      const formationSelect=form.elements.formation
      const customFormationField = matchEditor.querySelector('[data-custom-formation]')
      const opponentFormationsRoot = matchEditor.querySelector('[data-opponent-formations]')
      const addOpponentFormationButton = matchEditor.querySelector('[data-add-opponent-formation]')
      let opponentFormationCount = 0
      const addOpponentFormation = (data = {}) => {
        if (!opponentFormationsRoot || opponentFormationCount >= 6) return
        const index = opponentFormationCount++
        const card = document.createElement('article')
        card.className = 'opponent-formation-card'
        card.dataset.opponentFormation = String(index)
        card.innerHTML = `<div class="opponent-formation-card-head"><strong>${index === 0 ? 'Sistema iniziale' : `Cambio sistema ${index}`}</strong>${index === 0 ? '' : '<button type="button" data-remove-opponent-formation aria-label="Rimuovi">×</button>'}</div><div class="opponent-formation-fields"><label><span>Sistema</span><select name="opponent_system_${index}">${formationOptionsHtml(data.system || '4-4-2')}</select></label><label><span>${index === 0 ? 'Minuto iniziale' : 'Dal minuto'}</span><input type="number" min="0" max="130" name="opponent_system_minute_${index}" value="${escape(data.minute ?? (index === 0 ? 0 : ''))}"></label></div><label><span>Note sul sistema</span><textarea name="opponent_system_note_${index}" rows="3">${escape(data.note || '')}</textarea></label>`
        card.querySelector('[data-remove-opponent-formation]')?.addEventListener('click', () => { card.remove(); scheduleSave(); renderReport() })
        opponentFormationsRoot.appendChild(card)
        const systemSelect = card.querySelector(`[name="opponent_system_${index}"]`)
        systemSelect?.addEventListener('change', () => { if (index === 0) updateOpponentPitch(systemSelect.value); scheduleSave(); renderReport() })
        if (index === 0) updateOpponentPitch(systemSelect?.value || '4-4-2')
      }
      addOpponentFormationButton?.addEventListener('click', () => { addOpponentFormation(); scheduleSave() })
      const syncCustomFormation = () => {
        const isCustom = formationSelect.value === 'Personalizzato'
        customFormationField.hidden = !isCustom
        if (!isCustom) form.elements.custom_formation.value = ''
      }
      formationSelect.addEventListener('change',()=>{
        syncCustomFormation()
        applyFormation(formationSelect.value)
      })
      form.elements.custom_formation.addEventListener('change',()=>{
        if (formationSelect.value === 'Personalizzato') applyFormation('Personalizzato')
      })
      matchEditor.querySelector('[data-reset-formation]')?.addEventListener('click',()=>{
        applyFormation(formationSelect.value)
        renderReport()
      })
      const updateOpponentTokenStyle = () => {
        const primary = form.elements.opponent_token_primary?.value || '#9f1239'
        const secondary = form.elements.opponent_token_secondary?.value || '#f8fafc'
        const pattern = form.elements.opponent_token_pattern?.value || 'solid'
        matchEditor.style.setProperty('--opponent-token-primary', primary)
        matchEditor.style.setProperty('--opponent-token-secondary', secondary)
        matchEditor.dataset.opponentTokenPattern = pattern
      }
      form.elements.notes_mode.addEventListener('change',()=>{renderNotes();scheduleSave()})
      const handleMatchFormMutation = (event) => {
        const fieldName = event.target?.name || ''
        const starterChanged = /^starter_(?:number_)?\d+$/.test(fieldName)
        if (starterChanged) {
          updateStarterOptions()
          updateAutomaticBench()
        }
        updateTokens()
        updateOpponentTokenStyle()
        renderReport()
        scheduleSave()
      }
      form.addEventListener('input', handleMatchFormMutation)
      form.addEventListener('change', handleMatchFormMutation)
      next.addEventListener('click',()=>showStep(activeStep+1)); prev.addEventListener('click',()=>showStep(activeStep-1)); stepButtons.forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.matchStepButton)))
      matchEditor.querySelector('[data-match-reset]').addEventListener('click',()=>{if(confirm('Cancellare la Match Sheet?')){form.reset();draftService.clear();syncCustomFormation();applyFormation(form.elements.formation.value,false);renderNotes();updateTokens();showStep(1)}})
      const fileInput=form.elements.opponent_sheet; fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0]; const img=matchEditor.querySelector('[data-opponent-sheet-preview]'); if(file){img.src=URL.createObjectURL(file);img.hidden=false}})
      const openMatchReportPreview = () => {
        const { paper, validation } = matchReportService.getPrintablePaper()
        if (!paper) {
          if (state) state.textContent = 'Report non disponibile'
          return
        }
        if (!validation.valid && state) {
          state.textContent = `Report incompleto: ${validation.errors.join(' · ')}`
        }
        document.querySelector('[data-match-report-dialog]')?.remove()
        const trigger = document.activeElement
        const dialog = document.createElement('div')
        dialog.className = 'match-report-dialog'
        dialog.dataset.matchReportDialog = ''
        dialog.innerHTML = `<section class="match-report-dialog-panel" role="dialog" aria-modal="true" aria-label="Anteprima Match Report"><header><div><span>ANTEPRIMA DI STAMPA</span><h2>Match Report</h2></div><button type="button" data-close-match-report aria-label="Chiudi">×</button></header><div class="match-report-dialog-body">${paper.outerHTML}</div><footer><button type="button" class="secondary-button" data-close-match-report>Annulla</button><button type="button" class="primary-button" data-confirm-match-report>Stampa / salva PDF</button></footer></section>`
        document.body.appendChild(dialog)
        document.body.classList.add('modal-open')
        const close = () => {
          dialog.remove()
          document.body.classList.remove('modal-open')
          trigger?.focus?.()
        }
        dialog.querySelectorAll('[data-close-match-report]').forEach((button) => button.addEventListener('click', close))
        dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
        dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') close() })
        dialog.querySelector('[data-close-match-report]')?.focus()
        dialog.querySelector('[data-confirm-match-report]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget
          const printable = dialog.querySelector('.match-report-paper')
          const activeMatch = (() => {
            try { return JSON.parse(localStorage.getItem('staff-active-match') || 'null') } catch { return null }
          })()
          button.disabled = true
          button.textContent = 'Salvataggio nel Calendario…'
          if (state) state.textContent = 'Collegamento al Calendario…'
          try {
            const calendarService = createMatchCalendarService({
              createEvent: createCalendarEvent,
              updateEvent: updateCalendarEvent,
              reloadEvents: loadCalendarEvents,
            })
            const saved = await calendarService.publish({
              matchData: collect(),
              activeMatch,
              calendarEvents: appState.calendarEvents,
            })
            if (saved.eventId) {
              localStorage.setItem('staff-active-match', JSON.stringify({
                ...(activeMatch || {}),
                id: saved.eventId,
                opponent: form.elements.opponent?.value || activeMatch?.opponent || '',
                date: form.elements.date?.value || activeMatch?.date || '',
              }))
            }
            draftService.save(form)
            if (state) state.textContent = saved.created ? 'Report salvato e gara creata nel Calendario' : 'Report salvato nel Calendario'
            printMatchReport(printable)
            button.textContent = 'Stampa / salva PDF'
            button.disabled = false
          } catch (error) {
            console.error('Salvataggio Match Report nel Calendario non riuscito:', error)
            if (state) state.textContent = error.message || 'Salvataggio nel Calendario non riuscito'
            button.textContent = 'Riprova salvataggio'
            button.disabled = false
          }
        })
      }
      finalSave?.addEventListener('click', () => { save(); if (state) state.textContent = 'Match Sheet salvata' })
      try {
        const saved = draftService.load()
        if(saved){
          const inferIndexes = (pattern) => Object.keys(saved).filter((key) => pattern.test(key)).map((key) => Number(key.match(/\d+/)?.[0])).filter(Number.isFinite).sort((a,b)=>a-b)
          const subIndexes = inferIndexes(/^sub_minute_\d+$/)
          const goalIndexes = inferIndexes(/^goal_minute_\d+$/)
          const cardIndexes = inferIndexes(/^card_minute_\d+$/)
          const savedBenchIndexes = inferIndexes(/^bench_\d+$/)
          restoredBenchNumbers = new Map(savedBenchIndexes.map((index) => [saved[`bench_${index}`], saved[`bench_number_${index}`] || '']).filter(([name]) => name))
          ;(subIndexes.length ? subIndexes : [0]).forEach((index)=>addEventRow('substitution',{minute:saved[`sub_minute_${index}`],out:saved[`sub_out_${index}`],in:saved[`sub_in_${index}`],reason:saved[`sub_reason_${index}`]}))
          ;(goalIndexes.length ? goalIndexes : [0]).forEach((index)=>addEventRow('goal',{minute:saved[`goal_minute_${index}`],scorer:saved[`scorer_${index}`],assist:saved[`assist_${index}`]}))
          ;(cardIndexes.length ? cardIndexes : [0]).forEach((index)=>addEventRow('card',{minute:saved[`card_minute_${index}`],player:saved[`card_player_${index}`],cardType:saved[`card_type_${index}`]}))
          const savedOpponentIndexes = Object.keys(saved).filter((key)=>/^opponent_system_\d+$/.test(key)).map((key)=>Number(key.match(/\d+/)[0])).sort((a,b)=>a-b)
          opponentFormationsRoot.innerHTML = ''
          opponentFormationCount = 0
          if (savedOpponentIndexes.length) savedOpponentIndexes.forEach((index)=>addOpponentFormation({system:saved[`opponent_system_${index}`],minute:saved[`opponent_system_minute_${index}`],note:saved[`opponent_system_note_${index}`]}))
          else addOpponentFormation()
          Object.entries(saved).forEach(([k,v])=>{const f=form.elements.namedItem(k);if(!f||f.type==='file')return;if(f.type==='checkbox')f.checked=v===true||v==='true'||v==='on';else f.value=v})
          syncCompactScore('result')
          syncCompactScore('half_result')
          for (let i=0;i<11;i+=1) {
            if (saved[`opponent_position_x_${i}`] !== undefined && saved[`opponent_position_y_${i}`] !== undefined) setOpponentTokenPosition(i, saved[`opponent_position_x_${i}`], saved[`opponent_position_y_${i}`], false)
          }
          hasSavedTokenPositions = Array.from({length:11},(_,i)=>`position_x_${i}`).every((key)=>saved[key] !== undefined) && Array.from({length:11},(_,i)=>`position_y_${i}`).every((key)=>saved[key] !== undefined)
        }
      } catch {}
      if (!eventContainers.substitution.children.length) addEventRow('substitution')
      if (!eventContainers.goal.children.length) addEventRow('goal')
      if (!eventContainers.card.children.length) addEventRow('card')
      if (!opponentFormationsRoot.children.length) addOpponentFormation()
      syncCustomFormation()
      restoreTokenPositions()
      bindTokenDragging()
      bindOpponentTokenDragging()
      bindLeadershipBadges()
      autoAssignCoreRoles(); renderNotes(); updateStarterOptions(); updateTokens(); updateAutomaticBench(); updateOpponentTokenStyle(); renderReport(); showStep(1)
    }

    const manualEditor = root.querySelector('[data-ts-manual-editor]')
    if (manualEditor) {
      const form = manualEditor.querySelector('[data-ts-manual-form]')
      const preview = manualEditor.querySelector('[data-ts-preview]')
      const phasesRoot = manualEditor.querySelector('[data-ts-phases]')
      const tsSteps = [...manualEditor.querySelectorAll('[data-ts-step]')]
      const tsStepButtons = [...manualEditor.querySelectorAll('[data-ts-step-button]')]
      const tsStepPrev = manualEditor.querySelector('[data-ts-step-prev]')
      const tsStepNext = manualEditor.querySelector('[data-ts-step-next]')
      const tsStepStatus = manualEditor.querySelector('[data-ts-step-status]')
      const tsStepFooter = manualEditor.querySelector('[data-ts-step-footer]')
      let activeTsStep = 1
      const showTsStep = (value) => {
        const nextStep = Math.min(6, Math.max(1, Number(value) || 1))
        activeTsStep = nextStep
        tsSteps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.tsStep) === nextStep))
        tsStepButtons.forEach((button) => button.classList.toggle('is-active', Number(button.dataset.tsStepButton) === nextStep))
        if (tsStepPrev) tsStepPrev.disabled = nextStep === 1
        if (tsStepNext) {
          tsStepNext.disabled = nextStep === 6
          tsStepNext.hidden = nextStep === 6
        }
        if (tsStepStatus) tsStepStatus.textContent = `Sezione ${nextStep} di 6`
        const activeSection = tsSteps.find((step) => Number(step.dataset.tsStep) === nextStep)
        if (activeSection && tsStepFooter) activeSection.appendChild(tsStepFooter)
        if (nextStep === 6) requestAnimationFrame(() => { updatePreview(); fitPreviewToViewport() })
        manualEditor.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      tsStepButtons.forEach((button) => button.addEventListener('click', () => showTsStep(button.dataset.tsStepButton)))
      tsStepPrev?.addEventListener('click', () => showTsStep(activeTsStep - 1))
      tsStepNext?.addEventListener('click', () => showTsStep(activeTsStep + 1))
      const draftStateRoot = manualEditor.querySelector('[data-ts-draft-state]')
      const draftState = draftStateRoot?.querySelector('span')
      const publishTrainingSheetButton = manualEditor.querySelector('[data-print-sheet]')
      const tsLocationSelect = form?.elements.location
      const tsCustomLocationField = manualEditor.querySelector('[data-ts-custom-location]')
      const tsCustomLocationInput = form?.elements.custom_location
      const syncTsLocation = () => {
        const isCustom = tsLocationSelect?.value === '__custom__'
        if (tsCustomLocationField) tsCustomLocationField.hidden = !isCustom
        if (tsCustomLocationInput) {
          tsCustomLocationInput.required = Boolean(isCustom)
          if (!isCustom) tsCustomLocationInput.value = ''
        }
      }
      tsLocationSelect?.addEventListener('change', syncTsLocation)
      syncTsLocation()
      const storageKey = 'nz-training-sheet-editor-v6-2'
      let phaseCount = 0
      let saveTimer = null
      let currentEditingEventId = localStorage.getItem('nz-training-sheet-open-event-id') || ''
      let currentTrainingDocument = normalizeTrainingSheetData({ status: TRAINING_SHEET_STATUS.DRAFT })
      let hasUnpublishedChanges = false

      const updateTrainingWorkflowUi = ({ dirty = hasUnpublishedChanges } = {}) => {
        hasUnpublishedChanges = Boolean(dirty)
        const status = currentTrainingDocument.status || TRAINING_SHEET_STATUS.DRAFT
        const labels = {
          [TRAINING_SHEET_STATUS.DRAFT]: hasUnpublishedChanges ? 'Bozza · modifiche salvate' : 'Bozza',
          [TRAINING_SHEET_STATUS.PUBLISHED]: hasUnpublishedChanges ? 'Pubblicata · modifiche locali' : 'Pubblicata',
        }
        if (draftStateRoot) draftStateRoot.dataset.status = status
        if (draftState) draftState.textContent = labels[status] || 'Bozza'
      }

      const setTrainingDocument = (data = {}, options = {}) => {
        currentTrainingDocument = normalizeTrainingSheetData(data)
        updateTrainingWorkflowUi({ dirty: options.dirty === true })
      }

      const rosterPlayers = getTrainingSheetRosterPlayers()
      const rosterPlayerByCanonicalName = new Map(
        rosterPlayers.map((player) => [player.canonicalName.toLocaleLowerCase('it-IT'), player]),
      )

      const escape = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]))
      const surnameOnly = (fullName = '') => {
        const normalized = String(fullName).trim().replace(/\s+/g, ' ')
        const matchingPlayer = rosterPlayerByCanonicalName.get(normalized.toLocaleLowerCase('it-IT'))
        if (matchingPlayer?.surname) return matchingPlayer.surname
        const parts = normalized.split(' ')
        return parts.at(-1) || normalized
      }
      const selectedPlayers = (type) => [...manualEditor.querySelectorAll(`[data-player-select="${type}"] input:checked`)].map(input => input.value)
      const selectedPillars = () => [...form.querySelectorAll('[name="pillars"]:checked')].map(input => input.value)
      const squadTotal = activePlayers().length
      const updatePresentCount = () => {
        const unavailable = new Set([...selectedPlayers('absent'), ...selectedPlayers('injured'), ...selectedPlayers('differentiated')])
        const provaCount = Math.max(0, Number(form.elements.aggregated_prova_count?.value || 0))
        const youthCount = Math.max(0, Number(form.elements.aggregated_youth_count?.value || 0))
        const aggregatedCount = provaCount + youthCount
        if (form.elements.aggregated_count) form.elements.aggregated_count.value = String(aggregatedCount)
        if (form.elements.aggregated) {
          form.elements.aggregated.value = provaCount && youthCount
            ? 'PROVA + SETTORE GIOVANILE'
            : provaCount
              ? 'PROVA'
              : youthCount
                ? 'SETTORE GIOVANILE'
                : ''
        }
        const present = Math.max(0, squadTotal - unavailable.size + aggregatedCount)
        if (form.elements.present) form.elements.present.value = String(present)
        return present
      }

      const addPhase = (data = {}) => {
        const index = phaseCount++
        phasesRoot.insertAdjacentHTML('beforeend', `
          <article class="ts-phase-editor" data-phase>
            <div class="ts-phase-editor-head"><strong>FASE ${index + 1}</strong><div class="ts-phase-editor-actions"><button type="button" class="staff-button staff-button--secondary ts-split-phase-button" data-toggle-phase-split>${data.split ? 'Riunisci fase' : 'Dividi fase'}</button><button type="button" class="staff-button staff-button--danger ts-remove-phase-button" data-remove-phase aria-label="Rimuovi fase">×</button></div></div>
            <div class="ts-phase-layout">
              <label class="ts-field ts-phase-title-field"><span>Titolo</span><input name="phase_title_${index}" value="${escape(data.title || '')}" placeholder="Es. Attivazione, Gioco di posizione, Possesso"></label>
              <div class="ts-phase-meta-fields">
                <label class="ts-field ts-phase-duration-field"><span>Durata</span><div class="ts-duration-input"><input name="phase_duration_${index}" type="number" min="1" value="${escape(data.duration || '')}" placeholder="10"><small>min</small></div></label>
                <label class="ts-field ts-phase-goalkeepers-field"><span>Portieri</span><select name="phase_goalkeepers_${index}"><option value="no" ${(!data.goalkeepers || data.goalkeepers==='no')?'selected':''}>No</option><option value="yes" ${data.goalkeepers==='yes'?'selected':''}>Sì</option><option value="separate" ${data.goalkeepers==='separate'?'selected':''}>Lavoro separato</option></select></label>
              </div>
            </div>
            <label class="ts-field ts-field-full"><span>Note</span><textarea name="phase_description_${index}" rows="4" placeholder="Organizzazione, numeri, spazi, regole, obiettivi e indicazioni operative...">${escape(data.description || '')}</textarea></label>
            <div class="ts-parallel-work ${data.split ? 'is-active' : ''}" data-parallel-work ${data.split ? '' : 'hidden'}>
              <div class="ts-parallel-work-head"><strong>Lavori paralleli</strong><span>Stesso intervallo temporale della fase</span></div>
              <div class="ts-parallel-work-grid">
                <section><b>GRUPPO A</b><label class="ts-field"><span>Titolo</span><input name="phase_parallel_a_title_${index}" value="${escape(data.parallelA?.title || '')}" placeholder="Es. Forza con il prof"></label><label class="ts-field"><span>Note</span><textarea name="phase_parallel_a_description_${index}" rows="3">${escape(data.parallelA?.description || '')}</textarea></label></section>
                <section><b>GRUPPO B</b><label class="ts-field"><span>Titolo</span><input name="phase_parallel_b_title_${index}" value="${escape(data.parallelB?.title || '')}" placeholder="Es. Rondo"></label><label class="ts-field"><span>Note</span><textarea name="phase_parallel_b_description_${index}" rows="3">${escape(data.parallelB?.description || '')}</textarea></label></section>
              </div>
            </div>
            <input type="hidden" name="phase_split_${index}" value="${data.split ? 'true' : 'false'}">
            <details class="ts-phase-advanced" ${(data.variants || data.coaching) ? 'open' : ''}>
              <summary>＋ Aggiungi varianti o coaching point</summary>
              <div class="ts-phase-compact two">
                <label class="ts-field"><span>Varianti</span><textarea name="phase_variants_${index}" rows="2">${escape(data.variants || '')}</textarea></label>
                <label class="ts-field"><span>Coaching point</span><textarea name="phase_coaching_${index}" rows="2">${escape(data.coaching || '')}</textarea></label>
              </div>
            </details>
          </article>
        `)
        const phaseElement = phasesRoot.lastElementChild
        phaseElement.querySelector('[data-remove-phase]').addEventListener('click', (event) => {
          event.currentTarget.closest('[data-phase]').remove(); updatePreview(); scheduleSave()
        })
        phaseElement.querySelector('[data-toggle-phase-split]')?.addEventListener('click', (event) => {
          const parallel = phaseElement.querySelector('[data-parallel-work]')
          const splitInput = phaseElement.querySelector('[name^="phase_split_"]')
          const willSplit = parallel.hidden
          parallel.hidden = !willSplit
          parallel.classList.toggle('is-active', willSplit)
          splitInput.value = willSplit ? 'true' : 'false'
          event.currentTarget.textContent = willSplit ? 'Riunisci fase' : 'Dividi fase'
          updatePreview(); scheduleSave()
        })
      }

      const collect = () => {
        const fd = new FormData(form)
        const phases = [...phasesRoot.querySelectorAll('[data-phase]')].map((node) => {
          const title = node.querySelector('[name^="phase_title_"]')?.value || ''
          const duration = node.querySelector('[name^="phase_duration_"]')?.value || ''
          const goalkeepers = node.querySelector('[name^="phase_goalkeepers_"]')?.value || ''
          const description = node.querySelector('[name^="phase_description_"]')?.value || ''
          const variants = node.querySelector('[name^="phase_variants_"]')?.value || ''
          const coaching = node.querySelector('[name^="phase_coaching_"]')?.value || ''
          const split = node.querySelector('[name^="phase_split_"]')?.value === 'true'
          const parallelA = { title: node.querySelector('[name^="phase_parallel_a_title_"]')?.value || '', description: node.querySelector('[name^="phase_parallel_a_description_"]')?.value || '' }
          const parallelB = { title: node.querySelector('[name^="phase_parallel_b_title_"]')?.value || '', description: node.querySelector('[name^="phase_parallel_b_description_"]')?.value || '' }
          return { title, duration, goalkeepers, description, variants, coaching, split, parallelA, parallelB }
        })
        return normalizeTrainingSheetData({
          ...currentTrainingDocument,
          date: fd.get('date') || '', time: fd.get('time') || '', location: fd.get('location') === '__custom__' ? (fd.get('custom_location') || '') : (fd.get('location') || ''), progressive: fd.get('progressive') || '', present: updatePresentCount(), focus: fd.get('focus') || '', match_day: fd.get('match_day') || '', intensity: fd.get('intensity') || '', volume: fd.get('volume') || '', objective: fd.get('objective') || '', principles: fd.get('principles') || '', pillars: selectedPillars(), absent: selectedPlayers('absent'), injured: selectedPlayers('injured'), differentiated: selectedPlayers('differentiated'), aggregated: fd.get('aggregated') || '', aggregated_count: Math.max(0, Number(fd.get('aggregated_count') || 0)), aggregated_prova_count: Math.max(0, Number(fd.get('aggregated_prova_count') || 0)), aggregated_youth_count: Math.max(0, Number(fd.get('aggregated_youth_count') || 0)), phases
        })
      }

      const bar = (value) => `<span class="ts-mini-scale">${[1,2,3,4,5].map(n=>`<i class="${Number(value)>=n?'on':''}"></i>`).join('')}</span>`
      const fitPreviewToViewport = () => {
        const frame = manualEditor.querySelector('.ts-paper-frame')
        if (!frame || !preview) return
        if (window.innerWidth > 720) {
          preview.style.width = ''
          preview.style.transform = ''
          preview.style.transformOrigin = ''
          frame.style.height = ''
          frame.style.overflow = ''
          return
        }
        const paperWidth = 680
        const available = Math.max(280, frame.clientWidth - 2)
        const scale = Math.min(1, available / paperWidth)
        preview.style.width = `${paperWidth}px`
        preview.style.transformOrigin = 'top left'
        preview.style.transform = `scale(${scale})`
        requestAnimationFrame(() => {
          frame.style.height = `${Math.ceil(preview.scrollHeight * scale + 4)}px`
          frame.style.overflow = 'hidden'
        })
      }

      const updatePreview = () => {
        const d = collect()
        const team = getTeamProfile()
        const coachName = profileFullName(appState.currentUserProfile)
        const coachInitials = coachName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CO'
        const teamBrand = teamLogoHtml('ts-paper-brand-logo')
        const formattedDate = d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString('it-IT') : '—'
        const total = d.phases.reduce((sum,p)=>sum+(Number(p.duration)||0),0)
        preview.innerHTML = `
          <div class="ts-watermark" aria-hidden="true"><b>${escape(coachInitials)}</b><div>${Array.from({length:8},()=>`<span>${escape(coachName.toUpperCase())} · ${escape(coachName.toUpperCase())} · ${escape(coachName.toUpperCase())}</span>`).join('')}</div></div>
          <div class="ts-paper-content">
          <header class="ts-paper-head"><div class="ts-paper-brand">${teamBrand}<div><strong>${escape(String(team.name || team.shortName || 'SQUADRA').toUpperCase())}</strong><span>TRAINING SHEET</span></div></div><div class="ts-paper-title"><small>ALLENATORE · ${escape(coachName.toUpperCase())}</small><strong>ALL_${String(d.progressive || '---').padStart(3,'0')}</strong></div></header>
          <div class="ts-paper-meta"><span><small>Data</small><b>${escape(formattedDate)}</b></span><span><small>Ora</small><b>${escape(d.time || '—')}</b></span><span><small>Campo</small><b>${escape(d.location || '—')}</b></span><span><small>Presenti</small><b>${escape(d.present || '—')}</b></span><span class="ts-paper-md ts-md-${escape((d.match_day || 'none').replace('+','plus').replace('-','minus').toLowerCase())}">${escape(d.match_day || '')}</span></div>
          <section class="ts-paper-roster ts-paper-roster--four"><div><small>ASSENTI</small><p>${d.absent.length?d.absent.map(n=>`<span>${escape(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="inj"><small>INFORTUNATI</small><p>${d.injured.length?d.injured.map(n=>`<span>${escape(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="diff"><small>DIFFERENZIATO</small><p>${d.differentiated?.length?d.differentiated.map(n=>`<span>${escape(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="agg"><small>AGGREGATI</small><p>${Number(d.aggregated_prova_count || 0) || Number(d.aggregated_youth_count || 0) ? `${Number(d.aggregated_prova_count || 0) ? `<span>PROVA ${Number(d.aggregated_prova_count)}</span>` : ''}${Number(d.aggregated_youth_count || 0) ? `<span>SETTORE ${Number(d.aggregated_youth_count)}</span>` : ''}` : '<em>Nessuno</em>'}</p></div></section>
          <div class="ts-paper-load"><span><small>Focus fisico</small><b>${escape(d.focus || '—')}</b></span><span><small>Intensità</small>${bar(d.intensity)}</span><span><small>Volume</small>${bar(d.volume)}</span><span><small>Durata</small><b>${total || '—'}'</b></span></div>
          <section class="ts-paper-pillars">${['Creare il vantaggio','Conservare il vantaggio','Sfruttare il vantaggio','Difendere il vantaggio'].map((p,i)=>`<span class="pillar-${i+1} ${d.pillars.includes(p)?'is-selected':'is-muted'}">${escape(p)}</span>`).join('')}</section>
          <section class="ts-paper-body"><div class="ts-paper-phases">${d.phases.length ? d.phases.map((p,i)=>`<article class="${p.split ? 'is-split' : ''}"><div class="ts-paper-phase-head"><b>${String(i+1).padStart(2,'0')}</b><strong>FASE ${i+1}${p.title?` · ${escape(p.title)}`:''}</strong><div class="ts-paper-phase-meta"><span class="ts-phase-gk">Portieri: ${p.goalkeepers==='yes'?'Sì':p.goalkeepers==='separate'?'Separati':'No'}</span><span class="ts-phase-duration">${escape(p.duration || '—')}'</span></div></div>${p.split ? `<div class="ts-paper-parallel"><section><b>GRUPPO A${p.parallelA?.title ? ` · ${escape(p.parallelA.title)}` : ''}</b><p>${escape(p.parallelA?.description || 'Da completare')}</p></section><section><b>GRUPPO B${p.parallelB?.title ? ` · ${escape(p.parallelB.title)}` : ''}</b><p>${escape(p.parallelB?.description || 'Da completare')}</p></section></div>` : `<p>${escape(p.description || 'Descrizione da completare')}</p>`}${p.variants?`<small><b>Varianti:</b> ${escape(p.variants)}</small>`:''}${p.coaching?`<small><b>Coaching point:</b> ${escape(p.coaching)}</small>`:''}</article>`).join('') : '<p class="ts-paper-empty">Aggiungi la prima fase.</p>'}</div></section>
          <section class="ts-paper-objectives"><div><small>OBIETTIVO</small><p>${escape(d.objective || 'Da definire')}</p></div><div><small>PRINCIPI</small><p>${escape(d.principles || 'Da definire')}</p></div></section>
          </div>
        `
        requestAnimationFrame(fitPreviewToViewport)
      }
      window.addEventListener('resize', fitPreviewToViewport, { passive: true })

      const saveDraft = () => {
        const data = collect()
        localStorage.setItem(storageKey, JSON.stringify(data))
        currentTrainingDocument = data
        updateTrainingWorkflowUi({ dirty: true })
      }
      const scheduleSave = () => {
        hasUnpublishedChanges = true
        if (draftState) draftState.textContent = 'Salvataggio…'
        clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 450)
      }
      const updateCounts = () => {
        manualEditor.querySelectorAll('[data-player-select]').forEach((box) => {
          const count = box.querySelectorAll('input:checked').length
          const counter = box.querySelector('[data-count]')
          if (counter) counter.textContent = `${count} selezionati`
        })
        updatePresentCount()
      }

      const syncAggregatedUi = ({ keepOpen = false } = {}) => {
        const menu = manualEditor.querySelector('[data-aggregated-menu]')
        const summary = manualEditor.querySelector('[data-aggregated-summary]')
        const provaCount = Math.max(0, Number(form.elements.aggregated_prova_count?.value || 0))
        const youthCount = Math.max(0, Number(form.elements.aggregated_youth_count?.value || 0))
        const total = provaCount + youthCount
        if (summary) {
          summary.textContent = total
            ? `${provaCount ? `Prova ${provaCount}` : ''}${provaCount && youthCount ? ' · ' : ''}${youthCount ? `Settore ${youthCount}` : ''}`
            : 'Gestisci'
        }
        if (menu) menu.open = keepOpen || total > 0
      }

      const normalizePlayerValue = (value = '') => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('it-IT')
        .replace(/[^a-z0-9]/g, '')

      const normalizePlayerTokens = (value = '') => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('it-IT')
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .sort()
        .join('|')

      const filterTrainingRosterSelector = (selector) => {
        if (!selector) return
        const searchInput = selector.querySelector('[data-player-search]')
        const query = normalizePlayerValue(searchInput?.value || '')
        selector.querySelectorAll('.ts-player-option').forEach((option) => {
          const input = option.querySelector('input')
          const canonicalName = String(input?.dataset.canonicalName || '')
          const surname = String(input?.dataset.surname || '')
          const surnameKey = normalizePlayerValue(surname)
          const wordKeys = canonicalName.split(/\s+/).map(normalizePlayerValue).filter(Boolean)
          const prefixMatch = surnameKey.startsWith(query) || wordKeys.some((word) => word.startsWith(query))
          const match = !query || prefixMatch
          option.classList.toggle('is-filtered-out', !match)
          if (match) option.style.removeProperty('display')
          else option.style.setProperty('display', 'none', 'important')
        })
        selector.querySelectorAll('.ts-roster-department').forEach((department) => {
          const hasVisiblePlayer = [...department.querySelectorAll('.ts-player-option')]
            .some((option) => !option.classList.contains('is-filtered-out'))
          department.classList.toggle('is-filtered-out', !hasVisiblePlayer)
          if (hasVisiblePlayer) department.style.removeProperty('display')
          else department.style.setProperty('display', 'none', 'important')
        })
      }

      manualEditor.addEventListener('input', (event) => {
        const searchInput = event.target.closest?.('[data-player-search]')
        if (!searchInput) return
        filterTrainingRosterSelector(searchInput.closest('[data-player-select]'))
      })

      manualEditor.addEventListener('click', (event) => {
        const clearButton = event.target.closest?.('[data-clear-player-search]')
        if (!clearButton) return
        event.preventDefault()
        event.stopPropagation()
        const selector = clearButton.closest('[data-player-select]')
        const searchInput = selector?.querySelector('[data-player-search]')
        if (searchInput) searchInput.value = ''
        filterTrainingRosterSelector(selector)
        if (selector) selector.open = false
      })

      manualEditor.addEventListener('search', (event) => {
        const searchInput = event.target.closest?.('[data-player-search]')
        if (!searchInput || searchInput.value) return
        const selector = searchInput.closest('[data-player-select]')
        filterTrainingRosterSelector(selector)
        if (selector) selector.open = false
      })

      const applyTrainingSheetData = (data = {}) => {
        const d = data && typeof data === 'object' ? data : {}

        phasesRoot.innerHTML = ''
        phaseCount = 0
        form.reset()
        form.querySelectorAll('[name="pillars"]').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[data-player-select]').forEach((selector) => {
        const searchInput = selector.querySelector('[data-player-search]')
        if (searchInput) searchInput.value = ''
        filterTrainingRosterSelector(selector)
      })

      manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[data-player-search]').forEach((input) => { input.value = '' })
        if (form.elements.aggregated) form.elements.aggregated.value = ''
        if (form.elements.aggregated_count) form.elements.aggregated_count.value = '0'
        if (form.elements.aggregated_prova_count) form.elements.aggregated_prova_count.value = '0'
        if (form.elements.aggregated_youth_count) form.elements.aggregated_youth_count.value = '0'
        syncAggregatedUi()

        const location = String(d.location || '').trim()
        const availableLocations = [...form.elements.location.options].map((option) => option.value).filter((value) => value && value !== '__custom__')
        if (location && hasTeamLocation(availableLocations, location)) {
          form.elements.location.value = availableLocations.find((item) => item.toLocaleLowerCase('it-IT') === location.toLocaleLowerCase('it-IT')) || location
          if (form.elements.custom_location) form.elements.custom_location.value = ''
        } else if (location) {
          form.elements.location.value = '__custom__'
          if (form.elements.custom_location) form.elements.custom_location.value = location
        } else {
          form.elements.location.value = ''
          if (form.elements.custom_location) form.elements.custom_location.value = ''
        }
        syncTsLocation()

        const scalarFields = ['date', 'time', 'progressive', 'focus', 'objective', 'principles']
        scalarFields.forEach((fieldName) => {
          const field = form.elements.namedItem(fieldName)
          if (field) field.value = d[fieldName] ?? ''
        })
        if (!form.elements.time.value) form.elements.time.value = '17:30'

        const matchDay = d.match_day || d.matchDay || ''
        if (form.elements.match_day) form.elements.match_day.value = matchDay

        const phases = Array.isArray(d.phases) ? d.phases : []
        phases.length ? phases.forEach(addPhase) : addPhase()

        const pillars = Array.isArray(d.pillars) ? d.pillars : []
        pillars.forEach((value) => {
          const input = [...form.querySelectorAll('[name="pillars"]')].find((candidate) => candidate.value === value)
          if (input) input.checked = true
        })

        ;['absent', 'injured', 'differentiated'].forEach((type) => {
          const values = Array.isArray(d[type]) ? d[type] : []
          values.forEach((value) => {
            const normalizedValue = normalizePlayerValue(value)
            const tokenizedValue = normalizePlayerTokens(value)
            const input = [...manualEditor.querySelectorAll(`[data-player-select="${type}"] input`)].find((candidate) =>
              normalizePlayerValue(candidate.value) === normalizedValue ||
              normalizePlayerValue(candidate.dataset.canonicalName) === normalizedValue ||
              normalizePlayerTokens(candidate.dataset.canonicalName) === tokenizedValue
            )
            if (input) input.checked = true
          })
        })

        if (form.elements.aggregated) {
          const aggregatedValue = Array.isArray(d.aggregated) ? '' : String(d.aggregated || '')
          form.elements.aggregated.value = ['PROVA', 'SETTORE GIOVANILE'].includes(aggregatedValue) ? aggregatedValue : ''
        }
        {
          const legacyAggregatedType = String(d.aggregated || '')
          const legacyAggregatedCount = Math.max(0, Number(d.aggregated_count ?? d.aggregatedCount ?? 0))
          const provaCount = Math.max(0, Number(d.aggregated_prova_count ?? d.aggregatedProvaCount ?? (legacyAggregatedType === 'PROVA' ? legacyAggregatedCount : 0)))
          const youthCount = Math.max(0, Number(d.aggregated_youth_count ?? d.aggregatedYouthCount ?? (legacyAggregatedType === 'SETTORE GIOVANILE' ? legacyAggregatedCount : 0)))
          if (form.elements.aggregated_prova_count) form.elements.aggregated_prova_count.value = String(provaCount)
          if (form.elements.aggregated_youth_count) form.elements.aggregated_youth_count.value = String(youthCount)
          if (form.elements.aggregated_count) form.elements.aggregated_count.value = String(provaCount + youthCount)
        }
        syncAggregatedUi()

        manualEditor.querySelectorAll('[data-md]').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.md === matchDay)
        })
        manualEditor.querySelectorAll('[data-rating]').forEach((group) => {
          const value = Number(d[group.dataset.rating] || 0)
          const hiddenInput = group.querySelector('input')
          if (hiddenInput) hiddenInput.value = value || ''
          group.querySelectorAll('button').forEach((button) => {
            button.classList.toggle('is-active', Number(button.dataset.value) <= value)
          })
        })

        updateCounts()
        updatePreview()
        setTrainingDocument(d, { dirty: false })
      }

      const restore = () => {
        const raw = localStorage.getItem(storageKey)
        if (!raw) {
          applyTrainingSheetData({ time: '17:30', location: '' })
          return
        }
        try {
          applyTrainingSheetData(JSON.parse(raw))
        } catch (error) {
          console.warn('Bozza TS non leggibile:', error)
          localStorage.removeItem(storageKey)
          applyTrainingSheetData({ time: '17:30', location: '' })
        }
      }

      manualEditor.querySelector('[data-add-phase]')?.addEventListener('click',()=>{addPhase();updatePreview();scheduleSave()})
      manualEditor.querySelectorAll('[data-md]').forEach(button=>button.addEventListener('click',()=>{ manualEditor.querySelectorAll('[data-md]').forEach(b=>b.classList.remove('is-active')); button.classList.add('is-active'); form.elements.match_day.value=button.dataset.md; updatePreview(); scheduleSave() }))
      manualEditor.querySelectorAll('[data-rating]').forEach(group=>group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{ const value=Number(button.dataset.value); group.querySelector('input').value=value; group.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',Number(b.dataset.value)<=value)); updatePreview(); scheduleSave() })))
      manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => {
        input.addEventListener('change', () => {
          if (input.checked) {
            const currentType = input.closest('[data-player-select]')?.dataset.playerSelect
            const otherType = currentType === 'absent' ? 'injured' : 'absent'
            const twin = [...manualEditor.querySelectorAll(`[data-player-select="${otherType}"] input`)]
              .find((candidate) => candidate.value === input.value)
            if (twin) twin.checked = false
          }
        })
      })
      const rosterDisclosures = [...manualEditor.querySelectorAll('[data-player-select]')]
      const aggregatedDisclosure = manualEditor.querySelector('[data-aggregated-menu]')
      rosterDisclosures.forEach((details) => {
        details.addEventListener('toggle', () => {
          if (!details.open) return
          rosterDisclosures.forEach((other) => { if (other !== details) other.open = false })
          if (aggregatedDisclosure) aggregatedDisclosure.open = false
        })
      })
      aggregatedDisclosure?.addEventListener('toggle', () => {
        if (!aggregatedDisclosure.open) return
        rosterDisclosures.forEach((details) => { details.open = false })
      })
      manualEditor.querySelectorAll('[name="aggregated_prova_count"], [name="aggregated_youth_count"]').forEach((input) => {
        input.addEventListener('input', () => syncAggregatedUi({ keepOpen: true }))
      })
      form.addEventListener('input',()=>{updateCounts();updatePreview();scheduleSave()})
      form.addEventListener('change',()=>{updateCounts();updatePreview();scheduleSave()})
      manualEditor.querySelector('[data-analyze-exercises]')?.addEventListener('click',()=>{
        const d=collect(); const text=d.phases.map(p=>`${p.title} ${p.description}`).join(' ').toLowerCase(); const pillars=d.pillars
        const objectiveBits=[]; const principles=[]
        if(/costru|uscita|portiere|prima pressione/.test(text)){objectiveBits.push('creare vantaggio nella costruzione sotto pressione');principles.push('occupazione razionale degli spazi','ricerca dell’uomo libero','sostegno al possessore')}
        if(/possesso|rondo|jolly|conserv/.test(text)){objectiveBits.push('conservare il possesso con continuità');principles.push('smarcamento in appoggio','mobilità','qualità del primo controllo')}
        if(/final|porta|attacco|invasione|profond/.test(text)){objectiveBits.push('sfruttare il vantaggio per arrivare alla finalizzazione');principles.push('attacco della profondità','occupazione dell’area','tempi di inserimento')}
        if(/press|riaggress|transizione|riconquista/.test(text)){objectiveBits.push('proteggere il vantaggio attraverso pressione e riaggressione');principles.push('reazione immediata alla perdita','densità vicino alla palla','coperture preventive')}
        if(!objectiveBits.length) objectiveBits.push(pillars.length ? pillars.join(', ').toLowerCase() : 'sviluppare i comportamenti collettivi previsti dalla seduta')
        form.elements.objective.value=objectiveBits.join('; ').replace(/^./,c=>c.toUpperCase())+'.'
        form.elements.principles.value=[...new Set(principles)].join(', ') || 'Distanze funzionali, comunicazione, orientamento del corpo e velocità di esecuzione.'
        const note=manualEditor.querySelector('[data-ai-note]'); if(note) note.textContent='Proposta inserita: controlla e modifica liberamente i due campi.'
        updatePreview();scheduleSave()
      })
      const determineNextProgressive = () => {
        const fromPaths = appState.calendarEvents
          .map((event) => event.trainingSheetPath || '')
          .map((path) => Number(path.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || 0))
        const storedNext = Number(localStorage.getItem('nz-training-sheet-next-progressive') || 0)
        return Math.max(1, storedNext, ...fromPaths.map((value) => value + 1))
      }
      const confirmPdfPreview = (blob, fileName) => new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob)
        const overlay = document.createElement('div')
        overlay.className = 'ts-pdf-confirm-overlay'
        overlay.innerHTML = `
          <section class="ts-pdf-confirm-dialog" role="dialog" aria-modal="true" aria-label="Anteprima PDF">
            <header>
              <div><span>ANTEPRIMA DI STAMPA</span><strong>${tsEscapeHtml(fileName)}</strong></div>
              <button type="button" data-pdf-cancel aria-label="Chiudi">×</button>
            </header>
            <iframe title="Anteprima PDF" src="${objectUrl}#toolbar=1&navpanes=0&view=FitH"></iframe>
            <footer>
              <button type="button" class="secondary" data-pdf-cancel>Annulla</button>
              <button type="button" class="primary" data-pdf-confirm>Conferma e salva PDF</button>
            </footer>
          </section>`
        document.body.appendChild(overlay)
        const finish = (confirmed) => {
          URL.revokeObjectURL(objectUrl)
          overlay.remove()
          resolve(confirmed)
        }
        overlay.querySelectorAll('[data-pdf-cancel]').forEach((button) => button.addEventListener('click', () => finish(false)))
        overlay.querySelector('[data-pdf-confirm]')?.addEventListener('click', () => finish(true))
        overlay.addEventListener('click', (event) => { if (event.target === overlay) finish(false) })
      })

      const createAndPublishPdf = async () => {
        const button = manualEditor.querySelector('[data-print-sheet]')
        const note = manualEditor.querySelector('[data-publish-note]')
        const rawData = collect()
        button.disabled = true
        button.classList.add('is-loading')
        const label = button.querySelector('span')
        const originalLabel = label?.textContent || 'Crea PDF'
        if (label) label.textContent = 'Creazione…'
        if (note) note.textContent = 'Creazione e pubblicazione della Training Sheet…'

        try {
          const publishTarget = resolveTrainingCalendarPublishTarget({
            events: appState.calendarEvents,
            eventId: currentEditingEventId,
            data: rawData,
          })
          const existingEvent = publishTarget.event

          const result = await publishTrainingSheet({
            rawData,
            previewElement: preview,
            team: getTeamProfile(),
            squadTotal,
            existingEvent,
            duplicateEvents: publishTarget.duplicateEvents,
            confirmPreview: confirmPdfPreview,
            createEvent: createCalendarEvent,
            updateEvent: updateCalendarEvent,
            deleteEvent: deleteCalendarEvent,
          })

          if (result.cancelled) {
            if (note) note.textContent = 'Creazione PDF annullata. Nessun file è stato salvato.'
            return
          }

          localStorage.setItem('nz-training-sheet-next-progressive', String(Number(result.data.progressive || 1) + 1))
          localStorage.setItem(`nz-training-sheet:${result.filePath}`, JSON.stringify(result.data))
          localStorage.setItem(storageKey, JSON.stringify(result.data))
          await loadCalendarEvents()
          currentEditingEventId = String(result.event?.id || existingEvent?.id || currentEditingEventId || '')
          if (currentEditingEventId) localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
          setTrainingDocument(result.data, { dirty: false })
          if (note) {
            note.textContent = result.warnings?.length
              ? `Training Sheet pubblicata nel Calendario. ${result.warnings.map((warning) => warning.message).join(' ')}`
              : 'PDF creato e Training Sheet pubblicata nel Calendario.'
          }
        } catch (error) {
          console.error('Errore pubblicazione Training Sheet:', error)
          if (note) note.textContent = getUserErrorMessage(error, 'Pubblicazione non riuscita. Il documento precedente è rimasto invariato.')
        } finally {
          button.disabled = false
          button.classList.remove('is-loading')
          if (label) label.textContent = originalLabel
        }
      }

      const resetEditor = () => {
        if (!window.confirm('Vuoi cancellare tutti i campi della Training Sheet Editor?')) return
        localStorage.removeItem(storageKey)
        localStorage.removeItem('nz-training-sheet-open-event-id')
        currentEditingEventId = ''
        setTrainingDocument({ status: TRAINING_SHEET_STATUS.DRAFT }, { dirty: false })
        const openSheetSelect = manualEditor.querySelector('[data-open-training-sheet]')
        const openSheetButton = manualEditor.querySelector('[data-open-training-sheet-button]')
        if (openSheetSelect) openSheetSelect.value = ''
        if (openSheetButton) openSheetButton.disabled = true
        form.reset()
        form.elements.time.value = '17:30'
        form.elements.location.value = ''
        if (form.elements.custom_location) form.elements.custom_location.value = ''
        syncTsLocation()
        manualEditor.querySelectorAll('[data-md] button, [data-md]').forEach?.(() => {})
        manualEditor.querySelectorAll('[data-md]').forEach((button) => button.classList.remove('is-active'))
        manualEditor.querySelectorAll('[data-rating] button').forEach((button) => button.classList.remove('is-active'))
        manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[name="pillars"]')?.forEach?.((input) => { input.checked = false })
        phasesRoot.innerHTML = ''
        addPhase()
        form.elements.progressive.value = String(determineNextProgressive())
        const today = new Date().toLocaleDateString('sv-SE')
        form.elements.date.value = today
        updateCounts(); updatePreview(); saveDraft()
        if (draftState) draftState.textContent = 'Editor azzerato'
        showTsStep(1)
      }
      manualEditor.querySelector('[data-reset-training-sheet]')?.addEventListener('click', resetEditor)

      const openSheetSelect = manualEditor.querySelector('[data-open-training-sheet]')
      const openSheetButton = manualEditor.querySelector('[data-open-training-sheet-button]')

      const loadTrainingSheetByEventId = async (eventId) => {
        if (!eventId) return false
        if (draftState) draftState.textContent = 'Apertura Training Sheet…'
        if (openSheetButton) openSheetButton.disabled = true

        try {
          let selected = appState.calendarEvents.find((item) => String(item.id) === String(eventId))

          // Lettura diretta come fallback: evita che cache o lista eventi non aggiornata
          // impediscano di riaprire una Training Sheet appena pubblicata.
          if (!selected?.editorData && supabase) {
            let rawEvent = null
            try { rawEvent = await getCalendarEvent(eventId) } catch (_) {}

            if (rawEvent) {
              let parsedNotes = {}
              try { parsedNotes = JSON.parse(rawEvent.notes || '{}') } catch { parsedNotes = {} }
              selected = {
                ...(selected || {}),
                id: rawEvent.id,
                startAt: rawEvent.start_at,
                time: new Date(rawEvent.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                place: rawEvent.location || '',
                matchDay: rawEvent.match_day || null,
                trainingSheetPath: rawEvent.training_sheet_path || null,
                editorData: parsedNotes?.type === 'training_sheet_editor' ? parsedNotes.data : null,
              }
            }
          }

          if (!selected) throw new Error('Training Sheet non trovata nel Calendario.')

          const savedKey = selected.trainingSheetPath ? `nz-training-sheet:${selected.trainingSheetPath}` : ''
          const localSaved = savedKey ? localStorage.getItem(savedKey) : null
          let parsedLocalData = null
          if (localSaved) {
            try { parsedLocalData = JSON.parse(localSaved) } catch { parsedLocalData = null }
          }
          const rawSourceData = selected.editorData || parsedLocalData
          if (!rawSourceData && !selected.trainingSheetPath) {
            const draftData = buildTrainingDraftFromCalendarEvent(selected, {
              progressive: determineNextProgressive(),
              present: selected.presentCount ?? squadTotal,
              phases: [{}],
            })
            currentEditingEventId = String(selected.id)
            applyTrainingSheetData(draftData)
            localStorage.setItem(storageKey, JSON.stringify(draftData))
            localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
            if (openSheetSelect) openSheetSelect.value = ''
            updateTrainingWorkflowUi({ dirty: false })
            if (draftState) draftState.textContent = 'Bozza collegata al Calendario'
            return true
          }
          const normalizeLoadedData = (source = {}) => ({
            status: source.status || TRAINING_SHEET_STATUS.PUBLISHED,
            created_at: source.created_at || source.createdAt || null,
            updated_at: source.updated_at || source.updatedAt || null,
            published_at: source.published_at || source.publishedAt || null,
            archived_at: source.archived_at || source.archivedAt || null,
            date: source.date || new Date(selected.startAt).toLocaleDateString('sv-SE'),
            time: source.time || selected.time || '17:30',
            location: source.location || selected.place || '',
            progressive: source.progressive || selected.trainingSheetPath?.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || determineNextProgressive(),
            present: source.present ?? selected.presentCount ?? squadTotal,
            focus: source.focus || '',
            match_day: source.match_day || source.matchDay || selected.matchDay || '',
            intensity: source.intensity || '',
            volume: source.volume || '',
            objective: source.objective || '',
            principles: source.principles || '',
            pillars: Array.isArray(source.pillars) ? source.pillars : [],
            absent: Array.isArray(source.absent) ? source.absent : (Array.isArray(source.absences?.absent) ? source.absences.absent : []),
            injured: Array.isArray(source.injured) ? source.injured : (Array.isArray(source.absences?.injured) ? source.absences.injured : []),
            differentiated: Array.isArray(source.differentiated) ? source.differentiated : [],
            aggregated: typeof source.aggregated === 'string' ? source.aggregated : '',
            aggregated_count: Math.max(0, Number(source.aggregated_count ?? source.aggregatedCount ?? 0)),
            aggregated_prova_count: Math.max(0, Number(source.aggregated_prova_count ?? source.aggregatedProvaCount ?? 0)),
            aggregated_youth_count: Math.max(0, Number(source.aggregated_youth_count ?? source.aggregatedYouthCount ?? 0)),
            phases: Array.isArray(source.phases) ? source.phases.map((phase = {}) => ({
              title: phase.title || '',
              duration: phase.duration ?? phase.duration_minutes ?? '',
              goalkeepers: phase.goalkeepers === true ? 'yes' : phase.goalkeepers === false ? 'no' : (phase.goalkeepers || 'no'),
              description: phase.description || phase.notes || '',
              variants: phase.variants || '',
              coaching: phase.coaching || phase.coaching_points || '',
              split: Boolean(phase.split),
              parallelA: phase.parallelA && typeof phase.parallelA === 'object' ? phase.parallelA : { title: '', description: '' },
              parallelB: phase.parallelB && typeof phase.parallelB === 'object' ? phase.parallelB : { title: '', description: '' },
            })) : [],
          })
          const sourceData = rawSourceData ? normalizeLoadedData(rawSourceData) : null

          if (sourceData) {
            currentEditingEventId = String(selected.id)
            applyTrainingSheetData(sourceData)
            localStorage.setItem(storageKey, JSON.stringify(collect()))
          } else {
            // Compatibilità con PDF storici: ripristina almeno i dati disponibili,
            // senza fingere di poter ricostruire contenuti mai salvati come JSON.
            applyTrainingSheetData({
              status: TRAINING_SHEET_STATUS.PUBLISHED,
              date: new Date(selected.startAt).toLocaleDateString('sv-SE'),
              time: selected.time || '17:30',
              location: selected.place || '',
              match_day: selected.matchDay || '',
              progressive: String(Number(selected.trainingSheetPath?.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || determineNextProgressive())),
              phases: [{}],
            })
            saveDraft()
            if (draftState) draftState.textContent = 'TS storica: disponibili solo i dati archiviati'
            return true
          }

          currentEditingEventId = String(selected.id)
          localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
          if (openSheetSelect) openSheetSelect.value = String(selected.id)
          updateTrainingWorkflowUi({ dirty: false })
          return true
        } catch (error) {
          console.error('Errore apertura Training Sheet:', error)
          if (draftState) draftState.textContent = error?.message || 'Impossibile aprire la Training Sheet'
          return false
        } finally {
          if (openSheetButton) openSheetButton.disabled = !openSheetSelect?.value
        }
      }

      openSheetSelect?.addEventListener('change', () => {
        if (openSheetButton) openSheetButton.disabled = !openSheetSelect.value
      })
      openSheetButton?.addEventListener('click', () => loadTrainingSheetByEventId(openSheetSelect?.value))

      manualEditor.querySelectorAll('[data-print-sheet]').forEach((button) => button.addEventListener('click', createAndPublishPdf))
      showTsStep(1)
      restore()

      const pendingOpenEventId = localStorage.getItem('nz-training-sheet-open-event-id')
      if (pendingOpenEventId && appState.calendarEvents.some((item) => String(item.id) === String(pendingOpenEventId))) {
        loadTrainingSheetByEventId(pendingOpenEventId)
      }
      const nextProgressive = determineNextProgressive()
      if (form.elements.progressive && Number(form.elements.progressive.value || 0) < nextProgressive) {
        form.elements.progressive.value = String(nextProgressive)
      }
      updateCounts();updatePreview()
    }

    root
      .querySelectorAll('[data-open-event]')
      .forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          openDrawer(button.dataset.openEvent)
        })
      })

    root.querySelector('[data-import-season-calendar]')?.addEventListener('click', (event) => {
      event.preventDefault()
      openSeasonCalendarImport()
    })

    root.querySelector('[data-manage-calendar-events]')?.addEventListener('click', (event) => {
      event.preventDefault()
      openCalendarBulkManagement()
    })

    root
      .querySelectorAll('[data-new-event]')
      .forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          openNewEventModal()
        })
      })

    root
      .querySelectorAll('[data-create-event-date]')
      .forEach((cell) => {
        cell.addEventListener('click', () => {
          openNewEventModal(cell.dataset.createEventDate)
        })
      })


    root.querySelector('[data-calendar-prev]')?.addEventListener('click', () => {
      appState.currentCalendarDate = new Date(
        appState.currentCalendarDate.getFullYear(),
        appState.currentCalendarDate.getMonth() - 1,
        1,
      )
      root.innerHTML = calendarView()
      bindDynamic()
    })

    root.querySelector('[data-calendar-next]')?.addEventListener('click', () => {
      appState.currentCalendarDate = new Date(
        appState.currentCalendarDate.getFullYear(),
        appState.currentCalendarDate.getMonth() + 1,
        1,
      )
      root.innerHTML = calendarView()
      bindDynamic()
    })

    root.querySelector('[data-calendar-today]')?.addEventListener('click', () => {
      goToCurrentMonth()
      root.innerHTML = calendarView()
      bindDynamic()
      const todayCell = root.querySelector('.calendar-cell.is-today')
      todayCell?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })

    root.querySelector('[data-profile-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const formData = new FormData(form)
      const firstName = formData.get('first_name')?.toString().trim() ?? ''
      const lastName = formData.get('last_name')?.toString().trim() ?? ''
      const message = form.querySelector('[data-profile-message]')
      if (!firstName || !lastName) return

      const fullName = `${firstName} ${lastName}`.trim()
      const { error: profileError } = await supabase.rpc('update_my_profile', {
        p_first_name: firstName,
        p_last_name: lastName,
      })

      if (profileError) {
        message.textContent = profileError.message
        message.className = 'form-message is-error'
        return
      }

      const { data, error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (authError) {
        message.textContent = authError.message
        message.className = 'form-message is-error'
        return
      }

      appState.currentUser = data.user
      appState.currentUserProfile = { ...appState.currentUserProfile, first_name: firstName, last_name: lastName }
      syncProfileHeader()
      message.textContent = 'Profilo aggiornato.'
      message.className = 'form-message is-success'
    })

    root.querySelector('[data-open-staff]')?.addEventListener('click', async () => {
      await setView('staff', 'Gestione Staff')
    })

    root.querySelector('[data-open-profile]')?.addEventListener('click', async () => {
      await setView('profile', 'Profilo')
    })

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
        localStorage.setItem(`staff-match-analysis-v1:${matchId}`, JSON.stringify(payload))
        if (state) state.textContent = 'Analisi salvata'
        return payload
      }
      lifecycleAnalysis.querySelector('[data-save-match-analysis]')?.addEventListener('click', saveAnalysis)
      lifecycleAnalysis.addEventListener('input', () => { if (state) state.textContent = 'Modifiche non salvate' })
      lifecycleAnalysis.querySelector('[data-generate-match-report]')?.addEventListener('click', async (event) => {
        const button = event.currentTarget
        const analysis = saveAnalysis() || collectAnalysis()
        const draftService = createMatchDraftService({ storage: localStorage, storageKey: matchId ? `nz-match-sheet-editor-v2:${matchId}` : undefined })
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
        const wrapper = document.createElement('div')
        wrapper.innerHTML = renderer.renderPaper(model)
        const paper = wrapper.firstElementChild
        if (!paper) return
        document.querySelector('[data-match-report-dialog]')?.remove()
        const dialog = document.createElement('div')
        dialog.className = 'match-report-dialog'
        dialog.dataset.matchReportDialog = ''
        dialog.innerHTML = `<section class="match-report-dialog-panel" role="dialog" aria-modal="true" aria-label="Anteprima Match Report"><header><div><span>ANTEPRIMA DI STAMPA</span><h2>Match Report</h2></div><button type="button" data-close-match-report aria-label="Chiudi">×</button></header><div class="match-report-dialog-body">${paper.outerHTML}</div><footer><span>${validation.valid ? 'Report pronto' : `Da completare: ${escapeHtml(validation.errors.join(' · '))}`}</span><button type="button" class="secondary-button" data-close-match-report>Annulla</button><button type="button" class="primary-button" data-confirm-match-report>Stampa / salva PDF</button></footer></section>`
        document.body.appendChild(dialog)
        document.body.classList.add('modal-open')
        const close = () => { dialog.remove(); document.body.classList.remove('modal-open') }
        dialog.querySelectorAll('[data-close-match-report]').forEach((item) => item.addEventListener('click', close))
        dialog.querySelector('[data-confirm-match-report]')?.addEventListener('click', async () => {
          button.disabled = true
          try {
            const calendarService = createMatchCalendarService({ createEvent: createCalendarEvent, updateEvent: updateCalendarEvent, reloadEvents: loadCalendarEvents })
            await calendarService.publish({ matchData: mergedData, activeMatch, calendarEvents: appState.calendarEvents })
            localStorage.setItem(`staff-match-report-v1:${matchId}`, JSON.stringify({ generatedAt: new Date().toISOString() }))
            printMatchReport(dialog.querySelector('.match-report-paper'))
            if (state) state.textContent = 'Analisi salvata · Report generato'
          } catch (error) {
            console.error('Generazione Match Report non riuscita:', error)
            if (state) state.textContent = error.message || 'Generazione report non riuscita'
          } finally {
            button.disabled = false
          }
        })
      })
    }
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
        localStorage.setItem('nz-active-section', target[0])
        await setView(target[0], target[1])
      })
    })

    root.querySelectorAll('[data-return-to-match-workspace]').forEach((button) => {
      button.addEventListener('click', async () => {
        setActiveNavigation('match-library')
        localStorage.setItem('nz-active-section', 'match-workspace')
        await setView('match-workspace', 'Match Workspace')
      })
    })

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
        message.textContent = error.message || 'Importazione non riuscita.'
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

    const createStaffPanel = root.querySelector('[data-create-staff-form]')
    const toggleCreateStaff = (open) => {
      if (!createStaffPanel) return
      createStaffPanel.hidden = !open
      root.querySelector('[data-toggle-create-staff]')?.setAttribute('aria-expanded', String(open))
      if (open) createStaffPanel.querySelector('input[name="first_name"]')?.focus()
    }

    root.querySelector('[data-toggle-create-staff]')?.addEventListener('click', () => {
      if (!can(ACCESS_CAPABILITIES.STAFF_CREATE)) { showAccessNotice(); return }
      toggleCreateStaff(createStaffPanel?.hidden !== false)
    })
    root.querySelector('[data-close-create-staff]')?.addEventListener('click', () => toggleCreateStaff(false))
    root.querySelector('[data-cancel-create-staff]')?.addEventListener('click', () => {
      createStaffPanel?.reset()
      toggleCreateStaff(false)
    })
    root.querySelector('[data-generate-staff-password]')?.addEventListener('click', () => {
      const input = createStaffPanel?.querySelector('input[name="password"]')
      if (input) {
        input.value = generateTemporaryPassword()
        input.focus()
        input.select()
      }
    })
    createStaffPanel?.addEventListener('submit', async (event) => {
      event.preventDefault()
      if (!can(ACCESS_CAPABILITIES.STAFF_CREATE)) { showAccessNotice(); return }
      const form = event.currentTarget
      const message = form.querySelector('[data-create-staff-message]')
      const submit = form.querySelector('button[type="submit"]')
      const data = new FormData(form)
      const teamId = getTeamProfile().id || null
      submit.disabled = true
      message.textContent = 'Creazione account in corso…'
      message.className = 'form-message'
      try {
        const result = await createStaffUser({
          teamId,
          firstName: data.get('first_name')?.toString().trim(),
          lastName: data.get('last_name')?.toString().trim(),
          email: data.get('email')?.toString().trim(),
          password: data.get('password')?.toString(),
          role: data.get('role')?.toString(),
          appRole: data.get('app_role')?.toString(),
        })
        appState.staffFlashMessage = `${result.firstName} ${result.lastName} creato correttamente.`
        form.reset()
        await loadStaffProfiles()
        root.innerHTML = staffManagementView()
        bindDynamic()
      } catch (error) {
        message.textContent = error?.message || 'Creazione utente non riuscita.'
        message.className = 'form-message is-error'
      } finally {
        submit.disabled = false
      }
    })

    root.querySelectorAll('[data-staff-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!can(ACCESS_CAPABILITIES.STAFF_UPDATE)) { showAccessNotice(); return }
        const userId = form.dataset.userId
        const data = new FormData(form)
        const message = form.querySelector('[data-staff-message]')
        const payload = {
          first_name: data.get('first_name')?.toString().trim() ?? '',
          last_name: data.get('last_name')?.toString().trim() ?? '',
          role: data.get('role')?.toString() ?? 'observer',
          app_role: form.dataset.isOwner === 'true' ? 'owner' : (data.get('app_role')?.toString() ?? 'collaborator'),
          active: form.dataset.isOwner === 'true' ? true : data.get('active') === 'on',
          updated_at: new Date().toISOString(),
        }

        try {
          await updateStaffProfile({
            userId,
            firstName: payload.first_name,
            lastName: payload.last_name,
            technicalRole: payload.role,
            accessRole: payload.app_role,
            active: payload.active,
          })
        } catch (error) {
          message.textContent = error?.message || 'Aggiornamento non riuscito.'
          message.className = 'form-message is-error'
          return
        }

        message.textContent = 'Membro aggiornato.'
        message.className = 'form-message is-success'

        if (userId === appState.currentUser.id) {
          appState.currentUserProfile = { ...appState.currentUserProfile, ...payload }
          appState.currentUserRole = payload.role
          setAccessRole(payload.app_role)
          syncProfileHeader()
        }
      })
    })

    root.querySelectorAll('[data-delete-staff-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!can(ACCESS_CAPABILITIES.STAFF_DELETE)) { showAccessNotice(); return }
        const form = button.closest('[data-staff-form]')
        const userId = form?.dataset.userId
        const name = form?.querySelector('[data-staff-message]')?.closest('.staff-member-actions')?.querySelector('.staff-member-name')?.textContent?.trim() || 'questo utente'
        if (!userId) return
        const confirmed = window.confirm(`Eliminare definitivamente ${name}? L’utente perderà subito l’accesso al portale. Questa operazione non può essere annullata.`)
        if (!confirmed) return
        const message = form.querySelector('[data-staff-message]')
        button.disabled = true
        message.textContent = 'Eliminazione account in corso…'
        message.className = 'form-message'
        try {
          await deleteStaffUser({ teamId: getTeamProfile().id || null, userId })
          appState.staffFlashMessage = `${name} eliminato correttamente.`
          await loadStaffProfiles()
          root.innerHTML = staffManagementView()
          bindDynamic()
        } catch (error) {
          message.textContent = error?.message || 'Eliminazione utente non riuscita.'
          message.className = 'form-message is-error'
          button.disabled = false
        }
      })
    })

    root.querySelector('[data-password-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      const password = data.get('password')?.toString() ?? ''
      const confirmation = data.get('password_confirm')?.toString() ?? ''
      const message = form.querySelector('[data-password-message]')
      if (password !== confirmation) { message.textContent = 'Le password non coincidono.'; message.className = 'form-message is-error'; return }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { message.textContent = error.message; message.className = 'form-message is-error'; return }
      form.reset()
      message.textContent = 'Password aggiornata.'
      message.className = 'form-message is-success'
    })


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

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition

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
          tsNarration.dispatchEvent(new Event('input', { bubbles: true }))
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
          window.setTimeout(() => {
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
      const formData = new FormData(tsForm)
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
        setTsSaveState('error', `Salvataggio non riuscito: ${response.error.message}`)
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
      window.clearTimeout(tsAutosaveTimer)
      setTsSaveState('pending', 'Modifiche da sincronizzare…')
      tsAutosaveTimer = window.setTimeout(saveTsDraft, 700)
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
      window.clearTimeout(tsAutosaveTimer)
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

    root.querySelectorAll('[data-player-profile]').forEach((button) => {
      button.addEventListener('click', () => {
        const player = activePlayers().find((item) => rosterPlayerIdentity(item) === button.dataset.playerProfile)
        if (!player || !modalRoot) return
        modalRoot.innerHTML = playerProfileModalHtml(player)
        document.body.classList.add('new-event-modal-open')

        const closeProfile = () => {
          modalRoot.innerHTML = ''
          document.body.classList.remove('new-event-modal-open')
        }

        modalRoot.querySelectorAll('[data-close-player-profile]').forEach((element) => {
          element.addEventListener('click', (event) => {
            if (element.classList.contains('player-profile-backdrop') && event.target !== element) return
            closeProfile()
          })
        })

        modalRoot.querySelector('[data-player-profile-form]')?.addEventListener('submit', async (event) => {
          event.preventDefault()
          const profileForm = event.currentTarget
          const message = profileForm.querySelector('[data-player-profile-message]')
          const values = Object.fromEntries(new FormData(profileForm).entries())
          const numberOrNull = (value) => value === '' ? null : Number(value)
          const payload = {
            full_name: String(values.full_name || '').trim(),
            role: values.role,
            birth_year: values.birth_year || null,
            preferred_foot: values.preferred_foot || null,
            height_cm: numberOrNull(values.height_cm),
            weight_kg: numberOrNull(values.weight_kg),
            phone: values.phone || null,
            email: values.email || null,
            technical_notes: values.technical_notes || null,
            injury_notes: values.injury_notes || null,
            updated_at: new Date().toISOString(),
          }
          try {
            const saved = await savePlayerProfile(player, payload)
            const profileIdentity = rosterPlayerIdentity(player)
            appState.playerProfiles[profileIdentity] = saved
            const legacyProfileKey = rosterPlayerKey(player)
            if (legacyProfileKey && legacyProfileKey !== profileIdentity) {
              appState.playerProfiles[legacyProfileKey] = saved
            }
            message.textContent = 'Scheda salvata correttamente.'
            message.className = 'form-message is-success'
          } catch (error) {
            message.textContent = `Errore: ${error.message}`
            message.className = 'form-message is-error'
          }
        })
      })
    })

    root.querySelector('[data-dashboard-calendar]')?.addEventListener('click', async () => {
      setActiveNavigation('calendar')
      localStorage.setItem('nz-active-section', 'calendar')
      await setView('calendar', 'Calendario')
    })

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
        const hasVisibleSheets = Array.from(week.querySelectorAll('[data-library-sheet]'))
          .some((card) => !card.hidden)
        week.hidden = !hasVisibleSheets
        if ((query || md || feedback) && hasVisibleSheets) week.open = true
      })

      libraryRoot.querySelectorAll('[data-library-month]').forEach((month) => {
        const hasVisibleWeeks = Array.from(month.querySelectorAll('[data-library-week]'))
          .some((week) => !week.hidden)
        month.hidden = !hasVisibleWeeks
        if ((query || md || feedback) && hasVisibleWeeks) month.open = true
      })

      if (libraryNoResults) libraryNoResults.hidden = visibleSheets > 0 || !(query || md || feedback)
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
            message.textContent = error?.message || 'Salvataggio non riuscito.'
            message.className = 'library-feedback-message is-error'
          }
          button.disabled = false
        }
      })
    })
  }

  bindGlobalAccessGuard()

  document
    .querySelectorAll('[data-nav-group-toggle]')
    .forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const group = toggle.closest('[data-nav-group]')
        const expanded = toggle.getAttribute('aria-expanded') !== 'false'
        toggle.setAttribute('aria-expanded', String(!expanded))
        group?.classList.toggle('is-collapsed', expanded)
      })
    })

  document
    .querySelectorAll('.nav-item')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        const sectionKey = button.dataset.section
        const sectionLabel = button.textContent.trim()
        const previousSection = workspaceEngine.getActiveKey()

        try {
          const openedSection = await setView(sectionKey, sectionLabel)
          setActiveNavigation(openedSection)
          localStorage.setItem('nz-active-section', openedSection)
          closeProfileMenu()
          closeMobileMore()
        } catch (error) {
          console.error(`Errore apertura sezione ${sectionKey}:`, error)
          if (previousSection) setActiveNavigation(previousSection)
          showAccessNotice(error?.message || 'Impossibile aprire la sezione richiesta. Riprova.')
        }
      })
    })

  // Gestione robusta del menu profilo: funziona anche su touch/mobile
  // e non dipende dal punto esatto su cui viene premuto il pulsante.
  let profilePointerHandled = false

  const handleProfileMenuPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    profilePointerHandled = true
    toggleProfileMenu()
  }

  const handleProfileMenuClick = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (profilePointerHandled) {
      profilePointerHandled = false
      return
    }

    toggleProfileMenu()
  }

  mobileMoreToggle?.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    closeProfileMenu()
    toggleMobileMore()
  })

  mobileMoreClose?.addEventListener('click', (event) => {
    event.preventDefault()
    closeMobileMore()
  })

  mobileMoreSheet?.addEventListener('click', (event) => {
    event.stopPropagation()
  })

  profileMenuButton?.addEventListener(
    'pointerdown',
    handleProfileMenuPointerDown,
  )
  profileMenuButton?.addEventListener('click', handleProfileMenuClick)

  profileDropdown?.addEventListener('click', (event) => {
    event.stopPropagation()
  })

  document.addEventListener('click', (event) => {
    if (!mobileMoreSheet?.classList.contains('is-open')) return
    if (event.target.closest?.('.mobile-navigation')) return
    closeMobileMore()
  })


  document
    .querySelectorAll('[data-profile-action]')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.profileAction

        if (action === 'profile') {
          setActiveNavigation('')
          setView('profile', 'Profilo')
          closeProfileMenu()
          return
        }

        if (action === 'logout') {
          closeProfileMenu()
        }
      })
    })

  document.addEventListener('click', (event) => {
    const clickedInsideProfileMenu =
      event.target.closest('.profile-menu-wrapper')

    if (!clickedInsideProfileMenu) {
      closeProfileMenu()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProfileMenu()
      closeDrawer()
      closeNewEventModal()
    }
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