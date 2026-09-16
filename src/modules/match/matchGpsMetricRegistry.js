const metric = ({
  key,
  label,
  aliases = [],
  kind = 'number',
  unit = null,
  category = 'general',
  aggregation = 'intensive',
  per90 = false,
  activitySignal = true,
  visible = true,
  order,
  legacyColumn,
}) => Object.freeze({
  key,
  label,
  aliases: Object.freeze([...aliases]),
  kind,
  unit,
  category,
  aggregation,
  per90,
  activitySignal,
  visible,
  order,
  legacyColumn,
})

export const MATCH_GPS_METRIC_REGISTRY = Object.freeze([
  metric({
    key: 'restingHeartRate',
    label: 'CARDIO RIP.',
    aliases: ['cardio rip'],
    unit: 'bpm',
    category: 'cardio',
    aggregation: 'intensive',
    per90: false,
    activitySignal: false,
    visible: false,
    order: 10,
    legacyColumn: 'resting_heart_rate',
  }),
  metric({
    key: 'maxHeartRate',
    label: 'CARDIO MAX.',
    aliases: ['cardio max'],
    unit: 'bpm',
    category: 'cardio',
    aggregation: 'intensive',
    per90: false,
    activitySignal: true,
    visible: false,
    order: 20,
    legacyColumn: 'max_heart_rate',
  }),
  metric({
    key: 'maxSpeedMs',
    label: 'VEL MAX m/s',
    aliases: ['vel max m s', 'vel max ms'],
    unit: 'm/s',
    category: 'speed',
    aggregation: 'intensive',
    per90: false,
    activitySignal: true,
    visible: true,
    order: 30,
    legacyColumn: 'max_speed_ms',
  }),
  metric({
    key: 'distanceMaxSpeedKm',
    label: 'Dist. Max vel. KM',
    aliases: ['dist max vel km'],
    unit: 'km',
    category: 'speed',
    aggregation: 'cumulative',
    per90: true,
    activitySignal: true,
    visible: true,
    order: 40,
    legacyColumn: 'distance_max_speed_km',
  }),
  metric({
    key: 'averageSpeed',
    label: 'VEL media',
    aliases: ['vel media'],
    unit: null,
    category: 'speed',
    aggregation: 'intensive',
    per90: false,
    activitySignal: true,
    visible: true,
    order: 50,
    legacyColumn: 'average_speed',
  }),
  metric({
    key: 'accelerationMs2',
    label: 'ACC m/s2',
    aliases: ['acc m s2', 'acc ms2'],
    unit: 'm/s²',
    category: 'acceleration',
    aggregation: 'intensive',
    per90: false,
    activitySignal: true,
    visible: true,
    order: 60,
    legacyColumn: 'acceleration_ms2',
  }),
  metric({
    key: 'accelerationCount',
    label: 'n. ACC',
    aliases: ['n acc'],
    kind: 'integer',
    unit: null,
    category: 'acceleration',
    aggregation: 'cumulative',
    per90: true,
    activitySignal: true,
    visible: true,
    order: 70,
    legacyColumn: 'acceleration_count',
  }),
  metric({
    key: 'decelerationCount',
    label: 'n. DECELL',
    aliases: ['n decell'],
    kind: 'integer',
    unit: null,
    category: 'acceleration',
    aggregation: 'cumulative',
    per90: true,
    activitySignal: true,
    visible: true,
    order: 80,
    legacyColumn: 'deceleration_count',
  }),
  metric({
    key: 'distanceKm',
    label: 'KM',
    aliases: ['km'],
    unit: 'km',
    category: 'distance',
    aggregation: 'cumulative',
    per90: true,
    activitySignal: true,
    visible: true,
    order: 90,
    legacyColumn: 'distance_km',
  }),
])

const byKey = new Map(MATCH_GPS_METRIC_REGISTRY.map((item) => [item.key, item]))

export function getMatchGpsMetric(key) {
  return byKey.get(String(key || '')) || null
}

export function getMatchGpsMetrics({
  visible,
  per90,
  activitySignal,
} = {}) {
  return MATCH_GPS_METRIC_REGISTRY
    .filter((item) => visible == null || item.visible === visible)
    .filter((item) => per90 == null || item.per90 === per90)
    .filter((item) => activitySignal == null || item.activitySignal === activitySignal)
    .sort((left, right) => left.order - right.order)
}

export function isMatchGpsMetricPer90(key) {
  return getMatchGpsMetric(key)?.per90 === true
}

export function isMatchGpsActivityMetric(key) {
  return getMatchGpsMetric(key)?.activitySignal === true
}