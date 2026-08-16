import { describe, expect, it } from 'vitest'
import {
  classifySeasonImportRows,
  normalizeSeasonImportRow,
  validateSeasonImportRows,
} from '../../src/modules/calendar/seasonCalendarImportModel.js'

describe('seasonCalendarImportModel', () => {
  it('normalizza valori legacy e applica default sicuri', () => {
    expect(normalizeSeasonImportRow({
      match_day: 3,
      date: '2026-09-13',
      opponent: '  Ravenna  ',
      home_away: 'AWAY',
      competition: 'Coppa',
    }, 2)).toEqual({
      sourceRow: 3,
      matchDay: '3',
      date: '2026-09-13',
      time: '15:30',
      opponent: 'Ravenna',
      homeAway: 'away',
      competition: 'Coppa',
      location: '',
    })
  })

  it('ricade su valori canonici per homeAway e competition sconosciuti', () => {
    const row = normalizeSeasonImportRow({ homeAway: '???', competition: 'Torneo' })
    expect(row.homeAway).toBe('home')
    expect(row.competition).toBe('Campionato')
  })

  it('segnala data, ora e avversario non validi', () => {
    const result = validateSeasonImportRows([{ date: '13/09/2026', time: '9', opponent: '' }])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual([
      'Riga 1: data non valida.',
      'Riga 1: ora non valida.',
      'Riga 1: avversario mancante.',
    ])
  })

  it('classifica duplicati solo tra eventi partita con stessa data e avversario', () => {
    const rows = [
      normalizeSeasonImportRow({ date: '2026-09-13', opponent: 'Ravenna' }),
      normalizeSeasonImportRow({ date: '2026-09-20', opponent: 'Forlì' }),
    ]
    const result = classifySeasonImportRows(rows, [
      { id: 'match-1', type: 'match', startAt: '2026-09-13T15:30:00+02:00', opponent: ' ravenna ' },
      { id: 'training-1', type: 'training', startAt: '2026-09-20T15:30:00+02:00', opponent: 'Forlì' },
    ])

    expect(result[0].importStatus).toBe('duplicate')
    expect(result[0].existingEventId).toBe('match-1')
    expect(result[1].importStatus).toBe('new')
    expect(result[1].existingEventId).toBeNull()
  })
})
