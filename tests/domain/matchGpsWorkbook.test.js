import { describe, expect, it, vi } from 'vitest'
import {
  MATCH_GPS_MAX_FILE_BYTES,
  readMatchGpsWorkbook,
  validateMatchGpsWorkbookFile,
} from '../../src/modules/match/matchGpsWorkbook.js'

const compatibleRows = [[
  '', 'Cognome/ nome', 'Data di nascita', 'CARDIO RIP.', 'CARDIO MAX.',
  'VEL MAX m/s', 'Dist. Max vel. KM', 'VEL media', 'ACC m/s2', 'n. ACC', 'n. DECELL', 'KM',
]]

function file(name = 'gara.xlsx', size = 128) {
  return { name, size, arrayBuffer: vi.fn(async () => new ArrayBuffer(8)) }
}

describe('matchGpsWorkbook', () => {
  it('accetta solo file .xlsx entro 5 MB', () => {
    expect(validateMatchGpsWorkbookFile(file())).toBe(true)
    try {
      validateMatchGpsWorkbookFile(file('gara.xls'))
    } catch (error) {
      expect(error.userMessage).toContain('formato .xlsx')
    }
    try {
      validateMatchGpsWorkbookFile(file('gara.xlsx', MATCH_GPS_MAX_FILE_BYTES + 1))
    } catch (error) {
      expect(error.userMessage).toContain('5 MB')
    }
  })

  it('seleziona il primo foglio con intestazioni GPS compatibili', async () => {
    const sourceFile = file()
    const sheetToJson = vi.fn((sheet) => sheet.rows)
    const loadXlsxModule = async () => ({
      read: () => ({ SheetNames: ['Note', 'Foglio1'], Sheets: { Note: { rows: [['testo']] }, Foglio1: { rows: compatibleRows } } }),
      utils: { sheet_to_json: sheetToJson },
    })
    const result = await readMatchGpsWorkbook(sourceFile, { loadXlsxModule })
    expect(result).toMatchObject({ fileName: 'gara.xlsx', sheetName: 'Foglio1', matrix: compatibleRows })
    expect(sourceFile.arrayBuffer).toHaveBeenCalledOnce()
  })

  it('rifiuta workbook senza un foglio GPS riconoscibile', async () => {
    const loadXlsxModule = async () => ({
      read: () => ({ SheetNames: ['Note'], Sheets: { Note: {} } }),
      utils: { sheet_to_json: () => [['testo']] },
    })
    await expect(readMatchGpsWorkbook(file(), { loadXlsxModule })).rejects.toMatchObject({
      userMessage: expect.stringContaining('intestazioni GPS previste'),
    })
  })
})
