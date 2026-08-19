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
import { removeTrainingSheetPdf, uploadTrainingSheetPdf } from './trainingSheetRepository.js'
import { requireTrainingSheetPublishPermission } from './trainingSheetPermissions.js'

export async function publishTrainingSheet({
  rawData,
  previewElement,
  team,
  squadTotal,
  existingEvent,
  duplicateEvents = [],
  confirmPreview = null,
  downloadLocal = false,
  createEvent,
  updateEvent,
  deleteEvent,
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
  try {
    const pendingDeletionEventIds = duplicateEvents
      .map((event) => event?.id)
      .filter(Boolean)

    savedEvent = existingEvent
      ? await updateEvent(existingEvent.id, payload, { pendingDeletionEventIds })
      : await createEvent(payload)
  } catch (error) {
    await removeTrainingSheetPdf(filePath)
    throw new AppError(`Collegamento al calendario non riuscito: ${error?.message || 'errore sconosciuto'}`, {
      code: 'TRAINING_EVENT_SAVE_FAILED',
      stage: 'calendar',
      cause: error,
      userMessage: 'Il PDF è stato generato, ma non è stato possibile collegarlo al Calendario. Il nuovo file è stato annullato e il documento precedente è rimasto invariato.',
    })
  }

  const previousPath = existingEvent?.trainingSheetPath || null
  if (previousPath && previousPath !== filePath) {
    await removeTrainingSheetPdf(previousPath)
  }

  const warnings = []

  if (duplicateEvents.length) {
    if (typeof deleteEvent !== 'function') {
      warnings.push({
        code: 'TRAINING_DUPLICATE_CLEANUP_UNAVAILABLE',
        message: 'La Training Sheet è pubblicata, ma STAFF non ha potuto consolidare un vecchio evento duplicato.',
      })
    } else {
      for (const duplicateEvent of duplicateEvents) {
        if (!duplicateEvent?.id || String(duplicateEvent.id) === String(existingEvent?.id || savedEvent?.id || '')) continue

        try {
          await deleteEvent(duplicateEvent.id)
          const duplicatePath = duplicateEvent.trainingSheetPath || duplicateEvent.training_sheet_path || null
          if (duplicatePath && duplicatePath !== filePath) {
            await removeTrainingSheetPdf(duplicatePath)
          }
        } catch (error) {
          console.error('Consolidamento evento Training duplicato non riuscito:', error)
          warnings.push({
            code: 'TRAINING_DUPLICATE_CLEANUP_FAILED',
            eventId: duplicateEvent.id,
            message: `Training Sheet pubblicata; impossibile consolidare l'evento duplicato ${duplicateEvent.id}.`,
          })
        }
      }
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
