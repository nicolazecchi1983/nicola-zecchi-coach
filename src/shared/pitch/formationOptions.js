import { escapeHtml } from '../html/escapeHtml.js'
import { COMMON_FORMATIONS } from './formationLayouts.js'

export function formationOptionsHtml(selected = '') {
  return COMMON_FORMATIONS
    .map((value) => `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(value)}</option>`)
    .join('')
}
