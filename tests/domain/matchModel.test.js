import { describe, expect, it } from 'vitest'
import {
  inspectMatchDocument,
  normalizeMatchDocument,
  normalizeMatchHomeAway,
  parseScore,
  resolveMatchLocation,
} from '../../src/modules/match/matchModel.js'

describe('matchModel', () => {
  it('normalizza il risultato nei formati supportati', () => {
    expect(parseScore(' 2 : 1 ')).toEqual({ home: '2', away: '1', display: '2-1' })
    expect(parseScore('120-7')).toEqual({ home: '', away: '', display: '120-7' })
    expect(parseScore('')).toEqual({ home: '', away: '', display: '' })
  })

  it('normalizza casa/trasferta/campo neutro mantenendo compatibilità italiana', () => {
    expect(normalizeMatchHomeAway('Trasferta')).toBe('away')
    expect(normalizeMatchHomeAway('Campo neutro')).toBe('neutral')
    expect(normalizeMatchHomeAway('away')).toBe('away')
    expect(normalizeMatchHomeAway('sconosciuto')).toBe('home')
  })

  it('non confonde il legacy venue Casa/Trasferta con un impianto reale', () => {
    expect(resolveMatchLocation({ venue: 'Casa' })).toBe('')
    expect(resolveMatchLocation({ venue: 'Stadio Comunale' })).toBe('Stadio Comunale')
    expect(resolveMatchLocation({ location: 'Campo 1', venue: 'Casa' })).toBe('Campo 1')
  })

  it('mantiene competitionRound separato e prioritario rispetto ai campi legacy', () => {
    const data = normalizeMatchDocument({
      date: '2026-09-13',
      opponent: 'Ravenna',
      competitionRound: '3',
      matchDay: 'MD-4',
    })
    expect(data.round).toBe('3')
  })

  it('considera bloccanti data e avversario, ma solo warning ora e impianto', () => {
    const invalid = inspectMatchDocument({ date: '', opponent: 'Da definire' })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map(({ code }) => code)).toEqual([
      'MATCH_DATE_REQUIRED',
      'MATCH_OPPONENT_REQUIRED',
    ])

    const valid = inspectMatchDocument({ date: '2026-09-13', opponent: 'Ravenna' })
    expect(valid.valid).toBe(true)
    expect(valid.warnings.map(({ code }) => code)).toEqual([
      'MATCH_TIME_MISSING',
      'MATCH_LOCATION_MISSING',
    ])
  })
})
