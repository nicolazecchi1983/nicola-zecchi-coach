import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'
import { parseMatchAnalysisSchema } from '../matchAnalysisSchema.js'
import { renderMatchAnalysisSchemaEditor } from './matchAnalysisSchemaView.js'
function analysisOutcomeClass(value) {
  const normalized = String(value ?? '').toLocaleLowerCase('it-IT')
  return normalized.includes('positivo') ? 'is-positive' : 'is-improve'
}

export function renderMatchAnalysisView({
  activeMatch,
  savedAnalysis,
  analysisEntries,
  escapeHtml,
  canImport,
  icon,
  teamName = '',
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const matchId = activeMatch?.id ? String(activeMatch.id) : ''
  const value = (key) => escapeHtml(savedAnalysis[key] || '')
  const analysisSchema = parseMatchAnalysisSchema(savedAnalysis.analysis_schema, {
    possession: savedAnalysis.analysis_possession,
    nonPossession: savedAnalysis.analysis_non_possession,
    transitions: savedAnalysis.analysis_transitions,
    setPieces: savedAnalysis.analysis_set_pieces,
  })
  const items = analysisEntries.map((entry) => `
    <article class="match-analysis-row">
      <div class="match-analysis-minute">${entry.minute ? `${escapeHtml(entry.minute)}'` : '—'}</div>
      <div class="match-analysis-content">
        <div class="match-analysis-topline">
          <strong>${escapeHtml(entry.match_name || 'Partita non indicata')}</strong>
          <span class="analysis-outcome ${analysisOutcomeClass(entry.outcome)}">${escapeHtml(entry.outcome || 'Da classificare')}</span>
        </div>
        <p>${escapeHtml(entry.observation || 'Nessuna osservazione')}</p>
        <div class="match-analysis-meta">
          <span>${escapeHtml(entry.observer || 'Osservatore non indicato')}</span>
          <span>${escapeHtml(entry.game_phase || 'Fase non indicata')}</span>
          <span>${entry.match_date ? new Date(entry.match_date).toLocaleDateString('it-IT') : 'Data non indicata'}</span>
        </div>
      </div>
    </article>
  `).join('')

  const contentHtml = `${matchId ? `<form class="match-lifecycle-analysis" data-match-lifecycle-analysis>
        ${renderMatchAnalysisSchemaEditor({
          name: 'analysis_schema',
          schema: analysisSchema,
          title: 'Analisi della gara',
          description: 'Quattro macroaree di partenza, completamente adattabili al tuo metodo e salvabili come template.',
        })}
        <div class="analysis-lifecycle-actions">
          <span class="form-message" data-match-analysis-state>${savedAnalysis.updatedAt ? 'Analisi salvata' : 'Analisi non ancora salvata'}</span>
          <button class="ghost-button" type="button" data-save-match-analysis>Salva analisi</button>
          <button class="primary-action" type="button" data-generate-match-report>Genera Match Report PDF</button>
        </div>
      </form>` : `<div class="analysis-empty-state"><h2>Nessuna partita selezionata</h2><p>Apri una gara dalla Match Library.</p></div>`}
      <details class="analysis-observations-archive">
        <summary>Osservazioni importate da Google Form (${analysisEntries.length})</summary>
        <div class="page-actions analysis-actions">
          <a class="ghost-button analysis-form-link" href="https://docs.google.com/forms/d/1dMx3J-lz8loospyKAx8Fdfi0oh0W1cGkUFZBMu6U_WU/edit" target="_blank" rel="noopener noreferrer">Apri Google Form</a>
          ${canImport ? `<button class="primary-action" type="button" data-import-analysis>Importa CSV</button>` : ''}
          <input name="analysis_csv_file" type="file" accept=".csv,text/csv" data-analysis-file hidden>
        </div>
        <div class="analysis-toolbar"><input name="analysis_search" type="search" placeholder="Cerca partita, osservatore, fase o testo..." data-analysis-search><span data-analysis-count>${analysisEntries.length} osservazioni</span></div>
        <div class="match-analysis-list" data-analysis-list>
          ${items || `<div class="analysis-empty-state"><div>${icon('analysis')}</div><h2>Nessuna analisi importata</h2><p>Le risposte del Google Form compariranno qui dopo l'importazione del CSV.</p></div>`}
        </div>
      </details>
      <p class="form-message" data-analysis-message></p>`

  return matchWorkspaceShellHtml({
    activeSection: 'analysis',
    teamName,
    titleHtml: `Analisi gara · ${escapeHtml(opponent)}`,
    descriptionHtml: 'Analisi tecnica collegata alla partita',
    className: 'analysis-view',
    attributes: {
      'data-match-analysis-page': true,
      'data-match-id': escapeHtml(matchId),
    },
    contentHtml,
  })
}