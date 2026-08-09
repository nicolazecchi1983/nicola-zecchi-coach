import assert from 'node:assert/strict'
import {
  buildTrainingAnalyticsRecord,
  buildTrainingAnalyticsSnapshot,
} from '../src/modules/training/trainingAnalyticsModel.js'

const publishedEvent = {
  id: 'training-1',
  type: 'training',
  startAt: '2026-08-07T15:30:00.000Z',
  time: '17:30',
  place: 'Mezzolara',
  matchDay: 'MD-1',
  presentCount: 20,
  squadTotal: 22,
  trainingSheetPath: 'team/2026-27/2026-08-07/all_017.pdf',
  editorData: {
    status: 'published',
    date: '2026-08-07',
    time: '17:30',
    progressive: 17,
    focus: 'Metabolico',
    intensity: '4',
    volume: '3',
    objective: 'Conservare il possesso',
    principles: 'Orientamento del corpo',
    pillars: ['Conservare il vantaggio'],
    absent: ['A'],
    injured: ['B'],
    differentiated: [],
    phases: [
      { title: 'Attivazione', duration: '20', goalkeepers: 'yes' },
      { title: 'Possesso', duration: '25', goalkeepers: 'no' },
      { title: 'Partita', duration: '30', goalkeepers: true },
    ],
  },
  libraryFeedback: {
    trafficLight: 'green',
    notes: 'Seduta riuscita.',
  },
}

const record = buildTrainingAnalyticsRecord(publishedEvent)
assert.equal(record.eventId, 'training-1')
assert.equal(record.date, '2026-08-07')
assert.equal(record.durationMinutes, 75)
assert.equal(record.phaseCount, 3)
assert.equal(record.goalkeeperPhaseCount, 2)
assert.equal(record.intensity, 4)
assert.equal(record.volume, 3)
assert.equal(record.presentCount, 20)
assert.equal(record.attendanceRate, 0.9091)
assert.equal(record.feedbackRating, 'green')
assert.equal(record.hasFeedback, true)
assert.deepEqual(record.pillars, ['Conservare il vantaggio'])

const snapshot = buildTrainingAnalyticsSnapshot([
  publishedEvent,
  {
    ...publishedEvent,
    id: 'training-2',
    startAt: '2026-08-08T08:00:00.000Z',
    time: '10:00',
    matchDay: 'MD',
    presentCount: 22,
    editorData: {
      ...publishedEvent.editorData,
      date: '2026-08-08',
      time: '10:00',
      match_day: 'MD',
      intensity: '2',
      volume: '2',
      focus: 'Recupero',
      phases: [{ duration: 30, goalkeepers: 'no' }],
      pillars: ['Conservare il vantaggio', 'Proteggere il vantaggio'],
    },
    libraryFeedback: { trafficLight: null, notes: '' },
  },
  {
    id: 'draft-training',
    type: 'training',
    trainingSheetPath: null,
  },
  {
    id: 'match-1',
    type: 'match',
    trainingSheetPath: 'irrelevant.pdf',
  },
])

assert.equal(snapshot.summary.sessions, 2)
assert.equal(snapshot.summary.totalDurationMinutes, 105)
assert.equal(snapshot.summary.averageDurationMinutes, 52.5)
assert.equal(snapshot.summary.averageIntensity, 3)
assert.equal(snapshot.summary.averageVolume, 2.5)
assert.equal(snapshot.summary.averagePresent, 21)
assert.equal(snapshot.summary.feedbackSessions, 1)
assert.equal(snapshot.distributions.matchDay['MD-1'], 1)
assert.equal(snapshot.distributions.matchDay.MD, 1)
assert.equal(snapshot.distributions.focus.Metabolico, 1)
assert.equal(snapshot.distributions.focus.Recupero, 1)
assert.equal(snapshot.distributions.pillars['Conservare il vantaggio'], 2)
assert.equal(snapshot.distributions.feedback.green, 1)
assert.equal(snapshot.distributions.feedback.none, 1)
assert.equal(snapshot.coverage.intensity, 1)
assert.equal(snapshot.coverage.objective, 1)

console.log('Training Analytics Ready: PASS')
