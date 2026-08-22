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
  publishRecovery = null,
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
      userMessage: 'Non è stato possibile generare il PDF. Verifica la connessione e l’anteprima, poi riprova.',
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
  try {
    publishRecovery?.begin?.({ filePath, previousPath: existingEvent?.trainingSheetPath || '', eventId: existingEvent?.id || '' })
  } catch (error) {
    throw new AppError('Recovery journal Training Sheet non disponibile.', {
      code: 'TRAINING_PUBLISH_RECOVERY_UNAVAILABLE',
      stage: 'recovery',
      cause: error,
      userMessage: 'STAFF non può garantire il recupero sicuro della pubblicazione. Ricarica la pagina e riprova.',
    })
  }

  try {
    await uploadTrainingSheetPdf(filePath, blob)
  } catch (error) {
    try { publishRecovery?.clear?.() } catch (_) {}
    throw error
  }

  const data = publishTrainingSheetData(draftData)
  const payload = buildTrainingSheetEventPayload({ data, filePath, squadTotal })
  let savedEvent
  const warnings = []
  try {
    savedEvent = existingEvent
      ? await updateEvent(existingEvent.id, payload)
      : await createEvent(payload)
  } catch (error) {
    let cleanupConfirmed = false
    try {
      cleanupConfirmed = await removeTrainingSheetPdf(filePath)
      if (cleanupConfirmed) {
        try { publishRecovery?.clear?.() } catch (_) {}
      }
    } catch (cleanupError) {
      console.error('Cleanup PDF dopo publish fallita non riuscito:', cleanupError)
    }
    throw new AppError(`Collegamento al calendario non riuscito: ${error?.message || 'errore sconosciuto'}`, {
      code: 'TRAINING_EVENT_SAVE_FAILED',
      stage: 'calendar',
      cause: error,
      userMessage: cleanupConfirmed
        ? 'Il PDF è stato generato, ma non è stato possibile collegarlo al Calendario. Il nuovo file è stato annullato e il documento precedente è rimasto invariato.'
        : 'Il collegamento al Calendario non è riuscito. Il documento precedente è rimasto invariato; STAFF riproverà automaticamente a pulire il nuovo PDF non collegato alla prossima apertura.',
    })
  }
  const previousPath = existingEvent?.trainingSheetPath || null
  let previousCleanupPending = false
  if (previousPath && previousPath !== filePath) {
    try {
      const removed = await removeTrainingSheetPdf(previousPath)
      if (!removed) {
        previousCleanupPending = true
        warnings.push({
          code: 'TRAINING_PREVIOUS_PDF_CLEANUP_FAILED',
          message: 'Training Sheet pubblicata; una versione PDF precedente non è stata eliminata automaticamente e verrà ritentata alla prossima apertura.',
        })
      }
    } catch (error) {
      previousCleanupPending = true
      console.error('Cleanup PDF Training precedente non riuscito:', error)
      warnings.push({
        code: 'TRAINING_PREVIOUS_PDF_CLEANUP_FAILED',
        message: 'Training Sheet pubblicata; non è stato possibile eliminare una versione PDF precedente e STAFF riproverà alla prossima apertura.',
      })
    }
  }

  if (!previousCleanupPending) {
    try { publishRecovery?.clear?.() } catch (error) {
      warnings.push({
        code: 'TRAINING_RECOVERY_JOURNAL_CLEAR_FAILED',
        message: 'Training Sheet pubblicata; il controllo di recovery verrà riconciliato alla prossima apertura.',
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
      userMessage: 'Non è stato possibile generare il PDF. Verifica la connessione e l’anteprima, poi riprova.',
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

export async function cleanupPublishedTrainingSheetPdf(filePath) {
  return removeTrainingSheetPdf(filePath)
}
