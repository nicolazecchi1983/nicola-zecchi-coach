import { normalizeMatchCenterState } from './matchCenterModel.js'
import { normalizeMatchSquadSnapshot } from './matchSquadSnapshotModel.js'

function cleanText(value) {
  return String(value ?? '').trim()
}

function playerKey(player = {}) {
  const id = cleanText(player.playerId ?? player.player_id ?? player.id)
  if (id) return `id:${id}`
  const name = cleanText(player.name ?? player.canonicalName).toLocaleLowerCase('it-IT')
  return name ? `name:${name}` : ''
}

function meaningfulPlayer(player = {}) {
  return Boolean(playerKey(player))
}

function samePlayer(left = {}, right = {}) {
  const leftKey = playerKey(left)
  return Boolean(leftKey && leftKey === playerKey(right))
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

function incomingStarter(eventPlayer = {}, benchPlayer = {}, outgoing = {}) {
  return {
    ...outgoing,
    playerId: cleanText(eventPlayer.playerId) || cleanText(benchPlayer.playerId),
    name: cleanText(eventPlayer.name) || cleanText(benchPlayer.name),
    shirtNumber: benchPlayer.shirtNumber ?? null,
  }
}

export function deriveMatchCenterOperationalState(snapshotValue = {}, centerValue = {}) {
  const snapshot = normalizeMatchSquadSnapshot(snapshotValue, { persisted: Boolean(snapshotValue?.persisted) })
  const center = normalizeMatchCenterState(centerValue)
  const starters = snapshot.starters.map((player) => ({ ...player }))
  const bench = snapshot.bench.map((player) => ({ ...player }))
  let formation = snapshot.formation
  let customFormation = snapshot.customFormation

  for (const event of chronologicalEvents(center.events)) {
    if (event.side !== 'our') continue

    if (event.type === 'substitution') {
      const starterIndex = starters.findIndex((player) => samePlayer(player, event.out))
      if (starterIndex < 0) continue

      const benchIndex = bench.findIndex((player) => samePlayer(player, event.in))
      const outgoing = starters[starterIndex]
      const incoming = benchIndex >= 0 ? bench[benchIndex] : {}

      starters[starterIndex] = incomingStarter(event.in, incoming, outgoing)

      if (benchIndex >= 0) {
        bench[benchIndex] = {
          ...outgoing,
          slot: incoming.slot,
        }
      } else {
        const emptyBenchIndex = bench.findIndex((player) => !meaningfulPlayer(player))
        if (emptyBenchIndex >= 0) {
          bench[emptyBenchIndex] = {
            ...outgoing,
            slot: bench[emptyBenchIndex].slot,
          }
        }
      }
      continue
    }

    if (event.type === 'sanction' && ['red', 'second_yellow'].includes(event.sanction)) {
      const starterIndex = starters.findIndex((player) => samePlayer(player, event.player))
      if (starterIndex >= 0) {
        starters[starterIndex] = {
          ...starters[starterIndex],
          playerId: '',
          name: '',
          shirtNumber: null,
        }
      }
      continue
    }

    if (event.type === 'formation_change') {
      formation = cleanText(event.formation) || formation
      customFormation = cleanText(event.customFormation)
    }
  }

  return {
    snapshotPersisted: snapshot.persisted,
    centerPersisted: center.persisted,
    status: center.status,
    period: center.period,
    score: { ...center.score },
    formation,
    customFormation,
    starters,
    bench,
    currentStarters: starters.filter(meaningfulPlayer),
    currentBench: bench.filter(meaningfulPlayer),
    timeline: chronologicalEvents(center.events),
  }
}

export function matchCenterPlayerOptions(snapshotValue = {}, centerValue = {}) {
  const snapshot = normalizeMatchSquadSnapshot(snapshotValue)
  const center = normalizeMatchCenterState(centerValue)
  const candidates = [
    ...snapshot.starters,
    ...snapshot.bench,
    ...center.events.flatMap((event) => {
      if (event.type === 'goal') return [event.scorer, event.assist]
      if (event.type === 'substitution') return [event.out, event.in]
      if (event.type === 'sanction') return [event.player]
      return []
    }),
  ]

  const seen = new Set()
  return candidates.filter((player) => {
    const key = playerKey(player)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatMatchCenterMinute(event = {}) {
  if (!Number.isInteger(event.minute)) return '—'
  return `${event.minute}${event.addedMinute ? `+${event.addedMinute}` : ''}’`
}

export function matchCenterEventLabel(event = {}) {
  if (event.type === 'goal') return event.side === 'opponent' ? 'Gol avversario' : 'Gol'
  if (event.type === 'substitution') return 'Sostituzione'
  if (event.type === 'sanction') {
    return ({
      yellow: 'Ammonizione',
      second_yellow: 'Doppia ammonizione',
      red: 'Espulsione',
    })[event.sanction] || 'Sanzione'
  }
  if (event.type === 'formation_change') return event.side === 'opponent' ? 'Cambio sistema avversario' : 'Cambio sistema'
  return 'Evento'
}
