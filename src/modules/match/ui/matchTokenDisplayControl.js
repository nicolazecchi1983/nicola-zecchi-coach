import { escapeHtml } from '../../../shared/html/escapeHtml.js'

function checked(value) {
  return value ? ' checked' : ''
}

export function tokenDisplayControlHtml({
  className = '',
  numberChecked = true,
  surnameChecked = true,
  photoChecked = false,
  label = 'Contenuto pedine',
} = {}) {
  return `<div class="match-token-display ${escapeHtml(className)}" data-match-token-display>
    <span class="match-token-display__label">${escapeHtml(label)}</span>
    <div class="match-token-display__options" role="group" aria-label="${escapeHtml(label)}">
      <label class="match-token-toggle"><input type="checkbox" name="token_number"${checked(numberChecked)}><span>Numero</span></label>
      <label class="match-token-toggle"><input type="checkbox" name="token_surname"${checked(surnameChecked)}><span>Cognome</span></label>
      <label class="match-token-toggle"><input type="checkbox" name="token_photo"${checked(photoChecked)}><span>Foto</span></label>
    </div>
  </div>`
}
