import { describe, expect, it } from 'vitest'
import {
  DATA_OPERATION_KIND,
  canAutomaticallyRetryDataOperation,
  describeDataOperationSafety,
  getDataOperationPolicy,
} from '../../src/infrastructure/dataAccess/dataOperationPolicy.js'

describe('dataOperationPolicy', () => {
  it('consente retry automatico solo per read e write idempotenti', () => {
    expect(getDataOperationPolicy(DATA_OPERATION_KIND.READ).automaticRetry).toBe(true)
    expect(getDataOperationPolicy(DATA_OPERATION_KIND.IDEMPOTENT_WRITE).automaticRetry).toBe(true)
    expect(getDataOperationPolicy(DATA_OPERATION_KIND.CREATE).automaticRetry).toBe(false)
    expect(getDataOperationPolicy(DATA_OPERATION_KIND.DELETE).automaticRetry).toBe(false)
    expect(getDataOperationPolicy(DATA_OPERATION_KIND.BATCH).automaticRetry).toBe(false)
  })

  it('richiede che anche l’errore sia retryable', () => {
    expect(canAutomaticallyRetryDataOperation({
      kind: DATA_OPERATION_KIND.READ,
      error: { status: 503 },
    })).toBe(true)

    expect(canAutomaticallyRetryDataOperation({
      kind: DATA_OPERATION_KIND.READ,
      error: { status: 403 },
    })).toBe(false)
  })

  it('non abilita implicitamente retry su create anche con idempotency key', () => {
    expect(canAutomaticallyRetryDataOperation({
      kind: DATA_OPERATION_KIND.CREATE,
      error: { status: 503 },
      idempotencyKey: 'match-uuid-1',
    })).toBe(false)
  })

  it('espone una descrizione stabile della safety policy', () => {
    expect(describeDataOperationSafety(DATA_OPERATION_KIND.CREATE)).toEqual({
      kind: DATA_OPERATION_KIND.CREATE,
      automaticRetry: false,
      maxRetries: 0,
      requiresIdempotencyKey: true,
    })
  })
})
