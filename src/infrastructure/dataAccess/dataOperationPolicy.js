import { isRetryableDataAccessError } from './dataAccessError.js'

export const DATA_OPERATION_KIND = Object.freeze({
  READ: 'read',
  IDEMPOTENT_WRITE: 'idempotent-write',
  CREATE: 'create',
  DELETE: 'delete',
  BATCH: 'batch',
})

const POLICIES = Object.freeze({
  [DATA_OPERATION_KIND.READ]: Object.freeze({ automaticRetry: true, maxRetries: 2, requiresIdempotencyKey: false }),
  [DATA_OPERATION_KIND.IDEMPOTENT_WRITE]: Object.freeze({ automaticRetry: true, maxRetries: 2, requiresIdempotencyKey: false }),
  [DATA_OPERATION_KIND.CREATE]: Object.freeze({ automaticRetry: false, maxRetries: 0, requiresIdempotencyKey: true }),
  [DATA_OPERATION_KIND.DELETE]: Object.freeze({ automaticRetry: false, maxRetries: 0, requiresIdempotencyKey: false }),
  [DATA_OPERATION_KIND.BATCH]: Object.freeze({ automaticRetry: false, maxRetries: 0, requiresIdempotencyKey: false }),
})

export function getDataOperationPolicy(kind) {
  return POLICIES[kind] || Object.freeze({ automaticRetry: false, maxRetries: 0, requiresIdempotencyKey: false })
}

export function canAutomaticallyRetryDataOperation({ kind, error, idempotencyKey = null } = {}) {
  if (!isRetryableDataAccessError(error)) return false

  const policy = getDataOperationPolicy(kind)
  if (policy.automaticRetry) return true

  // CREATE remains opt-in only: an explicit idempotency key makes the operation
  // eligible for a future retry implementation, but does not activate retries here.
  if (kind === DATA_OPERATION_KIND.CREATE && policy.requiresIdempotencyKey && idempotencyKey) return false

  return false
}

export function describeDataOperationSafety(kind) {
  const policy = getDataOperationPolicy(kind)
  return {
    kind,
    automaticRetry: policy.automaticRetry,
    maxRetries: policy.maxRetries,
    requiresIdempotencyKey: policy.requiresIdempotencyKey,
  }
}
