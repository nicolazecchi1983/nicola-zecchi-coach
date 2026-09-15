import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import { MATCH_GPS_METRIC_COLUMNS, summarizeMatchGpsRows, validateMatchGpsRows } from '../matchGpsModel.js'
import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'
const MATCH_GPS_TABLE_ORDER = Object.freeze([
  'distanceKm',
  'distanceMaxSpeedKm',
  'accelerationCount',
  'decelerationCount',
  'averageSpeed',
  'maxSpeedMs',
  'accelerationMs2',
])

const MATCH_GPS_VISIBLE_COLUMNS = MATCH_GPS_TABLE_ORDER
  .map((key) => MATCH_GPS_METRIC_COLUMNS.find((column) => column.key === key))
  .filter(Boolean)

const MATCH_GPS_PER_90_KEYS = new Set([
  'distanceKm',
  'distanceMaxSpeedKm',
  'accelerationCount',
  'decelerationCount',
])

function readPlayerName(roster, playerId, fallback = '') {
  return roster.find((player) => String(player?.id || '') === String(playerId || ''))?.name || fallback || 'Giocatore'
}

function valueText(value, unit = null) {
  if (value == null || value === '') return '—'
  const numeric = Number(value)
  const text = Number.isFinite(numeric)
    ? numeric.toLocaleString('it-IT', { maximumFractionDigits: 2 })
    : String(value)
  return unit ? `${text} ${unit}` : text
}

function minutesText(value) {
  if (value == null || String(value).trim() === '') return '—'
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? `${numeric}'` : '—'
}

function per90Value(value, minutesPlayed) {
  if (
    value == null ||
    String(value).trim() === '' ||
    minutesPlayed == null ||
    String(minutesPlayed).trim() === ''
  ) return null

  const numeric = Number(value)
  const minutes = Number(minutesPlayed)

  if (!Number.isFinite(numeric) || !Number.isFinite(minutes) || minutes <= 0) return null

  return (numeric / minutes) * 90
}

function metricCellHtml(row, column) {
  const raw = row.metrics?.[column.key]
  const primary = escapeHtml(valueText(raw, column.unit))

  if (!MATCH_GPS_PER_90_KEYS.has(column.key)) {
    return `<span class="match-gps-metric-primary">${primary}</span>`
  }

  const normalized = per90Value(raw, row.minutesPlayed)
  const normalizedText = normalized == null
    ? '—'
    : escapeHtml(valueText(normalized))

  return `<span class="match-gps-metric-primary">${primary}</span>
    <small
      class="match-gps-metric-normalized"
      data-match-gps-normalized="${escapeHtml(column.key)}"
    >${normalizedText} /90&#39;</small>`
}
function normalizedIdentityTokens(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join('|')
}

function samePlayerName(left, right) {
  const a = normalizedIdentityTokens(left)
  const b = normalizedIdentityTokens(right)
  return Boolean(a && b && a === b)
}

function birthDateText(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || '')
}

function sourceDetailHtml(row, canonicalName) {
  const details = []
  const birthDate = birthDateText(row?.sourceBirthDate)
  if (birthDate) details.push(escapeHtml(birthDate))

  const sourceName = String(row?.sourcePlayerName || '').trim()
  if (sourceName && canonicalName && !samePlayerName(sourceName, canonicalName)) {
    details.push(`Excel: ${escapeHtml(sourceName)}`)
  }

  return details.length
    ? `<small class="match-gps-player-meta">${details.join(' · ')}</small>`
    : ''
}

function playerOptions(roster, selectedId) {
  const options = [...roster]
    .filter((player) => player?.id)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'it'))
    .map((player) => `<option value="${escapeHtml(player.id)}" ${String(player.id) === String(selectedId || '') ? 'selected' : ''}>${escapeHtml(player.name)}${player.year ? ` · ${escapeHtml(player.year)}` : ''}</option>`)

  return `<option value="">Da associare…</option>${options.join('')}`
}

