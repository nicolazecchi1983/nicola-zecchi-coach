import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

export function renderMatchReportWorkspaceView({
  activeMatch,
  reportPaper = '',
  savedAtLabel = '',
  teamName = '',
  escapeHtml,
}) {
  const opponent = activeMatch?.opponent || 'Partita selezionata'
  const hasReport = Boolean(reportPaper)

  const contentHtml = hasReport ? `
      <div class="workspace-surface product-surface match-report-workspace-toolbar">
        <div>
          <span>REPORT SALVATO</span>
          <strong>${savedAtLabel ? `Ultimo salvataggio ${escapeHtml(savedAtLabel)}` : 'Documento disponibile nel Calendario'}</strong>
          <small>Il contenuto deriva dalla stessa partita del Match Workspace.</small>
        </div>
        <button class="primary-action" type="button" data-match-report-workspace-print>Stampa / salva PDF</button>
      </div>
      <div class="match-report-workspace-preview" data-match-report-workspace-preview>${reportPaper}</div>
    ` : `
      <div class="workspace-surface product-surface product-empty-state empty-state match-report-workspace-empty">
        <h2>Report non ancora generato</h2>
        <p>Completa i dati della partita e l’Analisi gara, quindi genera il Match Report. Quando viene salvato, comparirà qui automaticamente senza creare una seconda copia.</p>
        <button class="primary-action" type="button" data-match-report-open-analysis>Vai ad Analisi gara</button>
      </div>
    `

  return matchWorkspaceShellHtml({
    activeSection: 'report',
    teamName,
    titleHtml: `Report · ${escapeHtml(opponent)}`,
    descriptionHtml: 'Documento tecnico ufficiale collegato alla partita.',
    className: 'match-report-workspace',
    attributes: { 'data-match-report-workspace': true },
    contentHtml,
  })
}
