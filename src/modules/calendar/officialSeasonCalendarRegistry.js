import source from '../../data/officialCalendars/lnd-serie-d-2026-27-girone-e.json' with { type: 'json' }

const normalize = (value = '') => String(value).trim().toLocaleUpperCase('it-IT').replace(/\s+/g, ' ')
const sources = Object.freeze([source])

function teamAliases(team = {}) {
  return [team.name, team.shortName].filter(Boolean).map(normalize)
}

export function findOfficialSeasonCalendar(team = {}) {
  const sourceMatch = sources.find((candidate) => {
    const sameContext = normalize(candidate.season) === normalize(team.season)
      && normalize(candidate.category) === normalize(team.category)
      && normalize(candidate.competitionGroup) === normalize(team.competitionGroup)
    if (!sameContext) return false
    const aliases = new Set((candidate.teamAliases || []).map(normalize))
    return teamAliases(team).some((alias) => aliases.has(alias))
  })
  if (!sourceMatch) return null
  return {
    id: sourceMatch.id,
    label: sourceMatch.label,
    sourceFile: sourceMatch.sourceFile,
    sourceNotes: sourceMatch.sourceNotes,
    rows: Array.isArray(sourceMatch.rows) ? sourceMatch.rows.map((row) => ({ ...row })) : [],
  }
}
