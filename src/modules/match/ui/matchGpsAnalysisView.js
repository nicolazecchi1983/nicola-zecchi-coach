import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import {
  buildMatchGpsPlayerMetricSeries,
  buildMatchGpsSquadMetricSeries,
} from '../matchGpsAnalysisModel.js'
import {
  getMatchGpsMetric,
  getMatchGpsMetrics,
} from '../matchGpsMetricRegistry.js'

function finiteNumberOrNull(value) {
  if (value == null || String(value).trim() === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function valueText(value, unit = null) {
  const numeric = finiteNumberOrNull(value)
  if (numeric == null) return '—'

  const formatted = numeric.toLocaleString('it-IT', {
    maximumFractionDigits: 2,
  })

  return unit ? `${formatted} ${unit}` : formatted
}

function dateText(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  return match ? `${match[3]}/${match[2]}` : String(value || '—')
}

function playerName(roster = [], row = {}) {
  const player = roster.find(
    (item) => String(item?.id || item?.playerId || '') === String(row?.playerId || ''),
  )

  return String(player?.name || row?.sourcePlayerName || 'Giocatore').trim()
}

function analysisPlayers(history = [], roster = []) {
  const byId = new Map()

  for (const match of history) {
    for (const row of match.rows || []) {
      const id = String(row?.playerId || '').trim()
      if (!id || byId.has(id)) continue
      byId.set(id, {
        id,
        name: playerName(roster, row),
      })
    }
  }

  return [...byId.values()]
    .sort((left, right) => left.name.localeCompare(right.name, 'it'))
}

function metricOptionsHtml(metricKey) {
  return getMatchGpsMetrics({ visible: true })
    .map((metric) => `<option value="${escapeHtml(metric.key)}" ${metric.key === metricKey ? 'selected' : ''}>${escapeHtml(metric.label)}${metric.unit ? ` · ${escapeHtml(metric.unit)}` : ''}</option>`)
    .join('')
}

function playerOptionsHtml(players, playerId) {
  if (!players.length) return '<option value="">Nessun giocatore disponibile</option>'

  return players
    .map((player) => `<option value="${escapeHtml(player.id)}" ${String(player.id) === String(playerId || '') ? 'selected' : ''}>${escapeHtml(player.name)}</option>`)
    .join('')
}

function squadValue(point, metric, normalization) {
  if (normalization === 'per90') {
    return point.per90?.average ?? null
  }

  return metric.aggregation === 'cumulative'
    ? point.actual?.sum ?? null
    : point.actual?.average ?? null
}

function chartSeries({
  history,
  scope,
  metric,
  normalization,
  playerId,
}) {
  if (scope === 'player') {
    return buildMatchGpsPlayerMetricSeries(history, playerId, metric.key)
      .map((point) => ({
        ...point,
        value: normalization === 'per90'
          ? point.per90Value
          : point.actualValue,
        playerCount: null,
        totalMinutes: point.minutesPlayed,
      }))
  }

  return buildMatchGpsSquadMetricSeries(history, metric.key)
    .map((point) => ({
      ...point,
      value: squadValue(point, metric, normalization),
    }))
}

function contiguousSegments(points) {
  const segments = []
  let current = []

  for (const point of points) {
    if (point.value == null) {
      if (current.length) segments.push(current)
      current = []
      continue
    }
    current.push(point)
  }

  if (current.length) segments.push(current)
  return segments
}

function trendChartHtml(series, metric, normalization) {
  const values = series
    .map((point) => finiteNumberOrNull(point.value))
    .filter((value) => value != null)

  if (!values.length) {
    return `<div class="match-gps-analysis-empty-chart">
      <strong>Nessun valore disponibile</strong>
      <p>La metrica selezionata non contiene dati utilizzabili nelle partite GPS caricate.</p>
    </div>`
  }

  const availablePoints = series.filter((point) => finiteNumberOrNull(point.value) != null)
  if (availablePoints.length === 1) {
    const point = availablePoints[0]
    const modeLabel = normalization === 'per90' ? '/90’' : 'Reale'

    return `<div class="match-gps-analysis-single-point" data-match-gps-analysis-single-point>
      <div class="match-gps-analysis-single-point__head">
        <div>
          <span>1 PARTITA DISPONIBILE</span>
          <strong>${escapeHtml(point.opponent || 'Avversario')}</strong>
        </div>
        <span>${escapeHtml(dateText(point.matchDate))}</span>
      </div>
      <div class="match-gps-analysis-single-point__value">
        <span>${escapeHtml(metric.label)}</span>
        <strong>${escapeHtml(valueText(point.value, metric.unit))}</strong>
        <small>${escapeHtml(modeLabel)}</small>
      </div>
      <p>Il dato è disponibile. Il trend cronologico comparirà automaticamente quando saranno presenti almeno 2 partite GPS.</p>
    </div>`
  }

  const width = 920
  const height = 300
  const padding = { top: 28, right: 24, bottom: 58, left: 62 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = maxValue - minValue
  const domainMin = span === 0 ? Math.max(0, minValue * 0.9) : Math.max(0, minValue - span * 0.12)
  const domainMax = span === 0 ? maxValue + Math.max(1, maxValue * 0.1) : maxValue + span * 0.12
  const domainSpan = Math.max(1e-9, domainMax - domainMin)

  const points = series.map((point, index) => {
    const value = finiteNumberOrNull(point.value)
    const x = series.length <= 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth * index) / (series.length - 1)
    const y = value == null
      ? null
      : padding.top + plotHeight - ((value - domainMin) / domainSpan) * plotHeight

    return { ...point, value, x, y }
  })

  const segments = contiguousSegments(points)
  const lineHtml = segments
    .filter((segment) => segment.length >= 2)
    .map((segment) => `<polyline class="match-gps-analysis-chart__line" points="${segment.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}"></polyline>`)
    .join('')

  const pointHtml = points
    .filter((point) => point.value != null)
    .map((point) => `<circle class="match-gps-analysis-chart__point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5"></circle>`)
    .join('')

  const valueHtml = points
    .filter((point) => point.value != null)
    .map((point) => {
      const xPercent = (point.x / width) * 100
      const yPercent = (point.y / height) * 100

      return `<div
        class="match-gps-analysis-chart-value"
        style="left:clamp(34px,${xPercent.toFixed(4)}%,calc(100% - 34px));top:${yPercent.toFixed(4)}%"
      >
        <strong>${escapeHtml(valueText(point.value))}</strong>
        ${metric.unit ? `<span>${escapeHtml(metric.unit)}</span>` : ''}
      </div>`
    })
    .join('')

  const labelHtml = points
    .map((point) => {
      const xPercent = (point.x / width) * 100

      return `<div
        class="match-gps-analysis-chart-label"
        style="left:clamp(44px,${xPercent.toFixed(4)}%,calc(100% - 44px))"
      >
        <strong>${escapeHtml(dateText(point.matchDate))}</strong>
        <span>${escapeHtml(point.opponent || 'Avversario')}</span>
      </div>`
    })
    .join('')

  const modeLabel = normalization === 'per90' ? '/90’' : 'Reale'

  return `<div class="match-gps-analysis-chart-wrap">
    <div class="match-gps-analysis-chart-meta">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(modeLabel)}</strong>
    </div>
    <div
      class="match-gps-analysis-chart-stage"
      style="--match-gps-analysis-count:${Math.max(points.length, 1)}"
    >
      <svg
        class="match-gps-analysis-chart"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Andamento cronologico ${escapeHtml(metric.label)}"
      >
        <line class="match-gps-analysis-chart__axis" x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${width - padding.right}" y2="${padding.top + plotHeight}"></line>
        ${lineHtml}
        ${pointHtml}
      </svg>
      <div class="match-gps-analysis-chart-value-layer" aria-hidden="true">
        ${valueHtml}
      </div>
      <div class="match-gps-analysis-chart-label-layer" aria-hidden="true">
        ${labelHtml}
      </div>
    </div>
  </div>`
}

function summaryHtml(series, metric) {
  const values = series
    .map((point) => finiteNumberOrNull(point.value))
    .filter((value) => value != null)

  const average = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null

  const latest = [...series]
    .reverse()
    .find((point) => finiteNumberOrNull(point.value) != null)?.value ?? null

  return `<section class="match-gps-analysis-kpis" aria-label="Riepilogo analisi">
    <article>
      <span>PARTITE GPS</span>
      <strong>${series.length}</strong>
    </article>
    <article>
      <span>VALORI DISPONIBILI</span>
      <strong>${values.length}</strong>
    </article>
    <article>
      <span>MEDIA</span>
      <strong>${escapeHtml(valueText(average, metric.unit))}</strong>
    </article>
    <article>
      <span>ULTIMO VALORE</span>
      <strong>${escapeHtml(valueText(latest, metric.unit))}</strong>
    </article>
  </section>`
}

function comparisonTableHtml(series, metric, normalization, scope) {
  const modeSuffix = normalization === 'per90' ? ' /90’' : ''

  return `<div class="match-gps-analysis-table-wrap">
    <table class="match-gps-analysis-table">
      <thead>
        <tr>
          <th>Partita</th>
          <th>Data</th>
          <th>Valore</th>
          <th>${scope === 'player' ? 'Minuti' : 'Minuti squadra'}</th>
          ${scope === 'squad' ? '<th>Giocatori</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${series.map((point) => `<tr>
          <td><strong>${escapeHtml(point.opponent || 'Avversario')}</strong>${point.competitionRound ? `<small>${escapeHtml(point.competitionRound)}</small>` : ''}</td>
          <td>${escapeHtml(dateText(point.matchDate))}</td>
          <td>${escapeHtml(valueText(point.value, metric.unit))}${point.value == null ? '' : modeSuffix}</td>
          <td>${point.totalMinutes == null ? '—' : `${escapeHtml(String(point.totalMinutes))}’`}</td>
          ${scope === 'squad' ? `<td>${escapeHtml(String(point.playerCount ?? '—'))}</td>` : ''}
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`
}

function emptyHistoryHtml() {
  return `<section class="match-gps-analysis-empty">
    <strong>Nessuna partita GPS disponibile</strong>
    <p>Importa i dati GPS nelle singole partite: questa area li userà automaticamente per l’analisi longitudinale.</p>
  </section>`
}

export function renderMatchGpsAnalysisView({
  team = {},
  roster = [],
  history = [],
  error = '',
  scope = 'squad',
  metricKey = 'distanceKm',
  normalization = 'actual',
  playerId = '',
} = {}) {
  const metrics = getMatchGpsMetrics({ visible: true })
  const metric = getMatchGpsMetric(metricKey) || metrics[0] || null
  const players = analysisPlayers(history, roster)
  const resolvedScope = scope === 'player' ? 'player' : 'squad'
  const resolvedNormalization = metric?.per90 && normalization === 'per90'
    ? 'per90'
    : 'actual'

  const series = metric
    ? chartSeries({
        history,
        scope: resolvedScope,
        metric,
        normalization: resolvedNormalization,
        playerId,
      })
    : []

  return `<section class="view page-view product-page-shell match-gps-analysis-workspace" data-match-gps-analysis-workspace>
    <header class="page-head product-page-header match-gps-analysis-header">
      <div>
        <span class="match-gps-analysis-eyebrow">GPS · ${escapeHtml(team?.shortName || team?.name || 'Squadra')}</span>
        <h1>Analisi multi-partita</h1>
        <p>Trend cronologici di squadra e giocatore costruiti sui dati GPS già importati nelle singole gare.</p>
      </div>
      <button type="button" class="button button--secondary" data-match-gps-analysis-refresh>Aggiorna dati</button>
    </header>

    ${error ? `<p class="match-gps-analysis-error" role="alert">${escapeHtml(error)}</p>` : ''}

    <section class="match-gps-analysis-controls" aria-label="Filtri analisi GPS">
      <div class="match-gps-analysis-segmented" role="group" aria-label="Ambito analisi">
        <button type="button" class="${resolvedScope === 'squad' ? 'is-active' : ''}" data-match-gps-analysis-scope="squad">Squadra</button>
        <button type="button" class="${resolvedScope === 'player' ? 'is-active' : ''}" data-match-gps-analysis-scope="player">Giocatore</button>
      </div>

      <label>
        <span>Metrica</span>
        <select id="match-gps-analysis-metric" name="match-gps-analysis-metric" data-match-gps-analysis-metric>
          ${metricOptionsHtml(metric?.key)}
        </select>
      </label>

      ${resolvedScope === 'player' ? `<label>
        <span>Giocatore</span>
        <select id="match-gps-analysis-player" name="match-gps-analysis-player" data-match-gps-analysis-player>
          ${playerOptionsHtml(players, playerId)}
        </select>
      </label>` : ''}

      ${metric?.per90 ? `<div class="match-gps-analysis-segmented" role="group" aria-label="Normalizzazione metrica">
        <button type="button" class="${resolvedNormalization === 'actual' ? 'is-active' : ''}" data-match-gps-analysis-normalization="actual">Totale</button>
        <button type="button" class="${resolvedNormalization === 'per90' ? 'is-active' : ''}" data-match-gps-analysis-normalization="per90">/90’</button>
      </div>` : `<div class="match-gps-analysis-mode-note">
        <span>Vista</span>
        <strong>Valore reale</strong>
      </div>`}
    </section>

    ${history.length && metric
      ? `${summaryHtml(series, metric)}
         <section class="match-gps-analysis-surface">
           <header>
             <div>
               <span>ANDAMENTO CRONOLOGICO</span>
               <h2>${resolvedScope === 'player' ? 'Trend giocatore' : 'Trend squadra'}</h2>
             </div>
           </header>
           ${trendChartHtml(series, metric, resolvedNormalization)}
           ${comparisonTableHtml(series, metric, resolvedNormalization, resolvedScope)}
         </section>`
      : emptyHistoryHtml()}
  </section>`
}