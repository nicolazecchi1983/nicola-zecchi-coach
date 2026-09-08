import { colorPickerHtml } from '../../../design-system/uiComponents.js'
import { formationOptionsHtml } from '../../../shared/pitch/formationOptions.js'
import { renderMatchAnalysisSchemaEditor } from './matchAnalysisSchemaView.js'
import { parseMatchAnalysisSchema } from '../matchAnalysisSchema.js'
import { matchPitchMarkingsHtml } from './matchPitchMarkup.js'
import { matchTokenShellHtml } from './matchTokenMarkup.js'

function opponentTokensHtml() {
  return Array.from({ length: 11 }, (_, index) => `
    <button type="button" class="opponent-token staff-match-token" data-opponent-token="${index}" style="--x:50;--y:${88 - index * 7}" aria-label="Sposta giocatore avversario ${index + 1}">${matchTokenShellHtml({ number: index + 1, numberClass: 'opponent-token-number' })}</button>
    <input type="hidden" name="opponent_position_x_${index}" value="50">
    <input type="hidden" name="opponent_position_y_${index}" value="${88 - index * 7}">`).join('')
}

export function renderMatchOpponentStep() {
  return `<section class="match-step match-opponent-step staff-card" data-match-step="3" data-staff-token-pattern="solid">
    <section class="opponent-command-surface" aria-label="Configurazione avversario">
      <div class="opponent-command-grid">
        <label class="opponent-initial-system-control">
          <span>Sistema iniziale</span>
          <select name="opponent_system_0">${formationOptionsHtml('4-4-2')}</select>
        </label>

        <div class="opponent-token-appearance-control">
          <span class="opponent-control-label">Aspetto pedine</span>
          <div class="opponent-token-appearance-row">
            <label class="opponent-number-toggle">
              <input type="checkbox" name="opponent_token_number" checked>
              <span>Numero</span>
            </label>
            <div class="opponent-token-mini-preview staff-team-token" aria-hidden="true"><span>9</span></div>
            <details class="opponent-appearance-disclosure">
              <summary>＋ Cambia colori</summary>
              <div class="opponent-appearance-popover">
                <div class="opponent-appearance-popover-head">
                  <strong>Aspetto pedine</strong>
                  <div class="opponent-appearance-popover-head-actions">
                    <span>Avversario</span>
                    <button type="button" class="opponent-appearance-close" data-close-opponent-appearance aria-label="Chiudi pannello colori">×</button>
                  </div>
                </div>
                ${colorPickerHtml({ name: 'opponent_token_primary', value: '#9f1239', label: 'Colore principale', fieldKey: 'opponent-primary', className: 'opponent-color-picker' })}
                ${colorPickerHtml({ name: 'opponent_token_secondary', value: '#f8fafc', label: 'Colore secondario', fieldKey: 'opponent-secondary', className: 'opponent-color-picker' })}
                <label class="opponent-pattern-control"><span>Stile</span><select name="opponent_token_pattern"><option value="solid">Tinta unita</option><option value="vertical">Strisce verticali</option><option value="horizontal">Strisce orizzontali</option></select></label>
              </div>
            </details>
          </div>
        </div>
      </div>
      <input type="hidden" name="opponent_system_minute_0" value="0">
      <input type="hidden" name="opponent_system_note_0" value="">
    </section>

    <div class="opponent-core-layout">
      <section class="opponent-field-panel">
        <header class="opponent-panel-bar">
          <div><span class="opponent-kicker">CAMPO</span><h3>Campo avversario</h3></div>
        </header>
        <div class="opponent-football-pitch staff-match-pitch" data-opponent-pitch>
          ${matchPitchMarkingsHtml({ idPrefix: 'match-opponent-pitch' })}
          ${opponentTokensHtml()}
        </div>
      </section>

      <section class="opponent-sheet-panel">
        <header class="opponent-panel-bar opponent-sheet-panel__header">
          <div><span class="opponent-kicker">DISTINTA</span><h3>Distinta avversaria</h3></div>
          <div class="opponent-sheet-panel__header-actions">
            <span class="opponent-sheet-state" data-opponent-sheet-state>Non caricata</span>
            <button type="button" class="staff-button staff-button--ghost opponent-sheet-remove" data-remove-opponent-sheet hidden>Rimuovi</button>
          </div>
        </header>
        <div class="opponent-sheet-upload" data-opponent-sheet-upload>
          <div class="opponent-sheet-acquisition" data-opponent-sheet-empty>
            <span class="opponent-sheet-acquisition__glyph" aria-hidden="true"></span>
            <div class="opponent-sheet-acquisition__copy">
              <strong>Carica la distinta avversaria</strong>
              <span>Fotografa il foglio oppure scegli un documento dal dispositivo.</span>
            </div>
            <div class="opponent-sheet-acquisition__actions">
              <label class="staff-button opponent-sheet-acquisition__action opponent-sheet-acquisition__action--primary">
                <input type="file" name="opponent_sheet_camera" accept="image/*" capture="environment">
                <span>Scatta foto</span>
              </label>
              <label class="staff-button staff-button--secondary opponent-sheet-acquisition__action">
                <input type="file" name="opponent_sheet_file" accept="image/*,application/pdf">
                <span>Scegli file</span>
              </label>
            </div>
            <small class="opponent-sheet-acquisition__formats">JPG · PNG · PDF</small>
          </div>
          <img data-opponent-sheet-preview hidden alt="Distinta avversaria caricata">
          <a class="opponent-sheet-document" data-opponent-sheet-document hidden target="_blank" rel="noopener noreferrer">
            <span class="opponent-sheet-document__type">PDF</span>
            <span class="opponent-sheet-document__copy">
              <strong class="opponent-sheet-document__name" data-opponent-sheet-document-name>Distinta avversaria.pdf</strong>
              <small>Documento gara</small>
            </span>
            <span class="opponent-sheet-document__action">Apri distinta</span>
          </a>
        </div>
        <div class="opponent-sheet-actions" aria-live="polite">
          <span data-opponent-sheet-message></span>
        </div>
      </section>
    </div>

    <section class="opponent-reading-surface">
      <div class="opponent-reading-header">
        <h3>Lettura avversario</h3>
        <button class="staff-button staff-button--secondary opponent-add-system-button" type="button" data-add-opponent-formation>＋ Registra cambio</button>
      </div>
      <div class="opponent-formations-list opponent-formations-list--reading" data-opponent-formations></div>
      ${renderMatchAnalysisSchemaEditor({
        name: 'opponent_analysis_schema',
        schema: parseMatchAnalysisSchema('', {}),
        showIntro: false,
      })}
    </section>

    <div class="legacy-analysis-fields" hidden aria-hidden="true">
      ${['opponent_possession_note_0','opponent_possession_note_1','opponent_possession_note_2','opponent_possession_note_3','opponent_possession_note_4','opponent_nonpossession_note_0','opponent_nonpossession_note_1','opponent_nonpossession_note_2','opponent_nonpossession_note_3','opponent_corners','opponent_wide_free_kicks','opp_strengths','opp_weaknesses','return_notes'].map((name)=>`<input type="hidden" name="${name}" value="">`).join('')}
    </div>
  </section>`
}
