import { readMatchCenterFromEventNotes } from './matchCenterModel.js'
import { readMatchSquadSnapshotFromEventNotes } from './matchSquadSnapshotModel.js'

const MATCH_DURATION_MINUTES = 90
const EXTRA_TIME_DURATION_MINUTES = 120
const EXTRA_TIME_PERIODS = new Set([
  'extra_time_first',
  'extra_time_break',
  'extra_time_second',
  'penalties',
])

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function cleanText(value) {
  return String(value ?? '').trim()
}

function readIndexedRows(data, prefix, fields) {
  const indexes = new Set()
  Object.keys(data || {}).forEach((key) => {
    const match = key.match(new RegExp(`^${prefix}_(?:${fields.join('|')})_(\\d+)$`))
    if (match) indexes.add(Number(match[1]))
  })
  return [...indexes].sort((a, b) => a - b).map((index) => {
    const row = { index }
    fields.forEach((field) => { row[field] = data[`${prefix}_${field}_${index}`] ?? '' })
    return row
  })
}

function readStarters(data) {
  return Array.from({ length: 11 }, (_, index) => ({
    player: String(data[`starter_${index}`] || '').trim(),
    number: toNumber(data[`starter_number_${index}`]),
    position: index,
  })).filter((item) => item.player)
}

function readBench(data) {
  const indexes = [...new Set(Object.keys(data || {})
    .filter((key) => /^bench_\d+$/.test(key))
    .map((key) => Number(key.match(/\d+/)?.[0]))
    .filter(Number.isFinite))].sort((a, b) => a - b)
  return indexes.map((index) => ({
    player: String(data[`bench_${index}`] || '').trim(),
    number: toNumber(data[`bench_number_${index}`]),
  })).filter((item) => item.player)
}

