import { describe, expect, it } from 'vitest'
import {
  assignMatchGpsPlayer,
  buildMatchGpsSaveRows,
  matchGpsRowsToRoster,
  normalizeMatchGpsDate,
  parseMatchGpsWorksheetRows,
  summarizeMatchGpsRows,
  validateMatchGpsRows,
} from '../../src/modules/match/matchGpsModel.js'

const headers = [
  '', 'Cognome/ nome', 'Data di nascita', 'CARDIO RIP.', 'CARDIO MAX.',
  'VEL MAX m/s', 'Dist. Max vel. KM', 'VEL media', 'ACC m/s2', 'n. ACC', 'n. DECELL', 'KM',
]

function sourceMatrix() {
  return [
    [],
    ['MEZZOLARA 2026-2027'],
    [],
    headers,
    [],
    [1, 'Cipriani Matteo', '04/11/96', 58, null, null, null, null, null, null, null, null],
    [2, 'Musiani Manuel', '29/02/00', 52, null, '8,85', '1,98', '6,78', '6,82', 291, 245, '11,98'],
    [null, "eta' media squadra anni", '22,1', null, null, null, null, null, null, null, null, null],
  ]
}

describe('matchGpsModel', () => {
  it('trova la riga intestazioni, converte le virgole e ignora le righe riepilogo', () => {
    const parsed = parseMatchGpsWorksheetRows(sourceMatrix())
    expect(parsed.headerRow).toBe(4)
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[1]).toMatchObject({
      sourceRow: 7,
      sourcePlayerName: 'Musiani Manuel',
      sourceBirthDate: '2000-02-29',
      sourceBirthYear: 2000,
      hasActivityData: true,
      included: true,
      metrics: {
        restingHeartRate: 52,
        maxHeartRate: null,
        maxSpeedMs: 8.85,
        distanceMaxSpeedKm: 1.98,
        averageSpeed: 6.78,
        accelerationMs2: 6.82,
        accelerationCount: 291,
        decelerationCount: 245,
        distanceKm: 11.98,
      },
    })
  })

  it('esclude dall’import gara le righe con il solo cardio a riposo senza dedurre la partecipazione', () => {
    const parsed = parseMatchGpsWorksheetRows(sourceMatrix())
    expect(parsed.rows[0]).toMatchObject({ included: false, hasActivityData: false, matchStatus: 'excluded' })
    expect(summarizeMatchGpsRows(parsed.rows)).toEqual({
      sourceRows: 2,
      includedRows: 1,
      excludedRows: 1,
      matchedRows: 0,
      reviewRows: 1,
      invalidRows: 0,
    })
  })

  it('normalizza date italiane a due cifre senza dipendere dal timezone', () => {
    expect(normalizeMatchGpsDate('04/11/96')).toBe('1996-11-04')
    expect(normalizeMatchGpsDate('09/02/08')).toBe('2008-02-09')
    expect(normalizeMatchGpsDate(new Date(2008, 1, 9))).toBe('2008-02-09')
    expect(normalizeMatchGpsDate('31/02/08')).toBeNull()
  })

  it('associa automaticamente solo nome canonico e anno compatibili anche con ordine invertito', () => {
    const rows = parseMatchGpsWorksheetRows(sourceMatrix()).rows
    const matched = matchGpsRowsToRoster(rows, [
      { id: 'player-1', name: 'Matteo Cipriani', year: '1996' },
      { id: 'player-2', name: 'Manuel Musiani', year: '2000' },
    ])
    expect(matched[0].matchStatus).toBe('excluded')
    expect(matched[1]).toMatchObject({ playerId: 'player-2', matchStatus: 'matched' })
  })

  it('associa automaticamente un nome univoco quando l’anno Rosa è vuoto', () => {
    const rows = parseMatchGpsWorksheetRows(sourceMatrix()).rows
    const matched = matchGpsRowsToRoster(rows, [
      { id: 'player-2', name: 'Manuel Musiani', year: '' },
    ])
    expect(matched[1]).toMatchObject({ playerId: 'player-2', matchStatus: 'matched' })
  })
  it('richiede revisione quando il nome coincide ma l’anno è incompatibile', () => {
    const rows = parseMatchGpsWorksheetRows(sourceMatrix()).rows
    const matched = matchGpsRowsToRoster(rows, [{ id: 'player-2', name: 'Manuel Musiani', year: '2001' }])
    expect(matched[1]).toMatchObject({ playerId: null, matchStatus: 'review', candidatePlayerIds: ['player-2'] })
  })

  it('blocca righe non associate, duplicati e valori numerici non validi', () => {
    const matrix = sourceMatrix()
    matrix[6][9] = '291 accelerazioni'
    let rows = matchGpsRowsToRoster(parseMatchGpsWorksheetRows(matrix).rows, [{ id: 'player-2', name: 'Altro Nome', year: '2000' }])
    expect(validateMatchGpsRows(rows, [{ id: 'player-2' }]).valid).toBe(false)

    rows = assignMatchGpsPlayer(rows, 7, 'player-2', [{ id: 'player-2' }])
    expect(() => buildMatchGpsSaveRows(rows, [{ id: 'player-2' }])).toThrow('valori numerici non validi')
  })
})
