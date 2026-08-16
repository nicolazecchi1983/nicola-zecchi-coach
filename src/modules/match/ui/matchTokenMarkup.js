import { escapeHtml } from '../../../shared/html/escapeHtml.js'

export function matchTokenShellHtml({ number, numberClass = '', shellClass = '' } = {}) {
  const safeNumber = escapeHtml(number ?? '')
  const numberClasses = ['staff-match-token__number', numberClass].filter(Boolean).join(' ')
  const shellClasses = ['staff-team-token', 'staff-match-token__shell', shellClass].filter(Boolean).join(' ')
  return `<span class="${shellClasses}"><span class="${numberClasses}">${safeNumber}</span></span>`
}
