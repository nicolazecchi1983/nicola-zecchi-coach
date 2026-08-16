import { editorFooterHtml, matchContextBackButtonHtml } from '../../../design-system/uiComponents.js'
import { formationOptionsHtml } from '../../../shared/pitch/formationOptions.js'
import { renderMatchSquadStep } from './matchSquadView.js'
import { renderMatchOpponentStep } from './matchOpponentView.js'

function scoreFieldsHtml(prefix, label) {
  return `<label class="match-score-field">
    <span>${label}</span>
    <div class="match-input-with-icon match-score-input" data-score-control="${prefix}">
      <i aria-hidden="true">#</i>
      <div class="match-score-compact" role="group" aria-label="${label}">
        <input type="text" inputmode="numeric" maxlength="2" name="${prefix}_home" placeholder="0" autocomplete="off" aria-label="Gol noi">
        <b aria-hidden="true">-</b>
        <input type="text" inputmode="numeric" maxlength="2" name="${prefix}_away" placeholder="0" autocomplete="off" aria-label="Gol avversari">
      </div>
      <input type="hidden" name="${prefix}">
    </div>
  </label>`
}

export function createLegacyMatchCompatibilityView({
  canEditMatch,
  getTeamProfile,
  getActiveMatchContext,
  getEditorIdentity,
  getRosterPlayers,
  escapeHtml,
}) {
  return function legacyMatchCompatibilityView() {
    if (!canEditMatch()) {
      return `<section class="placeholder"><h1>Sezione Match non disponibile</h1><p>Il tuo livello di accesso non consente di modificare questa partita.</p></section>`
    }

    const team = getTeamProfile()
    const activeMatch = getActiveMatchContext()
    const opponentName = activeMatch?.opponent || 'Avversario da definire'
    const editor = getEditorIdentity()
    const editorUserName = editor?.name || 'Utente'
    const editorRoleLabel = editor?.role || 'Staff'
    const editorUserInitial = editorUserName.charAt(0).toUpperCase() || 'N'
    const rosterPlayers = getRosterPlayers()
    const rosterOptions = rosterPlayers
      .map((player) => {
        const shirtNumber = Number(player.number)
        const numberAttribute = Number.isInteger(shirtNumber) && shirtNumber >= 1 && shirtNumber <= 99
          ? ` data-shirt-number="${shirtNumber}"`
          : ''
        return `<option value="${escapeHtml(player.canonicalName)}"${numberAttribute}>${escapeHtml(player.surname)} ${escapeHtml(player.firstName)}</option>`
      })
      .join('')

    return `
      <section class="match-editor staff-editor-template" data-match-editor>
        <header class="match-page-header staff-page-header">
          <div class="match-page-header__copy">
            <span class="match-page-header__eyebrow">SCHEDA PARTITA</span>
            <h1>Compatibilità Match</h1>
            <p>Motore interno di compatibilità dati.</p>
          </div>
          <div class="match-page-header__right">
            <div class="match-page-header__actions staff-page-header__actions">
              ${matchContextBackButtonHtml()}
              <button class="staff-button staff-button--danger match-reset-button" type="button" data-match-reset>Reset editor</button>
            </div>
            <div class="match-page-header__profile" aria-label="Utente corrente">
              <span class="match-page-header__avatar" aria-hidden="true">${escapeHtml(editorUserInitial)}</span>
              <span><strong>${escapeHtml(editorUserName)}</strong><small>${escapeHtml(editorRoleLabel)}</small></span>
            </div>
          </div>
        </header>

        <nav class="match-step-nav match-step-nav--five staff-stepper" aria-label="Sezioni Match Sheet">
          ${['Dati gara',team.shortName || 'Propria squadra','Avversario','Eventi e note','Riepilogo'].map((label,i)=>`<button type="button" class="staff-stepper__item ${i===0?'is-active':''}" data-match-step-button="${i+1}"><b>${String(i+1).padStart(2,'0')}</b><span>${label}</span></button>`).join('')}
        </nav>

        <form data-match-form>
          <section class="match-step staff-card is-active" data-match-step="1">
            <header class="section-title"><span>01</span><div><h2>Dati gara</h2><p>Informazioni ufficiali e risultato.</p></div></header>
            <div class="match-form-grid three match-game-data-grid">
              <label><span>Data</span><div class="match-input-with-icon"><i aria-hidden="true">▣</i><input type="date" name="date" required></div></label>
              <label><span>Ora</span><div class="match-input-with-icon"><i aria-hidden="true">◷</i><input type="time" name="time" value="15:30"></div></label>
              <label><span>Competizione</span><div class="match-input-with-icon"><i aria-hidden="true">★</i><select name="competition"><option>Campionato</option><option>Coppa</option><option>Amichevole</option></select></div></label>
              <label><span>Avversario</span><div class="match-input-with-icon"><i aria-hidden="true">VS</i><input name="opponent" value="Da definire" required></div></label>
              <label><span>Casa / Trasferta</span><div class="match-input-with-icon"><i aria-hidden="true">⌂</i><select name="venue"><option>Casa</option><option>Trasferta</option><option>Campo neutro</option></select></div></label>
              <label><span>Campo</span><div class="match-input-with-icon"><i aria-hidden="true">⌖</i><input name="location" placeholder="Impianto sportivo"></div></label>
              ${scoreFieldsHtml('result','Risultato finale')}
              ${scoreFieldsHtml('half_result','Risultato 1° tempo')}
              <label><span>Giornata / turno</span><div class="match-input-with-icon"><i aria-hidden="true">#</i><input name="round" placeholder="Es. 12ª giornata"></div></label>
            </div>
          </section>

          ${renderMatchSquadStep({
            teamName: team.shortName || team.name || 'Propria squadra',
            teamPrimaryColor: team.primaryColor || '#07194f',
            teamSecondaryColor: team.secondaryColor || '#1f93e5',
            teamKitPattern: team.kitPattern || 'solid',
            formationOptions: formationOptionsHtml('4-4-2'),
            rosterOptions,
            rosterPlayers,
          })}

          ${renderMatchOpponentStep()}

          <section class="match-step staff-card" data-match-step="4">
            <header class="section-title"><span>04</span><div><h2>Eventi e note</h2><p>Minuti, sostituzioni, gol, sanzioni e lettura della partita.</p></div></header>
            <div class="match-events-grid match-events-grid--dynamic"><article class="match-event-card"><div class="match-event-card-head"><div><span>CAMBI</span><h3>Sostituzioni</h3></div><button class="icon-add-button" type="button" data-add-match-row="substitution">＋</button></div><div data-substitutions></div></article><article class="match-event-card"><div class="match-event-card-head"><div><span>RETE</span><h3>Marcatori e assist</h3></div><button class="icon-add-button" type="button" data-add-match-row="goal">＋</button></div><div data-goals></div></article><article class="match-event-card"><div class="match-event-card-head"><div><span>DISCIPLINA</span><h3>Sanzioni</h3></div><button class="icon-add-button" type="button" data-add-match-row="card">＋</button></div><div data-cards></div></article></div>
            <div class="notes-mode"><label><span>Struttura note</span><select name="notes_mode"><option value="free">Campo unico</option><option value="halves">Due tempi</option><option value="quarters">Intervalli da 15 minuti</option></select></label></div><div data-note-fields></div>
          </section>

          <section class="match-step staff-card" data-match-step="5">
            <header class="section-title"><span>05</span><div><h2>Riepilogo Match Sheet</h2><p>Controlla i dati inseriti e salva la scheda. Il report PDF si genera dall’Analisi gara.</p></div></header><div class="match-report-preview" data-match-report-preview></div>
          </section>

          ${editorFooterHtml({ progressText: 'Passaggio 1 di 5', progressAttribute: 'data-match-progress', previousAttribute: 'data-match-prev', nextAttribute: 'data-match-next', saveAttribute: 'data-match-save-final', saveLabel: 'Salva Match Sheet' })}
        </form>
      </section>`
  }
}