function associationHtml(row, roster, canImport) {
  const select = `<select
    name="match-gps-player-${row.sourceRow}"
    data-match-gps-player-map
    data-source-row="${row.sourceRow}"
    ${canImport ? '' : 'disabled'}
    aria-label="Associa ${escapeHtml(row.sourcePlayerName)}"
  >${playerOptions(roster, row.playerId)}</select>`

  if (!row.playerId) {
    return `<div class="match-gps-association match-gps-association--required">${select}</div>`
  }

  return `<details class="match-gps-association match-gps-association--resolved">
    <summary><span>Associato</span><small>Cambia</small></summary>
    <div class="match-gps-association__editor">${select}</div>
  </details>`
}

function previewHtml(preview, roster, canImport) {
  if (!preview) return ''

  const summary = summarizeMatchGpsRows(preview.rows)
  const validation = validateMatchGpsRows(preview.rows, roster)
  const included = preview.rows.filter((row) => row.included)

  return `<section class="match-gps-panel" data-match-gps-preview>
    <header class="match-gps-panel__head">
      <div>
        <span>ANTEPRIMA IMPORT</span>
        <h2>${escapeHtml(preview.source.fileName)}</h2>
        <p>${escapeHtml(preview.source.sheetName)} · intestazioni riga ${preview.source.headerRow}</p>
      </div>
    </header>

    <div class="match-gps-summary" aria-label="Riepilogo anteprima">
      <div><strong>${summary.includedRows}</strong><span>righe GPS</span></div>
      <div><strong>${summary.matchedRows}</strong><span>associate</span></div>
      <div class="${summary.reviewRows ? 'is-warning' : ''}"><strong>${summary.reviewRows}</strong><span>da verificare</span></div>
      <div><strong>${summary.excludedRows}</strong><span>solo anagrafica</span></div>
    </div>

    <p class="match-gps-notice">Le righe con il solo CARDIO RIP. restano fuori dall’import: non vengono interpretate come assenze o mancato impiego.</p>

    <div class="match-gps-table-wrap">
      <table class="match-gps-table match-gps-table--preview">
        <thead>
          <tr>
            <th class="match-gps-player-column">Giocatore</th>
            <th>Associazione Rosa</th>
            <th class="match-gps-metric-column">VEL MAX</th>
            <th class="match-gps-metric-column">KM</th>
            <th class="match-gps-status-column">Stato</th>
          </tr>
        </thead>
        <tbody>
          ${included.map((row) => {
            const canonicalName = readPlayerName(roster, row.playerId, row.sourcePlayerName)
            const needsReview = row.invalidFields?.length || !row.playerId

            return `<tr class="${needsReview ? 'needs-review' : ''}">
              <td class="match-gps-player-column">
                <strong>${escapeHtml(canonicalName)}</strong>
                ${sourceDetailHtml(row, canonicalName)}
              </td>
              <td>${associationHtml(row, roster, canImport)}</td>
              <td class="match-gps-metric-cell">${escapeHtml(valueText(row.metrics.maxSpeedMs, 'm/s'))}</td>
              <td class="match-gps-metric-cell">${escapeHtml(valueText(row.metrics.distanceKm, 'km'))}</td>
              <td class="match-gps-status-cell">
                <span class="match-gps-status ${needsReview ? 'is-warning' : 'is-ready'}">
                  ${row.invalidFields?.length ? 'Valori non validi' : row.playerId ? 'Pronto' : 'Da associare'}
                </span>
              </td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>

    ${validation.errors.length ? `<p class="match-gps-validation" role="status">${escapeHtml(validation.errors[0])}</p>` : ''}

    ${canImport ? `<div class="match-gps-actions">
      <button type="button" class="button button--secondary" data-match-gps-clear>Annulla anteprima</button>
      <button type="button" class="button button--primary" data-match-gps-save ${validation.valid ? '' : 'disabled'}>Conferma importazione</button>
    </div>` : ''}
  </section>`
}

function comparisonRowsHtml(saved, roster, column, { normalized = false } = {}) {
  const rows = saved.rows
    .map((row) => {
      const raw = row.metrics?.[column.key]
      if (raw == null || raw === '') return null

      const total = Number(raw)
      if (!Number.isFinite(total)) return null

      const value = normalized
        ? per90Value(total, row.minutesPlayed)
        : total

      if (value == null || !Number.isFinite(value)) return null

      return {
        name: readPlayerName(roster, row.playerId, row.sourcePlayerName),
        value,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'it'))

  if (!rows.length) {
    return `<p class="match-gps-chart-empty">Nessun valore disponibile per questa metrica.</p>`
  }

  const max = Math.max(0, ...rows.map((row) => row.value))

  return `<div class="match-gps-chart" role="list">
    ${rows.map((row, index) => {
      const percentage = max > 0
        ? Math.max(0, Math.min(100, (row.value / max) * 100))
        : 0

      const suffix = normalized ? ` /90&#39;` : ''

      const rankClass = index < 3 ? ` is-top-${index + 1}` : ''

      return `<div class="match-gps-chart__row${rankClass}" role="listitem">
        <span class="match-gps-chart__rank" aria-label="Posizione ${index + 1}">${index + 1}</span>
        <span class="match-gps-chart__player">${escapeHtml(row.name)}</span>
        <div class="match-gps-chart__track" aria-hidden="true">
          <span class="match-gps-chart__bar" style="--match-gps-bar:${percentage.toFixed(2)}%"></span>
        </div>
        <strong class="match-gps-chart__value">${escapeHtml(valueText(row.value, column.unit))}${suffix}</strong>
      </div>`
    }).join('')}
  </div>`
}

function comparisonModeHtml(saved, roster, column) {
  if (!MATCH_GPS_PER_90_KEYS.has(column.key)) {
    return comparisonRowsHtml(saved, roster, column)
  }

  const totalId = `match-gps-${column.key}-total`
  const normalizedId = `match-gps-${column.key}-90`

  return `<div class="match-gps-chart-mode" data-match-gps-chart-mode="${escapeHtml(column.key)}">
    <input
      class="match-gps-chart-mode__input"
      type="radio"
      id="${escapeHtml(totalId)}"
      name="match-gps-${escapeHtml(column.key)}-mode"
      data-mode="total"
      checked
    >
    <label class="match-gps-chart-mode__label" for="${escapeHtml(totalId)}">Totale</label>

    <input
      class="match-gps-chart-mode__input"
      type="radio"
      id="${escapeHtml(normalizedId)}"
      name="match-gps-${escapeHtml(column.key)}-mode"
      data-mode="normalized"
    >
    <label class="match-gps-chart-mode__label" for="${escapeHtml(normalizedId)}">/90&#39;</label>

    <div class="match-gps-chart-mode__panel match-gps-chart-mode__panel--total">
      ${comparisonRowsHtml(saved, roster, column)}
    </div>

    <div
      class="match-gps-chart-mode__panel match-gps-chart-mode__panel--normalized"
      data-match-gps-normalized="${escapeHtml(column.key)}"
    >
      ${comparisonRowsHtml(saved, roster, column, { normalized: true })}
    </div>
  </div>`
}

function analysisHtml(saved, roster) {
  return `<section class="match-gps-analysis" data-match-gps-analysis>
    <header class="match-gps-analysis__head">
      <div>
        <span>ANALISI COMPARATIVA</span>
        <h2>Confronto giocatori</h2>
        <p>Apri una metrica per confrontare rapidamente tutti i giocatori della partita.</p>
      </div>
    </header>

    <div class="match-gps-analysis__grid">
      ${MATCH_GPS_VISIBLE_COLUMNS.map((column) => `<details class="match-gps-chart-card" data-match-gps-chart="${escapeHtml(column.key)}">
        <summary>
          <span>${escapeHtml(column.label)}</span>
        </summary>
        <div class="match-gps-chart-card__body">
          ${comparisonModeHtml(saved, roster, column)}
        </div>
      </details>`).join('')}
    </div>
  </section>`
}

function savedHtml(saved, roster) {
  if (!saved) {
    return `<section class="match-gps-empty">
      <strong>Nessun dato GPS importato</strong>
      <p>Carica il foglio Excel prodotto dal sistema GPS per questa partita.</p>
    </section>`
  }

  const importedAt = saved.importedAt
    ? new Date(saved.importedAt).toLocaleString('it-IT')
    : 'data non disponibile'

  return `<section class="match-gps-panel" data-match-gps-saved>
    <header class="match-gps-panel__head">
      <div>
        <span>DATI SALVATI</span>
        <h2>${escapeHtml(saved.sourceFileName)}</h2>
        <p>${escapeHtml(saved.sourceSheetName)} · ${escapeHtml(importedAt)} · ${saved.rows.length} giocatori</p>
      </div>
    </header>

    <div class="match-gps-table-wrap match-gps-table-wrap--metrics">
      <table class="match-gps-table match-gps-table--metrics">
        <thead>
          <tr>
            <th class="match-gps-player-column">Giocatore</th>
            <th class="match-gps-minutes-column">MIN</th>
            ${MATCH_GPS_VISIBLE_COLUMNS.map((column) => `<th class="match-gps-metric-column">${escapeHtml(column.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${saved.rows.map((row) => {
            const canonicalName = readPlayerName(roster, row.playerId, row.sourcePlayerName)

            return `<tr>
              <td class="match-gps-player-column">
                <strong>${escapeHtml(canonicalName)}</strong>
                ${sourceDetailHtml(row, canonicalName)}
              </td>
              <td class="match-gps-minutes-column">${minutesText(row.minutesPlayed)}</td>
              ${MATCH_GPS_VISIBLE_COLUMNS.map((column) => `<td class="match-gps-metric-cell match-gps-metric-cell--stack">${metricCellHtml(row, column)}</td>`).join('')}
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>
  ${analysisHtml(saved, roster)}`
}

export function renderMatchGpsView({
  match,
  team,
  roster = [],
  saved = null,
  preview = null,
  error = '',
  canImport = false,
} = {}) {
  if (!match?.id) {
    return '<section class="content-section"><div class="empty-state"><h1>Nessuna partita selezionata</h1><p>Apri una partita dalla Match Library.</p></div></section>'
  }

  const uploadHtml = canImport ? `<section class="match-gps-import" data-match-gps-import>
    <div>
      <span>EXCEL GPS</span>
      <h2>${saved ? 'Sostituisci dati partita' : 'Importa dati partita'}</h2>
      <p>Formato supportato: .xlsx, massimo 5 MB. Prima del salvataggio puoi verificare ogni associazione con la Rosa.</p>
    </div>
    <label class="button button--primary match-gps-file-button">
      Scegli file Excel
      <input type="file" name="match-gps-workbook" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-match-gps-file>
    </label>
  </section>` : ''

  const content = `<section class="match-gps" data-match-gps-workspace>
    ${error ? `<p class="match-gps-error" role="alert">${escapeHtml(error)}</p>` : ''}
    ${uploadHtml}
    ${previewHtml(preview, roster, canImport)}
    ${preview ? '' : savedHtml(saved, roster)}
  </section>`

  return matchWorkspaceShellHtml({
    activeSection: 'match-gps',
    teamName: team?.name || '',
    opponentName: match.opponent || 'Avversario',
    workspaceTitleHtml: 'GPS',
    contentHtml: content,
    className: 'match-gps-workspace',
    attributes: { 'data-match-gps-shell': true },
  })
}