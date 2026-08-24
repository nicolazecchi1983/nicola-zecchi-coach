import { buttonHtml } from '../../../design-system/uiComponents.js'
import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import { tokenDisplayControlHtml } from './matchTokenDisplayControl.js'
import { matchPitchMarkingsHtml } from './matchPitchMarkup.js'
import { matchTokenShellHtml } from './matchTokenMarkup.js'

const STARTER_FALLBACK_NUMBERS = Array.from({ length: 11 }, (_, index) => index + 1)

function normalizedShirtNumber(value) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 && number <= 99 ? number : null
}

function playerOptions(rosterPlayers = [], rosterOptions = '') {
  if (!rosterPlayers.length) return rosterOptions
  return rosterPlayers.map((player) => {
    const name = player.canonicalName || player.name || ''
    const number = normalizedShirtNumber(player.number)
    const numberAttribute = number == null ? '' : ` data-shirt-number="${number}"`
    return `<option value="${escapeHtml(name)}"${numberAttribute}>${escapeHtml(player.displayName || name)}</option>`
  }).join('')
}

function starterRows(rosterPlayers, rosterOptions) {
  const options = playerOptions(rosterPlayers, rosterOptions)
  return STARTER_FALLBACK_NUMBERS.map((shirtNumber, index) => `
    <div class="lineup-row" data-starter-row="${index}">
      <input class="starter-number-input" name="starter_number_${index}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${shirtNumber}" aria-label="Numero di maglia titolare ${index + 1}">
      <select class="starter-player-select" name="starter_${index}" aria-label="Giocatore titolare ${index + 1}">
        <option value="">Seleziona giocatore</option>${options}
      </select>
    </div>`).join('')
}

function pitchTokens() {
  return Array.from({ length: 11 }, (_, index) => `
    <button class="player-token staff-match-token token-${index + 1}" type="button" data-player-token="${index}" style="--x:50;--y:${88 - index * 7}" aria-label="Sposta giocatore ${index + 1}">
      ${matchTokenShellHtml({ number: index + 1, shellClass: 'token-photo' })}<small>Giocatore ${index + 1}</small>
    </button>
    <input type="hidden" name="position_x_${index}" value="50">
    <input type="hidden" name="position_y_${index}" value="${88 - index * 7}">`).join('')
}

export function renderMatchSquadStep({ teamName, formationOptions, rosterOptions, rosterPlayers = [], teamPrimaryColor = '#07194f', teamSecondaryColor = '#1f93e5', teamKitPattern = 'solid' }) {
  return `<section class="match-step match-squad-step staff-card" data-match-step="2" data-own-token-pattern="${escapeHtml(teamKitPattern)}" data-staff-token-pattern="${escapeHtml(teamKitPattern)}" style="--own-token-primary:${escapeHtml(teamPrimaryColor)};--own-token-secondary:${escapeHtml(teamSecondaryColor)};--staff-token-primary:${escapeHtml(teamPrimaryColor)};--staff-token-secondary:${escapeHtml(teamSecondaryColor)}">
    <div class="squad-command-strip" data-squad-command-strip>
      <div class="squad-command-primary" data-squad-command-primary>
        <label class="formation-system-control"><span>Sistema di gioco</span><select name="formation">${formationOptions}</select></label>
        <label class="formation-custom-control" data-custom-formation hidden><span>Sistema personalizzato</span><input name="custom_formation" placeholder="Es. 3-2-4-1" inputmode="numeric"></label>

        ${tokenDisplayControlHtml({
          className: 'token-display-field',
          numberChecked: true,
          surnameChecked: true,
          photoChecked: false,
        })}
      </div>

      <div class="leadership-badges leadership-selectors squad-command-leadership" aria-label="Assegna capitano e vicecapitano" data-squad-command-leadership>
        <label class="leadership-control">
          <span>Capitano</span>
          <select name="captain" data-leadership-select="captain" aria-label="Seleziona capitano"><option value="">Nessuno</option>${playerOptions(rosterPlayers, rosterOptions)}</select>
        </label>
        <label class="leadership-control">
          <span>Vicecapitano</span>
          <select name="vice_captain" data-leadership-select="vice_captain" aria-label="Seleziona vicecapitano"><option value="">Nessuno</option>${playerOptions(rosterPlayers, rosterOptions)}</select>
        </label>
      </div>
    </div>

    <div class="match-lineup-layout match-lineup-layout--master">
      <div class="pitch-panel">
        <div class="pitch-panel-head">
          <div class="pitch-panel-title"><span class="lineup-kicker">CAMPO</span><h3>Campo di gioco</h3></div>
          <div class="pitch-panel-actions">${buttonHtml({ label: 'PDF formazione', variant: 'secondary', className: 'lineup-pdf-button match-squad-field-action', attributes: { 'data-match-lineup-pdf': true }, iconBefore: '<span class="match-squad-field-action__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v5h5"></path></svg></span>' })}${buttonHtml({ label: 'Azzera posizioni', variant: 'secondary', className: 'formation-reset-button formation-reset-button--field match-squad-field-action', attributes: { 'data-reset-formation': true }, iconBefore: '<span class="match-squad-field-action__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 11a8 8 0 1 0 2.3-5.7L4 8"></path><path d="M4 3v5h5"></path></svg></span>' })}</div>
        </div>
        <div class="staff-match-pitch" data-football-pitch aria-label="Campo formazione">
          ${matchPitchMarkingsHtml({ idPrefix: 'match-squad-pitch' })}
          ${pitchTokens()}
        </div>
      </div>

      <div class="lineup-list lineup-list--selection">
        <div class="lineup-list-head"><div><span class="lineup-kicker">TITOLARI</span><h3>Undici iniziale</h3></div></div>
        <div class="lineup-selection-list">${starterRows(rosterPlayers, rosterOptions)}</div>
      </div>
    </div>

    <div class="bench-block bench-block--automatic bench-block--full-width" data-bench-block>
      <div class="bench-block-head"><h3>A disposizione</h3><div class="bench-count" data-bench-count>Distinta: —/20</div></div>
      <div class="bench-grid bench-grid--slots" data-bench-grid data-bench-slots>
        ${Array.from({ length: 9 }, (_, index) => `
          <label class="bench-slot" data-bench-slot="${index}">
            <span class="bench-slot-number" data-bench-slot-number="${index}">${String(index + 12).padStart(2, '0')}</span>
            <select name="bench_${index}" data-bench-select="${index}" aria-label="Panchina ${index + 12}">
              <option value="">Seleziona giocatore</option>
            </select>
          </label>`).join('')}
      </div>
    </div>
  </section>`
}
