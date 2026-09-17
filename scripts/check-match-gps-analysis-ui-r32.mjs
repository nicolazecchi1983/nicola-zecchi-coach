import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')

const controller = read('src/app/appController.js')
const appGpsModules = read('src/app/appMatchGpsModules.js')
const navigation = read('src/app/appNavigation.js')
const restore = read('src/app/appSessionRestore.js')
const matchContextStart = restore.indexOf('MATCH_CONTEXT_SECTIONS')
const matchContextEnd = matchContextStart >= 0 ? restore.indexOf('])', matchContextStart) : -1
const matchContextSectionsBlock = matchContextStart >= 0 && matchContextEnd >= 0
  ? restore.slice(matchContextStart, matchContextEnd + 2)
  : ''
const access = read('src/core/accessControl.js')
const workspace = read('src/modules/match/matchGpsAnalysisWorkspace.js')
const view = read('src/modules/match/ui/matchGpsAnalysisView.js')
const events = read('src/modules/match/events/matchGpsAnalysisEvents.js')
const main = read('src/main.js')

const checks = [
  [
    'multi-match GPS analysis is a top-level Match navigation route',
    navigation.includes("['match-gps-analysis', 'Analisi GPS'") &&
      navigation.includes("label: 'Match'"),
  ],
  [
    'analysis route reuses MATCH_GPS_VIEW capability',
    access.includes("'match-gps-analysis': ACCESS_CAPABILITIES.MATCH_GPS_VIEW"),
  ],
  [
    'analysis route is restorable without becoming selected-match context',
    restore.includes("'match-gps-analysis': 'Analisi GPS'") &&
      !matchContextSectionsBlock.includes("'match-gps-analysis'"),
  ],
  [
    'app GPS module owns analysis workspace lifecycle outside the composition root',
    controller.includes("import { createAppMatchGpsModules } from './appMatchGpsModules.js'") &&
      controller.includes('...matchGpsModules.views') &&
      controller.includes('...matchGpsModules.prepare') &&
      appGpsModules.includes("'match-gps-analysis': () => matchGpsAnalysisWorkspace.render()") &&
      appGpsModules.includes("'match-gps-analysis': async () =>"),
  ],
  [
    'analysis workspace is independent of staff-active-match storage',
    !workspace.includes('staff-active-match') &&
      !workspace.includes('localStorage'),
  ],
  [
    'analysis workspace reads through the R32.1 analysis service',
    workspace.includes('createMatchGpsAnalysisService') &&
      workspace.includes('service.loadHistory({ teamId })'),
  ],
  [
    'analysis UI metric selection is Metric Registry driven',
    view.includes('getMatchGpsMetrics({ visible: true })') &&
      view.includes('getMatchGpsMetric(metricKey)'),
  ],
  [
    'analysis UI uses canonical R32.1 squad and player series',
    view.includes('buildMatchGpsSquadMetricSeries') &&
      view.includes('buildMatchGpsPlayerMetricSeries'),
  ],
  [
    'cumulative metrics expose actual / per90 while intensive remains actual',
    view.includes("metric?.per90") &&
      view.includes("data-match-gps-analysis-normalization=\"per90\"") &&
      view.includes('Valore reale'),
  ],
  [
    'chronological chart and contextual comparison table are present',
    view.includes('match-gps-analysis-chart') &&
      view.includes('Minuti squadra') &&
      view.includes('Giocatori'),
  ],
  [
    'analysis UI event owner only mutates local workspace state or refreshes read data',
    events.includes('workspace.setMetric') &&
      events.includes('workspace.setScope') &&
      events.includes('workspace.setPlayer') &&
      events.includes('workspace.setNormalization') &&
      events.includes('workspace.refresh()') &&
      !events.includes('.save('),
  ],
  [
    'analysis CSS has its own domain owner',
    main.includes("import './modules/match/ui/matchGpsAnalysis.css'"),
  ],
  [
    'R32.2 introduces no database migration',
    !fs.readdirSync('supabase/migrations').some((name) => name.includes('gps_analysis_ui')),
  ],
]

let passed = 0

for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (ok) passed += 1
}

console.log(`\nR32.2 GPS Multi-Match Analysis UI: ${passed}/${checks.length}`)

if (passed !== checks.length) process.exit(1)