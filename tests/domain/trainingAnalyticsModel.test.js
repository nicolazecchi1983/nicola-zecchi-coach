import { describe, expect, it } from 'vitest'
import {
  buildTrainingAnalyticsRecord,
  buildTrainingAnalyticsSnapshot,
} from '../../src/modules/training/trainingAnalyticsModel.js'

describe('trainingAnalyticsModel', () => {
  it('costruisce un record normalizzato e limita le scale 1-5', () => {
    const record = buildTrainingAnalyticsRecord({
      id: 'training-1',
      presentCount: 18,
      squadTotal: 20,
      trainingSheetPath: 'sheet.pdf',
      editorData: {
        date: '2026-08-12',
        intensity: 6,
        volume: 4,
        phases: [
          { duration: 20, goalkeepers: 'Sì' },
          { duration_minutes: 25, goalkeepers: false },
          { duration: -4 },
        ],
        pillars: ['Creare', '', 'Conservare'],
      },
    })

    expect(record.published).toBe(true)
    expect(record.attendanceRate).toBe(0.9)
    expect(record.durationMinutes).toBe(45)
    expect(record.goalkeeperPhaseCount).toBe(1)
    expect(record.intensity).toBeNull()
    expect(record.volume).toBe(4)
    expect(record.pillars).toEqual(['Creare', 'Conservare'])
  })

  it('considera nello snapshot solo allenamenti pubblicati', () => {
    const snapshot = buildTrainingAnalyticsSnapshot([
      {
        id: 'published', type: 'training', trainingSheetPath: 'a.pdf', presentCount: 18, squadTotal: 20,
        editorData: { matchDay: 'MD-2', focus: 'Possesso', intensity: 4, volume: 3, phases: [{ duration: 60 }], pillars: ['Creare'] },
        libraryFeedback: { trafficLight: 'green', notes: 'Buona seduta' },
      },
      {
        id: 'draft', type: 'training', trainingSheetPath: '',
        editorData: { phases: [{ duration: 120 }] },
      },
      {
        id: 'match', type: 'match', trainingSheetPath: 'x.pdf',
        editorData: { phases: [{ duration: 90 }] },
      },
    ])

    expect(snapshot.summary.sessions).toBe(1)
    expect(snapshot.summary.totalDurationMinutes).toBe(60)
    expect(snapshot.summary.averageIntensity).toBe(4)
    expect(snapshot.summary.averageAttendanceRate).toBe(0.9)
    expect(snapshot.distributions.matchDay).toEqual({ 'MD-2': 1 })
    expect(snapshot.distributions.focus).toEqual({ Possesso: 1 })
    expect(snapshot.distributions.feedback).toEqual({ green: 1, yellow: 0, red: 0, none: 0 })
    expect(snapshot.coverage.matchDay).toBe(1)
    expect(snapshot.coverage.objective).toBe(0)
  })

  it('gestisce snapshot vuoto senza NaN', () => {
    const snapshot = buildTrainingAnalyticsSnapshot([])
    expect(snapshot.summary.sessions).toBe(0)
    expect(snapshot.summary.averageDurationMinutes).toBeNull()
    expect(snapshot.summary.averageAttendanceRate).toBeNull()
    expect(snapshot.coverage).toEqual({
      matchDay: 0,
      focus: 0,
      objective: 0,
      intensity: 0,
      volume: 0,
      attendance: 0,
    })
  })
})
