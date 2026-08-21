import { downloadPrivateDocument, removePrivateDocument, uploadPrivateDocument } from '../../core/storage/teamStorage.js'

const BUCKET = 'training-sheets'

export async function uploadTrainingSheetPdf(path, blob) {
  return uploadPrivateDocument({
    bucket: BUCKET,
    path,
    blob,
    contentType: 'application/pdf',
    cacheControl: '3600',
  })
}

export async function removeTrainingSheetPdf(path, options = {}) {
  return removePrivateDocument({
    bucket: BUCKET,
    path,
    silent: options.silent !== false,
  })
}

export async function downloadTrainingSheetPdf(path) {
  return downloadPrivateDocument({ bucket: BUCKET, path })
}