function buildPlayerMinutes(starters, bench, substitutions) {
  const minutes = new Map()
  starters.forEach(({ player }) => minutes.set(player, MATCH_DURATION_MINUTES))
  bench.forEach(({ player }) => { if (!minutes.has(player)) minutes.set(player, 0) })

  substitutions.forEach(({ minute, out, in: incoming }) => {
    const at = Math.min(MATCH_DURATION_MINUTES, Math.max(0, toNumber(minute) ?? MATCH_DURATION_MINUTES))
    if (out) minutes.set(out, Math.min(minutes.get(out) ?? MATCH_DURATION_MINUTES, at))
    if (incoming) minutes.set(incoming, Math.max(minutes.get(incoming) ?? 0, MATCH_DURATION_MINUTES - at))
  })

  return [...minutes.entries()]
    .map(([player, value]) => ({ player, minutes: Math.max(0, Math.round(value)) }))
    .sort((a, b) => b.minutes - a.minutes || a.player.localeCompare(b.player, 'it'))
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = String(item[key] || '').trim()
    if (value) acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function meaningfulPlayer(player = {}) {
  return Boolean(cleanText(player.playerId ?? player.player_id ?? player.id) || cleanText(player.name ?? player.canonicalName))
}

function sameName(left, right) {
  const a = cleanText(left).toLocaleLowerCase('it-IT')
  const b = cleanText(right).toLocaleLowerCase('it-IT')
  return Boolean(a && a === b)
}

function createParticipationRegistry(snapshot) {
  const records = []

  function upsert(player = {}, shirtNumber = null) {
    const playerId = cleanText(player.playerId ?? player.player_id ?? player.id)
    const name = cleanText(player.name ?? player.canonicalName ?? player.player)
    if (!playerId && !name) return null

    let record = playerId
      ? records.find((item) => item.playerId && item.playerId === playerId)
      : null

    if (!record && name) {
      record = records.find((item) => sameName(item.player, name))
    }

    if (!record) {
      record = {
        playerId,
        player: name,
        number: shirtNumber ?? player.shirtNumber ?? player.shirt_number ?? player.number ?? null,
        minutes: 0,
        started: false,
        used: false,
      }
      records.push(record)
    } else {
      if (!record.playerId && playerId) record.playerId = playerId
      if (!record.player && name) record.player = name
      if (record.number == null) {
        record.number = shirtNumber ?? player.shirtNumber ?? player.shirt_number ?? player.number ?? null
      }
    }

    return record
  }

  snapshot.starters.filter(meaningfulPlayer).forEach((player) => {
    const record = upsert(player, player.shirtNumber)
    if (record) record.started = true
  })

  snapshot.bench.filter(meaningfulPlayer).forEach((player) => {
    upsert(player, player.shirtNumber)
  })

  return { records, upsert }
}

function chronologicalEvents(events = []) {
  return [...events].sort((left, right) => {
    const leftMinute = Number.isInteger(left.minute) ? left.minute : Number.MAX_SAFE_INTEGER
    const rightMinute = Number.isInteger(right.minute) ? right.minute : Number.MAX_SAFE_INTEGER
    if (leftMinute !== rightMinute) return leftMinute - rightMinute
    const leftAdded = Number(left.addedMinute || 0)
    const rightAdded = Number(right.addedMinute || 0)
    if (leftAdded !== rightAdded) return leftAdded - rightAdded
    return Number(left.sequence || 0) - Number(right.sequence || 0)
  })
}

function resolveMatchDuration(center) {
  const hasExtraTimePeriod = EXTRA_TIME_PERIODS.has(center.period)
  const hasExtraTimeEvent = center.events.some((event) => Number.isInteger(event.minute) && event.minute > MATCH_DURATION_MINUTES)
  return hasExtraTimePeriod || hasExtraTimeEvent ? EXTRA_TIME_DURATION_MINUTES : MATCH_DURATION_MINUTES
}

function eventMinute(event, duration) {
  const value = Number.isInteger(event?.minute) ? event.minute : duration
  return Math.min(duration, Math.max(0, value))
}

function deriveCanonicalPlayerMinutes(snapshot, center, duration) {
  const { records, upsert } = createParticipationRegistry(snapshot)
  const active = new Map()

  records.filter((item) => item.started).forEach((record) => {
    active.set(record, 0)
    record.used = true
  })

  function closeInterval(record, at) {
    if (!record || !active.has(record)) return
    const startedAt = active.get(record)
    record.minutes += Math.max(0, at - startedAt)
    active.delete(record)
  }

  chronologicalEvents(center.events).forEach((event) => {
    if (event.side !== 'our') return
    const at = eventMinute(event, duration)

    if (event.type === 'substitution') {
      const outgoing = upsert(event.out)
      const incoming = upsert(event.in)
      closeInterval(outgoing, at)
      if (incoming && !active.has(incoming)) {
        active.set(incoming, at)
        incoming.used = true
      }
      return
    }

    if (event.type === 'sanction' && ['red', 'second_yellow'].includes(event.sanction)) {
      closeInterval(upsert(event.player), at)
    }
  })

  active.forEach((_, record) => closeInterval(record, duration))

  return {
    players: records
      .map((record) => ({
        playerId: record.playerId,
        player: record.player,
        number: record.number,
        minutes: Math.max(0, Math.round(record.minutes)),
      }))
      .sort((a, b) => b.minutes - a.minutes || a.player.localeCompare(b.player, 'it')),
    usedPlayers: records.filter((record) => record.used).length,
  }
}

function canonicalSubstitutions(center) {
  return chronologicalEvents(center.events)
    .filter((event) => event.side === 'our' && event.type === 'substitution')
    .map((event) => ({
      minute: event.minute,
      addedMinute: event.addedMinute || 0,
      out: cleanText(event.out?.name),
      in: cleanText(event.in?.name),
      reason: cleanText(event.reason),
    }))
}

function canonicalGoals(center) {
  return chronologicalEvents(center.events)
    .filter((event) => event.side === 'our' && event.type === 'goal')
    .map((event) => ({
      minute: event.minute,
      addedMinute: event.addedMinute || 0,
      scorer: cleanText(event.scorer?.name),
      assist: cleanText(event.assist?.name),
    }))
}

function canonicalCards(center) {
  const labels = {
    yellow: 'Ammonizione',
    second_yellow: 'Doppia ammonizione',
    red: 'Espulsione',
  }
  return chronologicalEvents(center.events)
    .filter((event) => event.side === 'our' && event.type === 'sanction')
    .map((event) => ({
      minute: event.minute,
      addedMinute: event.addedMinute || 0,
      player: cleanText(event.player?.name),
      cardType: labels[event.sanction] || '',
    }))
}

function canonicalLineup(snapshot) {
  const starters = snapshot.starters.filter(meaningfulPlayer).map((player) => ({
    player: cleanText(player.name),
    playerId: cleanText(player.playerId),
    number: player.shirtNumber ?? null,
    position: player.slot,
  }))
  const bench = snapshot.bench.filter(meaningfulPlayer).map((player) => ({
    player: cleanText(player.name),
    playerId: cleanText(player.playerId),
    number: player.shirtNumber ?? null,
  }))
  return { starters, bench }
}

export function buildCanonicalMatchDataSnapshot(event = null, match = {}) {
  if (!event) return null
  const rawNotes = event.rawNotes ?? event.notes ?? ''
  const center = readMatchCenterFromEventNotes(rawNotes)
  if (!center.persisted) return null

  const squad = readMatchSquadSnapshotFromEventNotes(rawNotes)
  const { starters, bench } = canonicalLineup(squad)
  const substitutions = canonicalSubstitutions(center)
  const goals = canonicalGoals(center)
  const cards = canonicalCards(center)
  const matchDuration = resolveMatchDuration(center)
  const minutesFinalized = center.status === 'finished' || center.period === 'full_time'
  const participation = minutesFinalized
    ? deriveCanonicalPlayerMinutes(squad, center, matchDuration)
    : {
        players: [],
        usedPlayers: new Set([
          ...starters.map((item) => item.playerId || item.player),
          ...substitutions.map((item) => item.in),
        ].filter(Boolean)).size,
      }

  const goalsFor = center.score.our
  const goalsAgainst = center.score.opponent
  const yellowCards = cards.filter((item) => item.cardType === 'Ammonizione').length
  const redCards = cards.filter((item) => item.cardType === 'Espulsione' || item.cardType === 'Doppia ammonizione').length
  const yellowByPlayer = countBy(cards.filter((item) => item.cardType === 'Ammonizione'), 'player')
  const redByPlayer = countBy(cards.filter((item) => item.cardType === 'Espulsione' || item.cardType === 'Doppia ammonizione'), 'player')

  return {
    schemaVersion: 1,
    source: 'calendar-match-center',
    matchId: String(event.id || match.id || ''),
    date: String(event.startAt || match.date || '').slice(0, 10),
    opponent: String(event.opponent || match.opponent || 'Da definire').trim(),
    competition: String(match.competition || '').trim(),
    formation: String(squad.customFormation || squad.formation || '').trim(),
    goalsFor,
    goalsAgainst,
    outcome: goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw',
    starters,
    bench,
    substitutions,
    goals,
    cards,
    playerMinutes: participation.players,
    usedPlayers: participation.usedPlayers,
    matchDuration,
    minutesFinalized,
    totals: {
      starters: starters.length,
      bench: bench.length,
      substitutions: substitutions.length,
      goals: goals.length,
      assists: goals.filter((item) => item.assist).length,
      yellowCards,
      redCards,
      minutes: minutesFinalized ? participation.players.reduce((sum, item) => sum + item.minutes, 0) : null,
    },
    leaders: {
      scorers: countBy(goals, 'scorer'),
      assists: countBy(goals, 'assist'),
      yellowCards: yellowByPlayer,
      redCards: redByPlayer,
    },
  }
}

// Legacy compatibility for historical local Match data that predates Match Center.
// New canonical statistics must prefer buildCanonicalMatchDataSnapshot().
export function buildMatchDataSnapshot(raw = {}, match = {}) {
  const data = raw && typeof raw === 'object' ? raw : {}
  const substitutions = readIndexedRows(data, 'sub', ['minute', 'out', 'in', 'reason'])
    .filter((item) => item.minute || item.out || item.in)
  const goals = readIndexedRows(data, 'goal', ['minute'])
    .map((item) => ({ ...item, scorer: data[`scorer_${item.index}`] || '', assist: data[`assist_${item.index}`] || '' }))
    .filter((item) => item.minute || item.scorer || item.assist)
  const cards = readIndexedRows(data, 'card', ['minute'])
    .map((item) => ({ ...item, player: data[`card_player_${item.index}`] || '', cardType: data[`card_type_${item.index}`] || '' }))
    .filter((item) => item.minute || item.player)
  const starters = readStarters(data)
  const bench = readBench(data)
  const playerMinutes = buildPlayerMinutes(starters, bench, substitutions)
  const goalsFor = toNumber(data.result_home ?? match.goalsFor)
  const goalsAgainst = toNumber(data.result_away ?? match.goalsAgainst)
  const usedPlayers = playerMinutes.filter((item) => item.minutes > 0).length
  const yellowCards = cards.filter((item) => item.cardType === 'Ammonizione').length
  const redCards = cards.filter((item) => item.cardType === 'Espulsione' || item.cardType === 'Doppia ammonizione').length
  const yellowByPlayer = countBy(cards.filter((item) => item.cardType === 'Ammonizione'), 'player')
  const redByPlayer = countBy(cards.filter((item) => item.cardType === 'Espulsione' || item.cardType === 'Doppia ammonizione'), 'player')

  return {
    schemaVersion: 1,
    source: 'legacy-local-match-data',
    matchId: String(match.id || ''),
    date: String(data.date || match.date || '').slice(0, 10),
    opponent: String(data.opponent || match.opponent || 'Da definire').trim(),
    competition: String(data.competition || match.competition || '').trim(),
    formation: String(data.formation || '').trim(),
    goalsFor,
    goalsAgainst,
    outcome: goalsFor == null || goalsAgainst == null ? 'pending' : goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw',
    starters,
    bench,
    substitutions,
    goals,
    cards,
    playerMinutes,
    usedPlayers,
    matchDuration: MATCH_DURATION_MINUTES,
    minutesFinalized: true,
    totals: {
      starters: starters.length,
      bench: bench.length,
      substitutions: substitutions.length,
      goals: goals.length,
      assists: goals.filter((item) => item.assist).length,
      yellowCards,
      redCards,
      minutes: playerMinutes.reduce((sum, item) => sum + item.minutes, 0),
    },
    leaders: {
      scorers: countBy(goals, 'scorer'),
      assists: countBy(goals, 'assist'),
      yellowCards: yellowByPlayer,
      redCards: redByPlayer,
    },
  }
}
