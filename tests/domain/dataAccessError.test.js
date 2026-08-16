import { describe, expect, it } from 'vitest'
import {
  DATA_ACCESS_ERROR_CODES,
  DataAccessError,
  classifyDataAccessError,
  isRetryableDataAccessError,
  normalizeDataAccessError,
} from '../../src/infrastructure/dataAccess/dataAccessError.js'

describe('dataAccessError', () => {
  it('classifica errori di rete e timeout come retryable', () => {
    expect(classifyDataAccessError(new TypeError('Failed to fetch'))).toBe(DATA_ACCESS_ERROR_CODES.NETWORK_UNAVAILABLE)
    expect(classifyDataAccessError({ code: 'ETIMEDOUT', message: 'request timed out' })).toBe(DATA_ACCESS_ERROR_CODES.TIMEOUT)
    expect(isRetryableDataAccessError({ status: 503, message: 'Service unavailable' })).toBe(true)
  })

  it('distingue rate limit e indisponibilità server', () => {
    expect(classifyDataAccessError({ status: 429 })).toBe(DATA_ACCESS_ERROR_CODES.RATE_LIMITED)
    expect(classifyDataAccessError({ status: 502 })).toBe(DATA_ACCESS_ERROR_CODES.SERVER_UNAVAILABLE)
    expect(classifyDataAccessError({ status: 500 })).toBe(DATA_ACCESS_ERROR_CODES.SERVER_UNAVAILABLE)
  })

  it('classifica autenticazione, permessi e not found come non retryable', () => {
    expect(classifyDataAccessError({ status: 401 })).toBe(DATA_ACCESS_ERROR_CODES.AUTH_REQUIRED)
    expect(classifyDataAccessError({ status: 403 })).toBe(DATA_ACCESS_ERROR_CODES.PERMISSION_DENIED)
    expect(classifyDataAccessError({ code: 'PGRST116' })).toBe(DATA_ACCESS_ERROR_CODES.NOT_FOUND)
    expect(isRetryableDataAccessError({ status: 403 })).toBe(false)
  })

  it('classifica i principali errori PostgreSQL di conflitto e validazione', () => {
    expect(classifyDataAccessError({ code: '23505' })).toBe(DATA_ACCESS_ERROR_CODES.CONFLICT)
    expect(classifyDataAccessError({ code: '23514' })).toBe(DATA_ACCESS_ERROR_CODES.VALIDATION)
    expect(classifyDataAccessError({ code: '23503' })).toBe(DATA_ACCESS_ERROR_CODES.VALIDATION)
  })

  it('normalizza in DataAccessError senza perdere causa, status e codice sorgente', () => {
    const source = Object.assign(new Error('duplicate key'), { code: '23505', status: 409 })
    const normalized = normalizeDataAccessError(source, { stage: 'save-match' })

    expect(normalized).toBeInstanceOf(DataAccessError)
    expect(normalized.dataAccessCode).toBe(DATA_ACCESS_ERROR_CODES.CONFLICT)
    expect(normalized.retryable).toBe(false)
    expect(normalized.stage).toBe('save-match')
    expect(normalized.status).toBe(409)
    expect(normalized.sourceCode).toBe('23505')
    expect(normalized.cause).toBe(source)
  })

  it('preserva un DataAccessError già normalizzato', () => {
    const source = normalizeDataAccessError(new TypeError('Failed to fetch'))
    expect(normalizeDataAccessError(source)).toBe(source)
  })
})
