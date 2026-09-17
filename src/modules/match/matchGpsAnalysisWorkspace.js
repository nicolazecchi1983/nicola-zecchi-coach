import { getDataAccessUserMessage } from '../../infrastructure/dataAccess/dataAccessUserFeedback.js'
import { createMatchGpsAnalysisService } from './matchGpsAnalysisService.js'
import { getMatchGpsMetric, getMatchGpsMetrics } from './matchGpsMetricRegistry.js'
import { renderMatchGpsAnalysisView } from './ui/matchGpsAnalysisView.js'

const DEFAULT_METRIC_KEY = 'distanceKm'

function rosterPlayerId(player = {}) {
  return String(player.id || player.playerId || '').trim()
}

function historyPlayerIds(history = []) {
  const ids = []
  const seen = new Set()

  for (const match of history) {
    for (const row of match.rows || []) {
      const id = String(row?.playerId || '').trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }

  return ids
}

function resolveDefaultPlayerId(history = [], roster = []) {
  const historyIds = new Set(historyPlayerIds(history))

  for (const player of roster) {
    const id = rosterPlayerId(player)
    if (id && historyIds.has(id)) return id
  }

  return historyPlayerIds(history)[0] || ''
}

export function createMatchGpsAnalysisWorkspace({
  getTeamProfile = () => ({}),
  getRoster = () => [],
  service = createMatchGpsAnalysisService(),
} = {}) {
  const state = {
    teamId: null,
    loaded: false,
    history: [],
    error: '',
    scope: 'squad',
    metricKey: DEFAULT_METRIC_KEY,
    normalization: 'actual',
    playerId: '',
  }

  function normalizeSelection() {
    const visibleMetrics = getMatchGpsMetrics({ visible: true })
    const selectedMetric = getMatchGpsMetric(state.metricKey)

    if (!selectedMetric?.visible) {
      state.metricKey = visibleMetrics[0]?.key || ''
    }

    const metric = getMatchGpsMetric(state.metricKey)
    if (!metric?.per90) state.normalization = 'actual'

    const availablePlayerIds = new Set(historyPlayerIds(state.history))
    if (!state.playerId || !availablePlayerIds.has(state.playerId)) {
      state.playerId = resolveDefaultPlayerId(state.history, getRoster())
    }
  }

  async function load({ force = false } = {}) {
    const teamId = String(getTeamProfile()?.id || '').trim()

    if (!teamId) {
      state.teamId = null
      state.loaded = true
      state.history = []
      state.error = 'Identità squadra non disponibile.'
      normalizeSelection()
      return
    }

    if (!force && state.loaded && state.teamId === teamId) {
      normalizeSelection()
      return
    }

    state.teamId = teamId
    state.error = ''

    try {
      state.history = await service.loadHistory({ teamId })
      state.loaded = true
    } catch (error) {
      state.history = []
      state.loaded = true
      state.error = getDataAccessUserMessage(
        error,
        'Analisi GPS non disponibile. Riprova.',
        { stage: 'match-gps-analysis-load' },
      )
    }

    normalizeSelection()
  }

  return Object.freeze({
    prepare: () => load(),
    refresh: () => load({ force: true }),
    setScope(value) {
      state.scope = value === 'player' ? 'player' : 'squad'
      normalizeSelection()
    },
    setMetric(value) {
      const metric = getMatchGpsMetric(value)
      if (metric?.visible) state.metricKey = metric.key
      normalizeSelection()
    },
    setNormalization(value) {
      const metric = getMatchGpsMetric(state.metricKey)
      state.normalization = value === 'per90' && metric?.per90
        ? 'per90'
        : 'actual'
    },
    setPlayer(value) {
      state.playerId = String(value || '').trim()
      normalizeSelection()
    },
    render() {
      normalizeSelection()
      return renderMatchGpsAnalysisView({
        team: getTeamProfile(),
        roster: getRoster(),
        history: state.history,
        error: state.error,
        scope: state.scope,
        metricKey: state.metricKey,
        normalization: state.normalization,
        playerId: state.playerId,
      })
    },
  })
}