import { createSignedFileUrl, removeFiles, uploadFile } from '../../infrastructure/repositories/fileStorageRepository.js'

// Bucket privato già operativo nel progetto. Gli asset Match sono isolati dal path "match-study/".
// Il contratto del dominio non dipende dal nome fisico del bucket e potrà essere migrato in futuro.
export const MATCH_STUDY_BUCKET = 'training-sheets'

export function createMatchOpponentStudyAssetRepository() {
  return {
    async upload(path, file) {
      return uploadFile(MATCH_STUDY_BUCKET, path, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      })
    },
    async remove(path) {
      return removeFiles(MATCH_STUDY_BUCKET, path)
    },
    async signedUrl(path, expiresIn = 3600) {
      return createSignedFileUrl(MATCH_STUDY_BUCKET, path, expiresIn)
    },
  }
}
