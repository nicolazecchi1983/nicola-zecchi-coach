import { normalizeDataAccessError } from './dataAccessError.js'
import {
  DATA_OPERATION_KIND,
  canAutomaticallyRetryDataOperation,
  getDataOperationPolicy,
} from './dataOperationPolicy.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function extractOperationError(result) {
  return result && typeof result === 'object' && 'error' in result ? result.error : null
}

/**
 * Retry a data-access operation only when the operation policy explicitly allows it.
 * The helper preserves Supabase response semantics: if an operation resolves with
 * { error }, the final response is returned unchanged after retries are exhausted.
 * Thrown errors are re-thrown after the allowed retry budget is exhausted.
 */
export async function withDataAccessRetry(operation, {
  kind = DATA_OPERATION_KIND.READ,
  stage = 'data-access',
  maxRetries = null,
  baseDelayMs = 250,
  sleepFn = sleep,
  onRetry = null,
} = {}) {
  if (typeof operation !== 'function') throw new TypeError('operation deve essere una funzione.')

  const policy = getDataOperationPolicy(kind)
  const retryBudget = policy.automaticRetry
    ? Math.max(0, Number.isFinite(maxRetries) ? Number(maxRetries) : policy.maxRetries)
    : 0

  let attempt = 0

  while (true) {
    try {
      const result = await operation({ attempt })
      const error = extractOperationError(result)

      if (!error) return result

      const normalized = normalizeDataAccessError(error, { stage })
      const canRetry = attempt < retryBudget && canAutomaticallyRetryDataOperation({ kind, error: normalized })
      if (!canRetry) return result

      const delayMs = baseDelayMs * (2 ** attempt)
      onRetry?.({ attempt: attempt + 1, delayMs, error: normalized, kind, stage })
      await sleepFn(delayMs)
      attempt += 1
    } catch (error) {
      const normalized = normalizeDataAccessError(error, { stage })
      const canRetry = attempt < retryBudget && canAutomaticallyRetryDataOperation({ kind, error: normalized })
      if (!canRetry) throw error

      const delayMs = baseDelayMs * (2 ** attempt)
      onRetry?.({ attempt: attempt + 1, delayMs, error: normalized, kind, stage })
      await sleepFn(delayMs)
      attempt += 1
    }
  }
}
