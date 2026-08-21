import { AppError, toAppError } from '../../core/appError.js'
import {
  buildTrainingSheetEventPayload,
  buildTrainingSheetFileName,
  buildTrainingSheetStoragePath,
  normalizeTrainingSheetData,
  publishTrainingSheetData,
  validateTrainingSheetForPublish,
} from './trainingSheetModel.js'
import { generateTrainingSheetPdf } from './trainingSheetPdf.js'
import { downloadTrainingSheetPdf, removeTrainingSheetPdf, uploadTrainingSheetPdf } from './trainingSheetRepository.js'
import { requireTrainingSheetPublishPermission } from './trainingSheetPermissions.js'

export async function publishTrainingSheet({
  rawData,
  previewElement,
  team,
  squadTotal,
  existingEvent,
  confirmPreview = null,
  downloadLocal = false,
  createEvent,
  updateEvent,
}) {
  requireTrainingSheetPublishPermission()
  const draftData = normalizeTrainingSheetData(rawData)
  validateTrainingSheetForPublish(draftData)

  const fileName = buildTrainingSheetFileName(draftData)
  let generated
  try {
    generated = await generateTrainingSheetPdf(previewElement)
  } catch (error) {
    throw toAppError(error, {
      code: 'TRAINING_PDF_GENERATION_FAILED',
      stage: 'generation',
      userMessage: 'Non è stato possibile generare il PDF. Controlla l’anteprima e riprova.',
    })
  }

  const { pdf, blob } = generated
  if (typeof confirmPreview === 'function') {
    const confirmed = await confirmPreview(blob, fileName)
    if (!confirmed) return { cancelled: true }
  }

  const filePath = buildTrainingSheetStoragePath({
    teamId: team?.id,
    teamName: team?.shortName || team?.name,
    season: team?.season,
    date: draftData.date,
    fileName,
  })
  await uploadTrainingSheetPdf(filePath, blob)

  const data = publishTrainingSheetData(draftData)
  const payload = buildTrainingSheetEventPayload({ data, filePath, squadTotal })
  let savedEvent
  const warnings = []
  try {
    savedEvent = existingEvent
      ? await updateEvent(existingEvent.id, payload)
      : await createEvent(payload)
  } catch (error) {
    try {
      await removeTrainingSheetPdf(filePath)
    } catch (cleanupError) {
      console.error('Cleanup PDF dopo publish fallita non riuscito:', cleanupError)
    }
    throw new AppError(`Collegamento al calendario non riuscito: ${error?.message || 'errore sconosciuto'}`, {
      code: 'TRAINING_EVENT_SAVE_FAILED',
      stage: 'calendar',
      cause: error,
      userMessage: 'Il PDF è stato generato, ma non è stato possibile collegarlo al Calendario. Il nuovo file è stato annullato e il documento precedente è rimasto invariato.',
    })
  }

  const previousPath = existingEvent?.trainingSheetPath || null
  if (previousPath && previousPath !== filePath) {
    try {
      const removed = await removeTrainingSheetPdf(previousPath)
      if (!removed) {
        warnings.push({
          code: 'TRAINING_PREVIOUS_PDF_CLEANUP_FAILED',
          message: 'Training Sheet pubblicata; una versione PDF precedente non è stata eliminata automaticamente.',
        })
      }
    } catch (error) {
      console.error('Cleanup PDF Training precedente non riuscito:', error)
      warnings.push({
        code: 'TRAINING_PREVIOUS_PDF_CLEANUP_FAILED',
        message: 'Training Sheet pubblicata; non è stato possibile eliminare una versione PDF precedente.',
      })
    }
  }


  if (downloadLocal) {
    try {
      pdf.save(fileName)
    } catch (error) {
      console.error('Download locale Training Sheet non riuscito:', error)
      warnings.push({
        code: 'TRAINING_LOCAL_DOWNLOAD_FAILED',
        message: 'Training Sheet pubblicata; download locale non riuscito.',
      })
    }
  }

  return {
    cancelled: false,
    data,
    fileName,
    filePath,
    event: savedEvent || existingEvent || null,
    warnings,
  }
}


export async function createTrainingSheetPdfOutput({ rawData, previewElement }) {
  const draftData = normalizeTrainingSheetData(rawData)
  validateTrainingSheetForPublish(draftData)
  const fileName = buildTrainingSheetFileName(draftData)
  try {
    const generated = await generateTrainingSheetPdf(previewElement)
    return { ...generated, fileName, data: draftData }
  } catch (error) {
    throw toAppError(error, {
      code: 'TRAINING_PDF_GENERATION_FAILED',
      stage: 'generation',
      userMessage: 'Non è stato possibile generare il PDF. Controlla l’anteprima e riprova.',
    })
  }
}

export async function downloadPublishedTrainingSheetPdf({ filePath, rawData }) {
  if (!filePath) {
    throw new AppError('Training Sheet pubblicata senza percorso PDF.', {
      code: 'TRAINING_PUBLISHED_PDF_PATH_MISSING',
      stage: 'download',
      userMessage: 'Il PDF pubblicato non è disponibile. Riapri la Training Sheet dal Calendario e riprova.',
    })
  }
  const blob = await downloadTrainingSheetPdf(filePath)
  const fileName = rawData ? buildTrainingSheetFileName(normalizeTrainingSheetData(rawData)) : 'training-sheet.pdf'
  return { blob, fileName }
}
