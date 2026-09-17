import { createMatchGpsWorkspace } from '../modules/match/matchGpsWorkspace.js'
import { createMatchGpsAnalysisWorkspace } from '../modules/match/matchGpsAnalysisWorkspace.js'
import { wireMatchGpsEvents } from '../modules/match/events/matchGpsEvents.js'
import { wireMatchGpsAnalysisEvents } from '../modules/match/events/matchGpsAnalysisEvents.js'

/**
 * App-level composition owner for the two GPS workspaces.
 * Keeps route lifecycle and event wiring out of the central appController while
 * preserving the domain ownership of each GPS workspace.
 */
export function createAppMatchGpsModules({
  storage,
  getCalendarEvents,
  getTeamProfile,
  getRoster,
  canImport,
  ensureCalendarEvents,
  loadRosterPlayers,
} = {}) {
  const matchGpsWorkspace = createMatchGpsWorkspace({
    storage,
    getCalendarEvents,
    getTeamProfile,
    getRoster,
    canImport,
  })

  const matchGpsAnalysisWorkspace = createMatchGpsAnalysisWorkspace({
    getTeamProfile,
    getRoster,
  })

  return Object.freeze({
    views: Object.freeze({
      'match-gps': () => matchGpsWorkspace.render(),
      'match-gps-analysis': () => matchGpsAnalysisWorkspace.render(),
    }),

    prepare: Object.freeze({
      'match-gps': async () => {
        await Promise.all([ensureCalendarEvents(), loadRosterPlayers()])
        await matchGpsWorkspace.prepare()
      },
      'match-gps-analysis': async () => {
        await loadRosterPlayers()
        await matchGpsAnalysisWorkspace.prepare()
      },
    }),

    bind({ root, setView } = {}) {
      wireMatchGpsEvents({
        root,
        workspace: matchGpsWorkspace,
        setView,
      })
      wireMatchGpsAnalysisEvents({
        root,
        workspace: matchGpsAnalysisWorkspace,
        setView,
      })
    },
  })
}