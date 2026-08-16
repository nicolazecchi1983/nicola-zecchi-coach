import { describe, expect, it } from 'vitest'
import { AppError } from '../../src/core/appError.js'
import { getDataAccessUserMessage } from '../../src/infrastructure/dataAccess/dataAccessUserFeedback.js'

describe('data access user feedback', () => {
  it('normalizza errori di rete raw in un messaggio coerente', () => {
    expect(getDataAccessUserMessage(new TypeError('Failed to fetch')))
      .toBe('Connessione non disponibile. Controlla la rete e riprova.')
  })

  it('normalizza timeout e indisponibilità server', () => {
    expect(getDataAccessUserMessage({ code: 'ETIMEDOUT', message: 'request timed out' }))
      .toBe('La richiesta sta impiegando troppo tempo. Riprova tra poco.')
    expect(getDataAccessUserMessage({ status: 503, message: 'Service unavailable' }))
      .toBe('Servizio temporaneamente non disponibile. Riprova tra poco.')
  })

  it('mantiene il messaggio applicativo esplicito quando già presente', () => {
    const error = new AppError('internal', { userMessage: 'Messaggio specifico.' })
    expect(getDataAccessUserMessage(error, 'Fallback')).toBe('Messaggio specifico.')
  })

  it('usa il fallback per errori sconosciuti privi di messaggio utile', () => {
    expect(getDataAccessUserMessage(null, 'Fallback controllato.')).toBe('Fallback controllato.')
  })

  it('risolve il fallback canonico dallo stage quando il chiamante non lo duplica', () => {
    expect(getDataAccessUserMessage(null, undefined, { stage: 'match-create' }))
      .toBe('Creazione partita non riuscita.')
    expect(getDataAccessUserMessage(null, undefined, { stage: 'training-publish' }))
      .toBe('Pubblicazione non riuscita. Il documento precedente è rimasto invariato.')
  })

  it('mantiene il fallback esplicito per compatibilità legacy', () => {
    expect(getDataAccessUserMessage(null, 'Fallback legacy.', { stage: 'match-create' }))
      .toBe('Fallback legacy.')
  })
})
