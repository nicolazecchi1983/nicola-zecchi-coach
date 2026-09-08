import { createSignedFileUrl, removeFiles, uploadFile } from '../../infrastructure/repositories/fileStorageRepository.js'
import {
  requireMatchStudyBucket,
} from './matchOpponentStudyStoragePolicy.js'

// Bucket privato già operativo nel progetto. Gli asset Match sono isolati dal path "match-study/".
// Il contratto del dominio non dipende dal nome fisico del bucket e potrà essere migrato in futuro.
export {
  MATCH_STUDY_BUCKET,
  MATCH_STUDY_LEGACY_BUCKET,
  MATCH_STUDY_DOCUMENT_BUCKET,
  MATCH_STUDY_VIDEO_BUCKET,
  resolveMatchStudyBucket,
} from './matchOpponentStudyStoragePolicy.js'

export function createMatchOpponentStudyAssetRepository() {
  return {
    async upload(bucket, path, file) {
      return uploadFile(requireMatchStudyBucket(bucket), path, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      })
    },
    async remove(bucket, path) {
      return removeFiles(requireMatchStudyBucket(bucket), path)
    },
    async signedUrl(bucket, path, expiresIn = 3600) {
      return createSignedFileUrl(requireMatchStudyBucket(bucket), path, expiresIn)
    },
  }
}
