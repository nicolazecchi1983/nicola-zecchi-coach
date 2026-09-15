import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import { MATCH_GPS_METRIC_COLUMNS, summarizeMatchGpsRows, validateMatchGpsRows } from '../matchGpsModel.js'
import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

function readPlayerName(roster, playerId, fallback = '') {
  return roster.find((player) => String(player?.id || '') === String(playerId || ''))?.name || fallback || 'Giocatore'
}

function valueText(value, unit = null) {
  if (value == null || value === '') return '—'
  const numeric = Number(value)
  const text = Number.isFinite(numeric) ? numeric.toLocaleString('it-IT', { maximumFractionDigits: 2 }) : String(value)
  return unit ? `${text} ${unit}` : text
}

function playerOptions(roster, selectedId) {
  const options = [...roster]
    .filter((player) => player?.id)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'it'))
    .map((player) => `<option value="${escapeHtml(player.id)}" ${String(player.id) === String(selectedId || '') ? 'selected' : ''}>${escapeHtml(player.name)}${player.year ? ` · ${escapeHtml(player.year)}` : ''}</option>`)
  return `<option value="">Da associare…</option>${options.join('')}`
}

function previewHtml(preview, roster, canImport) {
  if (!preview) return ''
  const summary = summarizeMatchGpsRows(preview.rows)
  const validation = validateMatchGpsRows(preview.rows, roster)
  const included = preview.rows.filter((row) => row.included)
  return `<section class="match-gps-panel" data-match-gps-preview>
    <header class="match-gps-panel__head"><div><span>ANTEPRIMA IMPORT</span><h2>${escapeHtml(preview.source.fileName)}</h2><p>${escapeHtml(preview.source.sheetName)} · intestazioni riga ${preview.source.headerRow}</p></div></header>
    <div class="match-gps-summary" aria-label="Riepilogo anteprima">
      <div><strong>${summary.includedRows}</strong><span>righe GPS</span></div>
      <div><strong>${summary.matchedRows}</strong><span>associate</span></div>
      <div class="${summary.reviewRows ? 'is-warning' : ''}"><strong>${summary.reviewRows}</strong><span>da verificare</span></div>
      <div><strong>${summary.excludedRows}</strong><span>solo anagrafica</span></div>
    </div>
    <p class="match-gps-notice">Le righe con il solo CARDIO RIP. restano fuori dall’import: non vengono interpretate come assenze o mancato impiego.</p>
    <div class="match-gps-table-wrap"><table class="match-gps-table">
      <thead><tr><th>Riga Excel</th><th>Giocatore sorgente</th><th>Associazione Rosa</th><th>VEL MAX</th><th>KM</th><th>Stato</th></tr></thead>
      <tbody>${included.map((row) => `<tr class="${row.invalidFields?.length || !row.playerId ? 'needs-review' : ''}">
        <td>${row.sourceRow}</td><td><strong>${escapeHtml(row.sourcePlayerName)}</strong><small>${escapeHtml(row.sourceBirthDate || 'Data non disponibile')}</small></td>
        <td><select name="match-gps-player-${row.sourceRow}" data-match-gps-player-map data-source-row="${row.sourceRow}" ${canImport ? '' : 'disabled'} aria-label="Associa ${escapeHtml(row.sourcePlayerName)}">${playerOptions(roster, row.playerId)}</select></td>
        <td>${valueText(row.metrics.maxSpeedMs, 'm/s')}</td><td>${valueText(row.metrics.distanceKm, 'km')}</td>
        <td><span class="match-gps-status ${row.invalidFields?.length || !row.playerId ? 'is-warning' : 'is-ready'}">${row.invalidFields?.length ? 'Valori non validi' : row.playerId ? 'Pronto' : 'Da associare'}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>
    ${validation.errors.length ? `<p class="match-gps-validation" role="status">${escapeHtml(validation.errors[0])}</p>` : ''}
    ${canImport ? `<div class="match-gps-actions"><button type="button" class="button button--secondary" data-match-gps-clear>Annulla anteprima</button><button type="button" class="button button--primary" data-match-gps-save ${validation.valid ? '' : 'disabled'}>Conferma importazione</button></div>` : ''}
  </section>`
}

function savedHtml(saved, roster) {
  if (!saved) return `<section class="match-gps-empty"><strong>Nessun dato GPS importato</strong><p>Carica il foglio Excel prodotto dal sistema GPS per questa partita.</p></section>`
  const importedAt = saved.importedAt ? new Date(saved.importedAt).toLocaleString('it-IT') : 'data non disponibile'
  return `<section class="match-gps-panel" data-match-gps-saved>
    <header class="match-gps-panel__head"><div><span>DATI SALVATI</span><h2>${escapeHtml(saved.sourceFileName)}</h2><p>${escapeHtml(saved.sourceSheetName)} · ${escapeHtml(importedAt)} · ${saved.rows.length} giocatori</p></div></header>
    <div class="match-gps-table-wrap"><table class="match-gps-table match-gps-table--metrics">
      <thead><tr><th>Giocatore</th>${MATCH_GPS_METRIC_COLUMNS.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
      <tbody>${saved.rows.map((row) => `<tr><td><strong>${escapeHtml(readPlayerName(roster, row.playerId, row.sourcePlayerName))}</strong><small>${escapeHtml(row.sourcePlayerName)}</small></td>${MATCH_GPS_METRIC_COLUMNS.map((column) => `<td>${escapeHtml(valueText(row.metrics[column.key], column.unit))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
  </section>`
}

export function renderMatchGpsView({ match, team, roster = [], saved = null, preview = null, error = '', canImport = false } = {}) {
  if (!match?.id) return '<section class="content-section"><div class="empty-state"><h1>Nessuna partita selezionata</h1><p>Apri una partita dalla Match Library.</p></div></section>'
  const uploadHtml = canImport ? `<section class="match-gps-import" data-match-gps-import>
    <div><span>EXCEL GPS</span><h2>${saved ? 'Sostituisci dati partita' : 'Importa dati partita'}</h2><p>Formato supportato: .xlsx, massimo 5 MB. Prima del salvataggio puoi verificare ogni associazione con la Rosa.</p></div>
    <label class="button button--primary match-gps-file-button">Scegli file Excel<input type="file" name="match-gps-workbook" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-match-gps-file></label>
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
