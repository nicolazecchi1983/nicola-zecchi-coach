import { describe, expect, it, vi } from 'vitest'
import { withDataAccessRetry } from '../../src/infrastructure/dataAccess/withDataAccessRetry.js'
import { DATA_OPERATION_KIND } from '../../src/infrastructure/dataAccess/dataOperationPolicy.js'

describe('withDataAccessRetry', () => {
  it('retries a retryable READ response and preserves the final Supabase response shape', async () => {
    const sleepFn = vi.fn(async () => {})
    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch', status: 0 } })
      .mockResolvedValueOnce({ data: [{ id: 1 }], error: null })

    const result = await withDataAccessRetry(operation, {
      kind: DATA_OPERATION_KIND.READ,
      stage: 'test-read',
      sleepFn,
    })

    expect(result).toEqual({ data: [{ id: 1 }], error: null })
    expect(operation).toHaveBeenCalledTimes(2)
    expect(sleepFn).toHaveBeenCalledWith(250)
  })

  it('uses exponential backoff for the default two READ retries', async () => {
    const delays = []
    let attempts = 0

    const result = await withDataAccessRetry(async () => {
      attempts += 1
      if (attempts < 3) return { data: null, error: { message: 'timeout', status: 504 } }
      return { data: 'ok', error: null }
    }, {
      kind: DATA_OPERATION_KIND.READ,
      sleepFn: async (ms) => { delays.push(ms) },
    })

    expect(result.data).toBe('ok')
    expect(attempts).toBe(3)
    expect(delays).toEqual([250, 500])
  })

  it('does not retry a non-retryable validation error', async () => {
    const operation = vi.fn(async () => ({ data: null, error: { message: 'bad input', status: 400 } }))

    const result = await withDataAccessRetry(operation, {
      kind: DATA_OPERATION_KIND.READ,
      sleepFn: async () => {},
    })

    expect(result.error.status).toBe(400)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('does not retry CREATE operations even for a network error', async () => {
    const operation = vi.fn(async () => ({ data: null, error: { message: 'Failed to fetch', status: 0 } }))

    await withDataAccessRetry(operation, {
      kind: DATA_OPERATION_KIND.CREATE,
      sleepFn: async () => {},
    })

    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries thrown network errors for READ and rethrows the original error when exhausted', async () => {
    const original = Object.assign(new Error('network error'), { status: 0 })
    const operation = vi.fn(async () => { throw original })

    await expect(withDataAccessRetry(operation, {
      kind: DATA_OPERATION_KIND.READ,
      maxRetries: 1,
      sleepFn: async () => {},
    })).rejects.toBe(original)

    expect(operation).toHaveBeenCalledTimes(2)
  })
})

describe('IDEMPOTENT_WRITE retry policy', () => {
  it('retries a retryable idempotent write while preserving response semantics', async () => {
    const sleepFn = vi.fn(async () => {})
    const operation = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch', status: 0 } })
      .mockResolvedValueOnce({ data: { id: 'p1', active: true }, error: null })

    const result = await withDataAccessRetry(operation, {
      kind: DATA_OPERATION_KIND.IDEMPOTENT_WRITE,
      stage: 'test-idempotent-write',
      sleepFn,
    })

    expect(result).toEqual({ data: { id: 'p1', active: true }, error: null })
    expect(operation).toHaveBeenCalledTimes(2)
    expect(sleepFn).toHaveBeenCalledWith(250)
  })

  it('does not retry DELETE or BATCH even when the error is network-related', async () => {
    for (const kind of [DATA_OPERATION_KIND.DELETE, DATA_OPERATION_KIND.BATCH]) {
      const operation = vi.fn(async () => ({ data: null, error: { message: 'Failed to fetch', status: 0 } }))
      await withDataAccessRetry(operation, { kind, sleepFn: async () => {} })
      expect(operation).toHaveBeenCalledTimes(1)
    }
  })
})
