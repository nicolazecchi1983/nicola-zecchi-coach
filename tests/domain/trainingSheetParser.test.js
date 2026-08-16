import { describe, expect, it } from 'vitest'
import { parseTrainingSheetNarration } from '../../src/services/trainingSheetParser.js'

describe('trainingSheetParser', () => {
  it('mantiene la data civile italiana senza slittare al giorno precedente in timezone positive', () => {
    const previousTz = process.env.TZ
    process.env.TZ = 'Europe/Rome'
    try {
      const result = parseTrainingSheetNarration(
        'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30 con focus forza intensità 4 volume 3.',
      )
      expect(result.data.date).toBe('2026-07-28')
    } finally {
      if (previousTz === undefined) delete process.env.TZ
      else process.env.TZ = previousTz
    }
  })

  it('estrae i dati principali e costruisce le fasi da una narrazione completa', () => {
    const result = parseTrainingSheetNarration(
      'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30 con focus forza, intensità 4, volume 3. ' +
      'Attivazione durata di 15 minuti. Diviso in due gruppi, due momenti da 22 minuti, con 5v4+1j. ' +
      'Partita a tutto campo 3 tempi da 10 minuti.',
      [],
      { coach: ' Nicola Zecchi ' },
    )

    expect(result.data.date).toBe('2026-07-28')
    expect(result.data.time).toBe('17:30')
    expect(result.data.location).toBe('Mezzolara')
    expect(result.data.coach).toBe('Nicola Zecchi')
    expect(result.data.focus_physical).toBe('Forza')
    expect(result.data.intensity).toBe(4)
    expect(result.data.volume).toBe(3)
    expect(result.data.phases.map((phase) => phase.duration_minutes)).toEqual([15, 44, 30])
    expect(result.data.total_duration_minutes).toBe(89)
    expect(result.data.phases[1].exercises[1].title).toBe('5v4 + 1 jolly v1')
    expect(result.status).toBe('da_completare')
    expect(result.missing_fields).toEqual(expect.arrayContaining(['Obiettivo della seduta', 'Principi di gioco']))
  })

  it('interpreta l’orario parlato pomeridiano e rifiuta orari fuori range', () => {
    const afternoon = parseTrainingSheetNarration('Allenamento a Mezzolara alle cinque e 30 con focus forza intensità 3 volume 3.')
    expect(afternoon.data.time).toBe('17:30')

    const invalid = parseTrainingSheetNarration('Allenamento a Mezzolara alle 25:70 con focus forza intensità 3 volume 3.')
    expect(invalid.data.time).toBeNull()
    expect(invalid.missing_fields).toContain('Orario')
  })

  it('riconosce infortunati e assenti usando i nomi della Rosa', () => {
    const roster = [
      { name: 'Eddy Martuzzi' },
      { name: 'Lorenzo Palmieri' },
      { name: 'Berardo Bungaja' },
    ]
    const injuredResult = parseTrainingSheetNarration(
      'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30. ' +
      'Saranno assenti per infortunio Martuzzi e Palmieri. ' +
      'Attivazione 15 minuti. Focus forza intensità 4 volume 3.',
      roster,
    )
    const absentResult = parseTrainingSheetNarration(
      'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30. ' +
      'Saranno assenti per altri motivi Bungaja. ' +
      'Attivazione 15 minuti. Focus forza intensità 4 volume 3.',
      roster,
    )

    expect(injuredResult.data.absences.injured).toEqual(['Eddy Martuzzi', 'Lorenzo Palmieri'])
    expect(absentResult.data.absences.absent).toEqual(['Berardo Bungaja'])
  })

  it('segnala i campi obbligatori mancanti senza duplicare gli errori', () => {
    const result = parseTrainingSheetNarration('Attivazione senza durata.')

    expect(result.status).toBe('da_completare')
    expect(result.data.phases).toHaveLength(1)
    expect(result.missing_fields).toEqual(expect.arrayContaining([
      'Data allenamento',
      'Orario',
      'Campo',
      'Focus fisico',
      'Intensità',
      'Volume',
      'Obiettivo della seduta',
      'Principi di gioco',
      'Durata fase 1',
    ]))
    expect(new Set(result.missing_fields).size).toBe(result.missing_fields.length)
  })

  it('richiede conferma del formato della seconda esercitazione quando non è riconoscibile', () => {
    const result = parseTrainingSheetNarration(
      'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30 con focus forza intensità 4 volume 3. ' +
      'Diviso in due gruppi, due momenti da 20 minuti. Prima esercitazione dura 10 minuti.',
    )

    expect(result.data.phases).toHaveLength(1)
    expect(result.data.phases[0].exercises[1].title).toBe('Da confermare')
    expect(result.missing_fields).toContain('Formato seconda esercitazione')
  })
})
