import { getUserErrorMessage } from '../../core/appError.js'
import { DATA_ACCESS_ERROR_CODES, normalizeDataAccessError } from './dataAccessError.js'

export const DATA_ACCESS_USER_FALLBACKS = Object.freeze({
  'data-access': 'Operazione non riuscita. Riprova.',
  'app-section-open': 'Impossibile aprire la sezione richiesta. Riprova.',
  'calendar-events-load': 'Caricamento calendario non riuscito. Riprova.',
  'calendar-season-import': 'Importazione non riuscita.',
  'calendar-bulk-delete': 'Eliminazione non riuscita.',
  'calendar-event-create': 'Salvataggio evento non riuscito.',
  'calendar-event-update': 'Modifica evento non riuscita.',
  'calendar-event-delete': 'Eliminazione evento non riuscita.',
  'calendar-document-open': 'Impossibile aprire il documento.',
  'team-settings-save': 'Impossibile salvare la configurazione squadra.',
  'roster-player-save': 'Salvataggio non riuscito.',
  'roster-player-remove': 'Rimozione non riuscita.',
  'player-profile-save': 'Salvataggio scheda giocatore non riuscito.',
  'staff-user-create': 'Creazione utente non riuscita.',
  'staff-user-update': 'Aggiornamento non riuscito.',
  'staff-user-delete': 'Eliminazione utente non riuscita.',
  'staff-password-update': 'Aggiornamento password non riuscito.',
  'analysis-template-duplicate': 'Duplicazione non riuscita.',
  'analysis-template-delete': 'Eliminazione non riuscita.',
  'analysis-template-save': 'Salvataggio template non riuscito.',
  'analysis-template-manager': 'Template Manager non disponibile.',
  'match-report-calendar-save': 'Salvataggio nel Calendario non riuscito.',
  'legacy-match-report-calendar-save': 'Salvataggio nel Calendario non riuscito.',
  'match-report-print': 'Impossibile aprire la stampa del Match Report.',
  'match-post-save': 'Salvataggio non riuscito.',
  'match-create': 'Creazione partita non riuscita.',
  'match-opponent-lineup-upload': 'Caricamento distinta non riuscito.',
  'match-opponent-lineup-remove': 'Rimozione distinta non riuscita.',
  'match-opponent-lineup-load': 'Distinta salvata non disponibile.',
  'match-analysis-report-generate': 'Generazione report non riuscita.',
  'match-analysis-import': 'Importazione non riuscita.',
  'callups-print': 'Impossibile aprire la stampa.',
  'training-library-feedback-save': 'Salvataggio non riuscito.',
  'training-draft-save': 'Salvataggio bozza non riuscito.',
  'training-publish': 'Pubblicazione non riuscita. Il documento precedente è rimasto invariato.',
  'training-sheet-open': 'Impossibile aprire la Training Sheet.',
})

export function getDataAccessUserFallback(stage = 'data-access') {
  return DATA_ACCESS_USER_FALLBACKS[stage] || DATA_ACCESS_USER_FALLBACKS['data-access']
}

function diagnosticMessage(error) {
  const value = String(error?.message || '').trim()
  if (!value) return null
  return value.length > 500 ? `${value.slice(0, 497)}...` : value
}

export function reportDataAccessDiagnostic(error, { stage = 'data-access', logger = null } = {}) {
  try {
    const normalized = normalizeDataAccessError(error, { stage })
    const sink = logger || globalThis.console?.error
    if (typeof sink === 'function') {
      sink('[STAFF][data-access]', {
        stage: normalized.stage || stage,
        dataAccessCode: normalized.dataAccessCode,
        retryable: Boolean(normalized.retryable),
        status: normalized.status ?? null,
        sourceCode: normalized.sourceCode ?? null,
        message: diagnosticMessage(normalized),
      })
    }
    return normalized
  } catch {
    return null
  }
}

/**
 * Convert raw Supabase/network errors into a stable user-facing message.
 * Existing AppError/DataAccessError userMessage always wins; otherwise the
 * data-access classifier supplies a consistent fallback for network, auth,
 * permissions, validation and transient service failures.
 *
 * The explicit fallback parameter remains supported for backward compatibility,
 * while migrated call sites can rely on the canonical stage -> fallback map.
 */
export function getDataAccessUserMessage(error, fallback, { stage = 'data-access', logger = null } = {}) {
  const resolvedFallback = fallback || getDataAccessUserFallback(stage)
  const normalized = reportDataAccessDiagnostic(error, { stage, logger })
  const existing = getUserErrorMessage(error, '')
  if (existing) return existing

  if (!normalized || normalized.dataAccessCode === DATA_ACCESS_ERROR_CODES.UNKNOWN) return resolvedFallback
  return normalized.userMessage || resolvedFallback
}
