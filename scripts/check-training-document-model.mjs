import assert from 'node:assert/strict'
import {
  TRAINING_SHEET_STATUS,
  buildTrainingSheetStoragePath,
  canTransitionTrainingSheetStatus,
  inspectTrainingSheetForPublish,
  normalizeTrainingSheetData,
  publishTrainingSheetData,
  transitionTrainingSheetStatus,
  validateTrainingSheetForPublish,
} from '../src/modules/training/trainingSheetModel.js'

const normalized = normalizeTrainingSheetData({ progressive: 0, present: -3 })
assert.equal(normalized.progressive, 1)
assert.equal(normalized.present, 0)
assert.equal(normalized.status, TRAINING_SHEET_STATUS.DRAFT)
assert.equal(normalized.published_at, null)
assert.equal(normalized.archived_at, null)

const legacyArchived = normalizeTrainingSheetData({
  status: 'archived',
  published_at: '2026-08-06T10:00:00.000Z',
  archived_at: '2026-08-07T10:00:00.000Z',
})
assert.equal(legacyArchived.status, TRAINING_SHEET_STATUS.PUBLISHED)
assert.equal(legacyArchived.published_at, '2026-08-06T10:00:00.000Z')
assert.equal(legacyArchived.archived_at, '2026-08-07T10:00:00.000Z')

const incomplete = inspectTrainingSheetForPublish({})
assert.equal(incomplete.valid, false)
assert.deepEqual(incomplete.errors.map((issue) => issue.field), ['date', 'time', 'location'])
assert.ok(incomplete.warnings.some((issue) => issue.field === 'objective'))
assert.throws(() => validateTrainingSheetForPublish({}), /Completa data, orario, campo/)

const publishable = inspectTrainingSheetForPublish({
  date: '2026-08-06',
  time: '17:30',
  location: 'Mezzolara',
})
assert.equal(publishable.valid, true)
assert.doesNotThrow(() => validateTrainingSheetForPublish({
  date: '2026-08-06',
  time: '17:30',
  location: 'Mezzolara',
}))

assert.equal(canTransitionTrainingSheetStatus('draft', 'published'), true)
assert.equal(canTransitionTrainingSheetStatus('published', 'draft'), false)
assert.equal(canTransitionTrainingSheetStatus('published', 'published'), false)

const published = transitionTrainingSheetStatus({ status: 'draft' }, 'published', '2026-08-06T10:00:00.000Z')
assert.equal(published.status, TRAINING_SHEET_STATUS.PUBLISHED)
assert.equal(published.published_at, '2026-08-06T10:00:00.000Z')

const republished = publishTrainingSheetData(published, '2026-08-08T10:00:00.000Z')
assert.equal(republished.status, TRAINING_SHEET_STATUS.PUBLISHED)
assert.equal(republished.published_at, '2026-08-06T10:00:00.000Z')
assert.equal(republished.updated_at, '2026-08-08T10:00:00.000Z')

const republishedLegacy = publishTrainingSheetData(legacyArchived, '2026-08-09T10:00:00.000Z')
assert.equal(republishedLegacy.status, TRAINING_SHEET_STATUS.PUBLISHED)
assert.equal(republishedLegacy.updated_at, '2026-08-09T10:00:00.000Z')

const storagePathWithoutRemoteTeamId = buildTrainingSheetStoragePath({
  teamId: null,
  teamName: 'Mezzolara',
  season: '2026/27',
  date: '2026-08-06',
  fileName: 'ALL_001 - 06082026.pdf',
})
assert.match(storagePathWithoutRemoteTeamId, /^mezzolara\/2026-27\/2026-08-06\//)
assert.match(storagePathWithoutRemoteTeamId, /ALL_001 - 06082026\.pdf$/)

console.log('TRAINING DOCUMENT MODEL CHECK: OK')
