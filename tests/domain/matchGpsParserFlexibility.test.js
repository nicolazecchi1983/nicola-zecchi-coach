import { describe, expect, it } from 'vitest'
import {
  findMatchGpsHeader,
  parseMatchGpsWorksheetRows,
} from '../../src/modules/match/matchGpsModel.js'

describe('Match GPS flexible parser R32', () => {
  it('accepts a partial GPS format without birth date or ordinal column', () => {
    const matrix = [
      ['Cognome/ nome', 'KM', 'Vendor Player Load', 'minuti giocati'],
      ['Musiani Manuel', '10,50', 321, 90],
    ]

    const parsed = parseMatchGpsWorksheetRows(matrix)

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]).toMatchObject({
      sourceOrdinal: null,
      sourcePlayerName: 'Musiani Manuel',
      sourceBirthDate: null,
      minutesPlayed: 90,
      included: true,
      metrics: {
        distanceKm: 10.5,
      },
    })
  })

  it('preserves unknown vendor columns without promoting them to canonical metrics', () => {
    const matrix = [
      ['Cognome/ nome', 'KM', 'Vendor Player Load'],
      ['Musiani Manuel', 11.98, 456],
    ]

    const parsed = parseMatchGpsWorksheetRows(matrix)
    const row = parsed.rows[0]

    expect(row.sourceValues).toMatchObject({
      'Cognome/ nome': 'Musiani Manuel',
      KM: 11.98,
      'Vendor Player Load': 456,
    })

    expect(row.metrics).toEqual({
      distanceKm: 11.98,
    })

    expect(row.metrics).not.toHaveProperty('vendorPlayerLoad')
  })

  it('still preserves the legacy numbered format and optional birth date matching data', () => {
    const matrix = [
      ['', 'Cognome/ nome', 'Data di nascita', 'KM'],
      [1, 'Musiani Manuel', '29/02/00', '11,98'],
    ]

    const parsed = parseMatchGpsWorksheetRows(matrix)

    expect(parsed.rows[0]).toMatchObject({
      sourceOrdinal: 1,
      sourceBirthDate: '2000-02-29',
      sourceBirthYear: 2000,
      metrics: {
        distanceKm: 11.98,
      },
    })

    expect(parsed.rows[0].sourceValues['Colonna 1']).toBe(1)
  })

  it('keeps resting heart rate outside the activity signal even in a reduced format', () => {
    const matrix = [
      ['Cognome/ nome', 'CARDIO RIP.'],
      ['Cipriani Matteo', 58],
    ]

    const parsed = parseMatchGpsWorksheetRows(matrix)

    expect(parsed.rows[0]).toMatchObject({
      metrics: {
        restingHeartRate: 58,
      },
      hasActivityData: false,
      included: false,
      matchStatus: 'excluded',
    })
  })

  it('requires at least one metric known by the STAFF registry', () => {
    const matrix = [
      ['Cognome/ nome', 'Vendor Player Load'],
      ['Musiani Manuel', 456],
    ]

    expect(() => findMatchGpsHeader(matrix))
      .toThrow('Nessuna metrica GPS riconosciuta')
  })

  it('does not treat unknown summary rows as players when ordinal is absent', () => {
    const matrix = [
      ['Cognome/ nome', 'KM', 'Vendor note'],
      ['Musiani Manuel', 11.98, 'ok'],
      ["eta' media squadra anni", null, '22,1'],
    ]

    const parsed = parseMatchGpsWorksheetRows(matrix)

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0].sourcePlayerName).toBe('Musiani Manuel')
  })
})