import { inspectMatchDocument } from './matchModel.js'

export function validateMatchCore(data = {}) {
  const result = inspectMatchDocument(data)
  return {
    valid: result.valid,
    errors: result.errors.map((issue) => issue.message),
  }
}
