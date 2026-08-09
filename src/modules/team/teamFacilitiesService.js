import {
  listTeamFacilities,
  replaceTeamFacilitiesRows,
} from '../../infrastructure/repositories/teamFacilitiesRepository.js'

function normalizeFacilityName(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)
}

export function normalizeFacilityNames(values = []) {
  const seen = new Set()
  const result = []
  for (const value of Array.isArray(values) ? values : []) {
    const name = normalizeFacilityName(value)
    if (!name) continue
    const key = name.toLocaleLowerCase('it-IT')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(name)
  }
  return result
}

export async function loadTeamFacilities(teamId) {
  if (!teamId) return []
  const { data, error } = await listTeamFacilities(teamId)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    teamId: row.team_id,
    name: normalizeFacilityName(row.name),
    active: row.active !== false,
  }))
}

export async function replaceTeamFacilities(teamId, names = []) {
  if (!teamId) throw new Error('Squadra non inizializzata.')
  const normalized = normalizeFacilityNames(names)
  const { error } = await replaceTeamFacilitiesRows(teamId, normalized)
  if (error) throw error
  return loadTeamFacilities(teamId)
}
