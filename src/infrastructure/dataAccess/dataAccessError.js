import { AppError } from '../../core/appError.js'

export const DATA_ACCESS_ERROR_CODES = Object.freeze({
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  UNKNOWN: 'DATA_ACCESS_UNKNOWN',
})

const RETRYABLE_CODES = new Set([
  DATA_ACCESS_ERROR_CODES.NETWORK_UNAVAILABLE,
  DATA_ACCESS_ERROR_CODES.TIMEOUT,
  DATA_ACCESS_ERROR_CODES.RATE_LIMITED,
  DATA_ACCESS_ERROR_CODES.SERVER_UNAVAILABLE,
])

const NETWORK_MESSAGE_RE = /(failed to fetch|networkerror|network error|load failed|connection (?:reset|refused)|internet disconnected|offline|econnreset|enotfound|eai_again)/i
const TIMEOUT_MESSAGE_RE = /(timeout|timed out|etimedout|query canceled|query cancelled)/i

function numericStatus(error) {
  const value = Number(error?.status ?? error?.statusCode ?? error?.response?.status)
  return Number.isFinite(value) && value > 0 ? value : null
}

function sourceCode(error) {
  return String(error?.code ?? error?.error_code ?? '').trim() || null
}

function messageOf(error) {
  return String(error?.message ?? error?.error_description ?? '').trim()
}

export function classifyDataAccessError(error) {
  const status = numericStatus(error)
  const code = sourceCode(error)
  const message = messageOf(error)
  const normalizedCode = String(code || '').toUpperCase()

  if (status === 401 || normalizedCode === 'AUTH_SESSION_MISSING') return DATA_ACCESS_ERROR_CODES.AUTH_REQUIRED
  if (status === 403 || normalizedCode === '42501') return DATA_ACCESS_ERROR_CODES.PERMISSION_DENIED
  if (status === 404 || normalizedCode === 'PGRST116') return DATA_ACCESS_ERROR_CODES.NOT_FOUND
  if (status === 408 || status === 504 || normalizedCode === '57014' || normalizedCode === 'ETIMEDOUT' || TIMEOUT_MESSAGE_RE.test(message)) {
    return DATA_ACCESS_ERROR_CODES.TIMEOUT
  }
  if (status === 429) return DATA_ACCESS_ERROR_CODES.RATE_LIMITED
  if (status === 502 || status === 503 || status === 500) return DATA_ACCESS_ERROR_CODES.SERVER_UNAVAILABLE
  if (normalizedCode === '23505' || status === 409) return DATA_ACCESS_ERROR_CODES.CONFLICT
  if (['23502', '23503', '23514', '22P02'].includes(normalizedCode) || status === 400 || status === 422) {
    return DATA_ACCESS_ERROR_CODES.VALIDATION
  }
  if (status === 0 || normalizedCode === 'ECONNRESET' || normalizedCode === 'ENOTFOUND' || normalizedCode === 'EAI_AGAIN' || NETWORK_MESSAGE_RE.test(message)) {
    return DATA_ACCESS_ERROR_CODES.NETWORK_UNAVAILABLE
  }

  return DATA_ACCESS_ERROR_CODES.UNKNOWN
}

export function isRetryableDataAccessError(error) {
  const code = error?.dataAccessCode || classifyDataAccessError(error)
  return RETRYABLE_CODES.has(code)
}

function defaultUserMessage(code) {
  switch (code) {
    case DATA_ACCESS_ERROR_CODES.NETWORK_UNAVAILABLE:
      return 'Connessione non disponibile. Controlla la rete e riprova.'
    case DATA_ACCESS_ERROR_CODES.TIMEOUT:
      return 'La richiesta sta impiegando troppo tempo. Riprova tra poco.'
    case DATA_ACCESS_ERROR_CODES.RATE_LIMITED:
      return 'Troppe richieste ravvicinate. Attendi qualche secondo e riprova.'
    case DATA_ACCESS_ERROR_CODES.AUTH_REQUIRED:
      return 'La sessione non è più valida. Accedi di nuovo.'
    case DATA_ACCESS_ERROR_CODES.PERMISSION_DENIED:
      return 'Non hai i permessi necessari per questa operazione.'
    case DATA_ACCESS_ERROR_CODES.CONFLICT:
      return 'I dati sono cambiati oppure esiste già un elemento equivalente. Aggiorna e riprova.'
    case DATA_ACCESS_ERROR_CODES.VALIDATION:
      return 'Alcuni dati non sono validi. Controllali e riprova.'
    case DATA_ACCESS_ERROR_CODES.NOT_FOUND:
      return 'Il dato richiesto non è più disponibile.'
    case DATA_ACCESS_ERROR_CODES.SERVER_UNAVAILABLE:
      return 'Servizio temporaneamente non disponibile. Riprova tra poco.'
    default:
      return 'Operazione non riuscita. Riprova.'
  }
}

export class DataAccessError extends AppError {
  constructor(message, {
    dataAccessCode = DATA_ACCESS_ERROR_CODES.UNKNOWN,
    stage = 'data-access',
    cause = null,
    userMessage = null,
    status = null,
    sourceCode: originalSourceCode = null,
  } = {}) {
    super(message, {
      code: `DATA_${dataAccessCode}`,
      stage,
      cause,
      userMessage: userMessage || defaultUserMessage(dataAccessCode),
    })
    this.name = 'DataAccessError'
    this.dataAccessCode = dataAccessCode
    this.retryable = RETRYABLE_CODES.has(dataAccessCode)
    this.status = status
    this.sourceCode = originalSourceCode
  }
}

export function normalizeDataAccessError(error, { stage = 'data-access', userMessage = null } = {}) {
  if (error instanceof DataAccessError) return error

  const dataAccessCode = classifyDataAccessError(error)
  const status = numericStatus(error)
  const originalSourceCode = sourceCode(error)
  const originalMessage = messageOf(error) || 'Data access operation failed.'

  return new DataAccessError(originalMessage, {
    dataAccessCode,
    stage,
    cause: error,
    userMessage,
    status,
    sourceCode: originalSourceCode,
  })
}
