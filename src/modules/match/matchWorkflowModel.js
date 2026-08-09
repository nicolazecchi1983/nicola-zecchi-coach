export const MATCH_WORKFLOW_SCHEMA_VERSION = 1

export const MATCH_WORKFLOW_SECTIONS = Object.freeze([
  Object.freeze({
    key: 'opponent-study',
    label: 'Studio avversario',
    description: 'Report Match Analyst, video, link esterni e materiale tecnico pre-partita.',
    actionLabel: 'Apri studio avversario',
  }),
  Object.freeze({
    key: 'callups',
    label: 'Convocazioni',
    description: 'Seleziona i convocati e prepara il PDF per il Team Manager.',
    actionLabel: 'Prepara convocazioni',
  }),
  Object.freeze({
    key: 'our-team',
    label: 'Nostra squadra',
    description: 'Formazione, panchina, capitano, vicecapitano e analisi della nostra squadra.',
    actionLabel: 'Apri nostra squadra',
  }),
  Object.freeze({
    key: 'opponent',
    label: 'Avversario',
    description: 'Distinta, formazione, ciclo del gioco, inattive e note.',
    actionLabel: 'Apri avversario',
  }),
  Object.freeze({
    key: 'analysis',
    label: 'Analisi gara',
    description: 'Dati oggettivi e lettura qualitativa della prestazione.',
    actionLabel: 'Apri analisi gara',
  }),
  Object.freeze({
    key: 'report',
    label: 'Report',
    description: 'Documento tecnico o relazione Match Analyst collegata alla partita.',
    actionLabel: 'Apri report',
  }),
  Object.freeze({
    key: 'post-match',
    label: 'Post gara',
    description: 'Report, video, relazioni e spunti per il microciclo successivo.',
    actionLabel: 'Apri post gara',
  }),
])

function safeDateTime(match = {}) {
  const date = String(match.date || '').slice(0, 10)
  if (!date) return null
  const time = String(match.time || '15:30').slice(0, 5) || '15:30'
  const value = new Date(`${date}T${time}:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

export function getMatchWorkflowPhase(match = {}, now = new Date()) {
  const kickoff = safeDateTime(match)
  if (!kickoff) return 'pre-match'

  const current = now instanceof Date ? now : new Date(now)
  if (Number.isNaN(current.getTime())) return 'pre-match'

  const sameDay = kickoff.getFullYear() === current.getFullYear()
    && kickoff.getMonth() === current.getMonth()
    && kickoff.getDate() === current.getDate()

  if (sameDay) return 'match-day'
  return kickoff > current ? 'pre-match' : 'post-match'
}

export function getMatchWorkflowPhaseLabel(phase) {
  return ({
    'pre-match': 'Pre-gara',
    'match-day': 'Gara',
    'post-match': 'Post-gara',
  })[phase] || 'Pre-gara'
}

export function getMatchWorkflowSections() {
  return MATCH_WORKFLOW_SECTIONS
}
