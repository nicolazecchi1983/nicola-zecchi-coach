import { matchContextBackButtonHtml, matchContextNavigationHtml } from '../../../design-system/uiComponents.js'

export function renderMatchReportWorkspaceView({
  activeMatch,
  reportPaper = '',
  savedAtLabel = '',
  escapeHtml,
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const hasReport = Boolean(reportPaper)

  return `<section class="view page-view match-report-workspace" data-match-report-workspace>
    <div class="page-head match-context-page-head">
      <div>
        <h1>Report · ${escapeHtml(opponent)}</h1>
        <p><span>MATCH WORKSPACE</span><b>•</b>Documento tecnico ufficiale collegato alla partita.</p>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchContextNavigationHtml('report')}
    ${hasReport ? `
      <div class="match-report-workspace-toolbar">
        <div>
          <span>REPORT SALVATO</span>
          <strong>${savedAtLabel ? `Ultimo salvataggio ${escapeHtml(savedAtLabel)}` : 'Documento disponibile nel Calendario'}</strong>
          <small>Il contenuto deriva dalla stessa partita del Match Workspace.</small>
        </div>
        <button class="primary-action" type="button" data-match-report-workspace-print>Stampa / salva PDF</button>
      </div>
      <div class="match-report-workspace-preview" data-match-report-workspace-preview>${reportPaper}</div>
    ` : `
      <div class="empty-state match-report-workspace-empty">
        <h2>Report non ancora generato</h2>
        <p>Completa i dati della partita e l’Analisi gara, quindi genera il Match Report. Quando viene salvato, comparirà qui automaticamente senza creare una seconda copia.</p>
        <button class="primary-action" type="button" data-match-report-open-analysis>Vai ad Analisi gara</button>
      </div>
    `}
  </section>`
}
