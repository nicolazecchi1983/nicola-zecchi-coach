const MATCH_DURATION_MINUTES = 90

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
