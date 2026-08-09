import { buttonHtml } from '../../../design-system/uiComponents.js'
import { escapeHtml } from '../../../shared/html/escapeHtml.js'

const STARTER_NUMBERS = [1, 3, 5, 6, 2, 4, 8, 11, 10, 7, 9]

function starterRows(rosterOptions) {
  return STARTER_NUMBERS.map((shirtNumber, index) => `
    <div class="lineup-row">
      <span class="lineup-index">${String(index + 1).padStart(2, '0')}</span>
      <input type="number" min="1" max="99" name="starter_number_${index}" value="${shirtNumber}" aria-label="Numero di maglia">
      <select name="starter_${index}" aria-label="Giocatore titolare ${index + 1}">
        <option value="">Seleziona giocatore</option>${rosterOptions}
      </select>
    </div>`).join('')
}

function pitchTokens() {
  return Array.from({ length: 11 }, (_, index) => `
    <button class="player-token token-${index + 1}" type="button" data-player-token="${index}" style="--x:50;--y:${88 - index * 7}" aria-label="Sposta giocatore ${index + 1}">
      <span class="token-photo">${index + 1}</span><small>Giocatore ${index + 1}</small>
    </button>
    <input type="hidden" name="position_x_${index}" value="50">
    <input type="hidden" name="position_y_${index}" value="${88 - index * 7}">`).join('')
}

export function renderMatchSquadStep({ teamName, formationOptions, rosterOptions }) {
  return `<section class="match-step match-squad-step staff-card" data-match-step="2">
    <header class="section-title"><span>02</span><div><h2>${escapeHtml(teamName)}</h2><p>Sistema di gioco, undici iniziale e valutazione tecnica.</p></div></header>

    <div class="formation-toolbar formation-toolbar--single-row">
      <label class="formation-system-control"><span>Sistema di gioco</span><select name="formation">${formationOptions}</select></label>
      <label class="formation-custom-control" data-custom-formation hidden><span>Sistema personalizzato</span><input name="custom_formation" placeholder="Es. 3-2-4-1" inputmode="numeric"></label>

      <div class="token-display-options" role="group" aria-label="Contenuto pedine">
        <span class="toolbar-control-label">Contenuto pedine</span>
        <label><input type="checkbox" name="token_number" checked> Numero</label>
        <label><input type="checkbox" name="token_surname" checked> Cognome</label>
        <label><input type="checkbox" name="token_photo"> Foto</label>
      </div>

      <div class="leadership-badges" aria-label="Assegna capitano e vicecapitano">
        <button class="leadership-badge leadership-badge--captain" type="button" draggable="true" data-leadership-badge="captain" aria-label="Trascina sulla pedina per assegnare il capitano" title="Capitano">C</button>
        <button class="leadership-badge leadership-badge--vice" type="button" draggable="true" data-leadership-badge="vice_captain" aria-label="Trascina sulla pedina per assegnare il vicecapitano" title="Vicecapitano">VC</button>
      </div>

      ${buttonHtml({ label: 'Azzera posizioni', variant: 'secondary', className: 'formation-reset-button', attributes: { 'data-reset-formation': true }, iconBefore: '<span aria-hidden="true">↺</span> ' })}
    </div>

    <div class="match-lineup-layout match-lineup-layout--master">
      <div class="pitch-panel">
        <div class="football-pitch" data-football-pitch aria-label="Campo formazione">
          <div class="pitch-markings"><i></i><i></i><i></i><span class="pitch-goal pitch-goal-top"></span><span class="pitch-goal pitch-goal-bottom"></span></div>
          ${pitchTokens()}
        </div>
      </div>

      <div class="squad-side-column">
        <div class="lineup-list lineup-list--selection">
          <div class="lineup-list-head"><div><span class="lineup-kicker">TITOLARI</span><h3>Undici iniziale</h3></div><small>Seleziona un giocatore per ogni pedina</small></div>
          <div class="lineup-selection-list">${starterRows(rosterOptions)}</div>
        </div>

        <div class="bench-block bench-block--automatic" data-bench-block>
          <div class="bench-block-head"><div><span>PANCHINA AUTOMATICA</span><h3>A disposizione</h3></div><div class="bench-count" data-bench-count>Distinta: —/20</div></div>
          <p class="bench-help">I giocatori non inseriti nell’undici iniziale sono in panchina.</p>
          <input type="hidden" name="bench_excluded" value="[]">
          <div class="bench-grid bench-grid--automatic" data-bench-grid data-auto-bench></div>
          <p class="bench-limit-message" data-bench-limit-message hidden>Riduci la distinta a un massimo di 20 giocatori prima di salvare.</p>
        </div>
      </div>
    </div>

    <input type="hidden" name="captain" value="">
    <input type="hidden" name="vice_captain" value="">
  </section>`
}
