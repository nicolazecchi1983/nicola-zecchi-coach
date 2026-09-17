import { describe, expect, it } from 'vitest'
import {
  MATCH_GPS_METRIC_REGISTRY,
  getMatchGpsMetric,
  getMatchGpsMetrics,
  isMatchGpsActivityMetric,
  isMatchGpsMetricPer90,
} from '../../src/modules/match/matchGpsMetricRegistry.js'

describe('Match GPS Metric Registry', () => {
  it('owns every canonical R31 metric exactly once', () => {
    const keys = MATCH_GPS_METRIC_REGISTRY.map(({ key }) => key)

    expect(keys).toEqual([
      'restingHeartRate',
      'maxHeartRate',
      'maxSpeedMs',
      'distanceMaxSpeedKm',
      'averageSpeed',
      'accelerationMs2',
      'accelerationCount',
      'decelerationCount',
      'distanceKm',
    ])
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('classifies cumulative metrics as per90-capable', () => {
    expect(getMatchGpsMetrics({ per90: true }).map(({ key }) => key)).toEqual([
      'distanceMaxSpeedKm',
      'accelerationCount',
      'decelerationCount',
      'distanceKm',
    ])

    expect(isMatchGpsMetricPer90('distanceKm')).toBe(true)
    expect(isMatchGpsMetricPer90('maxSpeedMs')).toBe(false)
  })

  it('keeps resting HR outside the activity-presence signal', () => {
    expect(isMatchGpsActivityMetric('restingHeartRate')).toBe(false)
    expect(isMatchGpsActivityMetric('maxHeartRate')).toBe(true)
    expect(isMatchGpsActivityMetric('distanceKm')).toBe(true)
  })

  it('can expose only metrics intended for analysis UI', () => {
    const visible = getMatchGpsMetrics({ visible: true }).map(({ key }) => key)

    expect(visible).not.toContain('restingHeartRate')
    expect(visible).not.toContain('maxHeartRate')
    expect(visible).toContain('distanceKm')
    expect(visible).toContain('maxSpeedMs')
  })

  it('maps legacy persistence only for metrics inherited from R31', () => {
    expect(getMatchGpsMetric('distanceKm')).toMatchObject({
      legacyColumn: 'distance_km',
      aggregation: 'cumulative',
      category: 'distance',
    })

    expect(getMatchGpsMetric('maxSpeedMs')).toMatchObject({
      legacyColumn: 'max_speed_ms',
    })

    expect(
      MATCH_GPS_METRIC_REGISTRY
        .filter(({ legacyColumn }) => legacyColumn != null)
        .every(
          ({ legacyColumn }) =>
            typeof legacyColumn === 'string' && legacyColumn.length > 0,
        ),
    ).toBe(true)
  })
})