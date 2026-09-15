import { AppError } from '../../core/appError.js'
import { findMatchGpsHeader } from './matchGpsModel.js'

export const MATCH_GPS_MAX_FILE_BYTES = 5 * 1024 * 1024

function workbookError(message, code, userMessage = message) {
  return new AppError(message, { code, stage: 'match-gps-parse', userMessage })
}

export function validateMatchGpsWorkbookFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw workbookError('File Excel mancante.', 'MATCH_GPS_FILE_MISSING', 'Seleziona il file Excel GPS della partita.')
  }
  const name = String(file.name || '').trim()
  if (!/\.xlsx$/i.test(name)) {
    throw workbookError('Formato Excel non supportato.', 'MATCH_GPS_FILE_TYPE', 'Il file GPS deve essere in formato .xlsx.')
  }
  if (Number(file.size || 0) > MATCH_GPS_MAX_FILE_BYTES) {
    throw workbookError('File Excel troppo grande.', 'MATCH_GPS_FILE_TOO_LARGE', 'Il file GPS supera il limite di 5 MB.')
  }
  return true
}

async function defaultXlsxLoader() {
  return import('xlsx')
}

export async function readMatchGpsWorkbook(file, { loadXlsxModule = defaultXlsxLoader } = {}) {
  validateMatchGpsWorkbookFile(file)
  const bytes = await file.arrayBuffer()
  const XLSX = await loadXlsxModule()
  const workbook = XLSX.read(bytes, { cellDates: true, dense: true })
  const sheetNames = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames : []

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets?.[sheetName]
    if (!sheet) continue
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    })
    try {
      findMatchGpsHeader(matrix)
      return {
        fileName: String(file.name || 'dati-gps.xlsx'),
        sheetName: String(sheetName),
        matrix,
      }
    } catch (error) {
      if (error?.code !== 'MATCH_GPS_HEADER_NOT_FOUND') throw error
    }
  }

  throw workbookError(
    'Nessun foglio GPS compatibile.',
    'MATCH_GPS_SHEET_NOT_FOUND',
    'Il file non contiene un foglio con le intestazioni GPS previste.',
  )
}
