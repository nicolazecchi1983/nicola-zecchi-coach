import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'
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
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const matchId = activeMatch?.id ? String(activeMatch.id) : ''
  const value = (key) => escapeHtml(savedAnalysis[key] || '')
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

  return `
    <section class="view page-view analysis-view" data-match-analysis-page data-match-id="${escapeHtml(matchId)}">
      <div class="page-head analysis-page-head match-context-page-head">
        <div><h1>Analisi gara · ${escapeHtml(opponent)}</h1><p><span>MATCH WORKSPACE</span><b>•</b>Analisi tecnica collegata alla partita</p></div>
        ${matchContextBackButtonHtml()}
      </div>
      ${matchContextNavigationHtml('analysis')}
      ${matchId ? `<form class="match-lifecycle-analysis" data-match-lifecycle-analysis>
        <div class="analysis-form-grid">
          <label><span>Lettura complessiva</span><textarea name="analysis_overview" rows="5">${value('analysis_overview')}</textarea></label>
          <label><span>Fase di possesso</span><textarea name="analysis_possession" rows="5">${value('analysis_possession')}</textarea></label>
          <label><span>Fase di non possesso</span><textarea name="analysis_non_possession" rows="5">${value('analysis_non_possession')}</textarea></label>
          <label><span>Transizioni</span><textarea name="analysis_transitions" rows="5">${value('analysis_transitions')}</textarea></label>
          <label><span>Palle inattive</span><textarea name="analysis_set_pieces" rows="5">${value('analysis_set_pieces')}</textarea></label>
          <label><span>Punti di forza</span><textarea name="analysis_strengths" rows="4">${value('analysis_strengths')}</textarea></label>
          <label><span>Criticità</span><textarea name="analysis_issues" rows="4">${value('analysis_issues')}</textarea></label>
          <label class="analysis-form-wide"><span>Conclusioni</span><textarea name="analysis_conclusion" rows="5">${value('analysis_conclusion')}</textarea></label>
        </div>
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
          <input type="file" accept=".csv,text/csv" data-analysis-file hidden>
        </div>
        <div class="analysis-toolbar"><input type="search" placeholder="Cerca partita, osservatore, fase o testo..." data-analysis-search><span data-analysis-count>${analysisEntries.length} osservazioni</span></div>
        <div class="match-analysis-list" data-analysis-list>
          ${items || `<div class="analysis-empty-state"><div>${icon('analysis')}</div><h2>Nessuna analisi importata</h2><p>Le risposte del Google Form compariranno qui dopo l'importazione del CSV.</p></div>`}
        </div>
      </details>
      <p class="form-message" data-analysis-message></p>
    </section>
  `
}
