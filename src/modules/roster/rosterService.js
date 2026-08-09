import {
  countTeamPlayers,
  deactivateTeamPlayer,
  insertTeamPlayers,
  listTeamPlayers,
  markTeamRosterInitialized,
  updateTeamPlayer,
  insertTeamPlayer,
} from '../../infrastructure/repositories/rosterRepository.js'
import { toSlugKey } from '../../shared/text/textNormalization.js'
import { isLegacyRosterCandidate, shouldUseLegacyRoster } from './rosterDomain.js'

const ROLE_ORDER = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']

function initialsFromName(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '??'
}

function normalizeRole(role = '') {
  return ROLE_ORDER.includes(role) ? role : 'Difensore'
}

function normalizePlayer(row = {}) {
  const name = String(row.name ?? row.full_name ?? '').trim()
  const key = String(row.key ?? row.player_key ?? toSlugKey(name))
  return {
    id: row.id ?? null,
    teamId: row.teamId ?? row.team_id ?? null,
    key,
    initials: row.initials || initialsFromName(name),
    name,
    year: String(row.year ?? row.birth_year ?? ''),
    role: normalizeRole(row.role),
    foot: String(row.foot ?? row.preferred_foot ?? ''),
    status: String(row.status || 'Disponibile'),
    number: row.number ?? row.shirt_number ?? null,
    active: row.active !== false,
  }
}

function isMissingTableError(error) {
  const code = String(error?.code || '')
  const message = String(error?.message || '').toLowerCase()
  return code === '42P01' || code === 'PGRST205' || message.includes('team_players')
}

export function rosterPlayerKey(player) {
  return String(player?.key || toSlugKey(player?.name || ''))
}

// Identita applicativa: per i record persistenti l'UUID e l'unica identita.
// player_key resta soltanto un riferimento legacy/compatibilita.
export function rosterPlayerIdentity(player) {
  return String(player?.id || rosterPlayerKey(player))
}

export async function loadTeamRoster({ team, legacyPlayers = [] } = {}) {
  const teamId = team?.id || null
  if (!teamId) {
    return {
      players: isLegacyRosterCandidate(team) ? legacyPlayers.map(normalizePlayer) : [],
      persistent: false,
      legacyFallback: isLegacyRosterCandidate(team),
    }
  }

  const { data, error } = await listTeamPlayers(teamId)

  if (error) {
    if (isMissingTableError(error)) {
      console.warn('Rosa persistente non ancora inizializzata: eseguire la migrazione team_players.')
      return {
        players: isLegacyRosterCandidate(team) ? legacyPlayers.map(normalizePlayer) : [],
        persistent: false,
        legacyFallback: isLegacyRosterCandidate(team),
        migrationRequired: true,
      }
    }
    throw error
  }

  const players = (data || []).map(normalizePlayer)
  if (players.length) {
    return { players, persistent: true, legacyFallback: false }
  }

  // Una query degli attivi vuota non significa "Rosa mai migrata": potrebbero
  // esistere soltanto record soft-deleted. Conta quindi tutti i record della squadra
  // prima di decidere se il fallback legacy e ancora ammesso.
  const { count, error: countError } = await countTeamPlayers(teamId)
  if (countError) throw countError
  const totalPersistentPlayers = Number(count || 0)
  const legacyFallback = shouldUseLegacyRoster({ team, totalPersistentPlayers })

  return {
    players: legacyFallback ? legacyPlayers.map(normalizePlayer) : [],
    persistent: true,
    legacyFallback,
  }
}

async function seedLegacyRosterIfNeeded(team, legacyPlayers = []) {
  if (!team?.id || !legacyPlayers.length) return

  const { count, error: countError } = await countTeamPlayers(team.id)

  if (countError) throw countError
  const totalPersistentPlayers = Number(count || 0)
  if (!shouldUseLegacyRoster({ team, totalPersistentPlayers })) return

  const rows = legacyPlayers.map((player) => {
    const normalized = normalizePlayer(player)
    return {
      team_id: team.id,
      player_key: normalized.key,
      full_name: normalized.name,
      initials: normalized.initials,
      role: normalized.role,
      birth_year: normalized.year ? Number(normalized.year) : null,
      preferred_foot: normalized.foot || null,
      status: normalized.status,
      shirt_number: normalized.number,
      active: true,
    }
  })

  const { error } = await insertTeamPlayers(rows)
  if (error) throw error

  const { error: stateError } = await markTeamRosterInitialized(team.id)
  if (stateError) throw stateError
}

export async function saveRosterPlayer({ team, player, legacyPlayers = [] } = {}) {
  if (!team?.id) {
    throw new Error('Salva prima la configurazione squadra per gestire una Rosa persistente.')
  }

  await seedLegacyRosterIfNeeded(team, legacyPlayers)

  const normalized = normalizePlayer(player)
  if (!normalized.name) throw new Error('Nome e cognome sono obbligatori.')

  const payload = {
    team_id: team.id,
    player_key: normalized.key || toSlugKey(normalized.name),
    full_name: normalized.name,
    initials: initialsFromName(normalized.name),
    role: normalized.role,
    birth_year: normalized.year ? Number(normalized.year) : null,
    preferred_foot: normalized.foot || null,
    status: normalized.status || 'Disponibile',
    shirt_number: normalized.number === '' || normalized.number == null ? null : Number(normalized.number),
    active: true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = normalized.id
    ? await updateTeamPlayer(team.id, normalized.id, payload)
    : await insertTeamPlayer(payload)
  if (error) throw error
  return normalizePlayer(data)
}

export async function removeRosterPlayer({ team, playerId, legacyPlayers = [] } = {}) {
  if (!team?.id || !playerId) throw new Error('Giocatore non valido.')

  await seedLegacyRosterIfNeeded(team, legacyPlayers)

  const { error } = await deactivateTeamPlayer(team.id, playerId)

  if (error) throw error
  return true
}
