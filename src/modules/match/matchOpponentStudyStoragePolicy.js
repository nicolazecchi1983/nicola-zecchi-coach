export const MATCH_STUDY_BUCKET = 'training-sheets'
export const MATCH_STUDY_LEGACY_BUCKET = MATCH_STUDY_BUCKET
export const MATCH_STUDY_DOCUMENT_BUCKET = 'match-study-documents'
export const MATCH_STUDY_VIDEO_BUCKET = 'match-study-videos'

const MATCH_STUDY_BUCKETS = new Set([
  MATCH_STUDY_LEGACY_BUCKET,
  MATCH_STUDY_DOCUMENT_BUCKET,
  MATCH_STUDY_VIDEO_BUCKET,
])

export function resolveMatchStudyBucket(kind = 'document') {
  return kind === 'video' ? MATCH_STUDY_VIDEO_BUCKET : MATCH_STUDY_DOCUMENT_BUCKET
}

export function requireMatchStudyBucket(bucket) {
  const normalized = String(bucket || MATCH_STUDY_LEGACY_BUCKET).trim()
  if (!MATCH_STUDY_BUCKETS.has(normalized)) {
    throw new Error('Match study storage bucket not allowed.')
  }
  return normalized
}
