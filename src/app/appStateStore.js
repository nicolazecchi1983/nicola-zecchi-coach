/**
 * Application-shell state.
 *
 * This store owns only cross-cutting shell/session state. Feature-specific
 * editor state remains inside its module. Keeping this object stable lets
 * modules receive a single state reference without importing the controller.
 */
function firstDayOfCurrentMonth() {
  const date = new Date()
  date.setDate(1)
  return date
}

export const appState = {
  calendarEvents: [],
  currentUserRole: 'observer',
  currentUser: null,
  currentUserProfile: null,
  staffProfiles: [],
  analysisEntries: [],
  playerProfiles: {},
  players: [],
  rosterPersistence: {},
  teamFacilities: [],
  staffFlashMessage: '',
  currentCalendarDate: firstDayOfCurrentMonth(),
}

export function resetAppSessionState() {
  appState.calendarEvents = []
  appState.currentUserRole = 'observer'
  appState.currentUser = null
  appState.currentUserProfile = null
  appState.staffProfiles = []
  appState.analysisEntries = []
  appState.playerProfiles = {}
  appState.players = []
  appState.rosterPersistence = {}
  appState.teamFacilities = []
  appState.staffFlashMessage = ''
  appState.currentCalendarDate = firstDayOfCurrentMonth()
}
