import {
  getMatchWorkflowPhase,
  getMatchWorkflowPhaseLabel,
  getMatchWorkflowSections,
} from '../matchWorkflowModel.js'

function safeDateLabel(value) {
  if (!value) return 'Data da definire'
  try {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(`${value}T12:00:00`))
  } catch {
    return value
  }
}

export function createMatchWorkspaceView({
  storage,
  createMatchLibraryService,
  getCalendarEvents,
  getTeamProfile,
  escapeHtml,
}) {
  return function matchWorkspaceView() {
    let active = null
    try { active = JSON.parse(storage.getItem('staff-active-match') || 'null') } catch {}

    if (!active?.id) {
      return `<section class="content-section match-workspace match-workspace--empty">
        <div class="empty-state"><h1>Nessuna partita selezionata</h1><p>Apri o crea una gara dalla Match Library.</p><button type="button" class="button button--primary" data-workspace-action="match-library">Apri Match Library</button></div>
      </section>`
    }

    const service = createMatchLibraryService({ storage })
    const season = getTeamProfile().season || ''
    const match = service.list(getCalendarEvents(), season).find((item) => String(item.id) === String(active.id)) || active
    const team = getTeamProfile()
    const homeAway = match.homeAway || 'home'
    const ourName = team.shortName || team.name || 'Noi'
    const opponent = match.opponent || active.opponent || 'Avversario da definire'
    const homeTeam = homeAway === 'away' ? opponent : ourName
    const awayTeam = homeAway === 'away' ? ourName : opponent
    const score = match.goalsFor == null || match.goalsAgainst == null
      ? '–'
      : homeAway === 'away'
        ? `${match.goalsAgainst} – ${match.goalsFor}`
        : `${match.goalsFor} – ${match.goalsAgainst}`
    const phase = getMatchWorkflowPhase(match)
    const sections = getMatchWorkflowSections()

    return `<section class="content-section match-workspace" data-match-workspace data-match-id="${escapeHtml(String(match.id))}">
      <header class="match-workspace-header">
        <button type="button" class="match-workspace-back" data-workspace-action="match-library">← Match Library</button>
        <div class="match-workspace-title-row">
          <div>
            <span class="eyebrow">${escapeHtml(match.competition || 'Partita')}${match.matchDay ? ` · Giornata ${escapeHtml(String(match.matchDay))}` : ''}</span>
            <h1>${escapeHtml(homeTeam)} <b>${escapeHtml(score)}</b> ${escapeHtml(awayTeam)}</h1>
            <p>${escapeHtml(safeDateLabel(match.date || active.date))}${match.time ? ` · ${escapeHtml(match.time)}` : ''} · ${escapeHtml(match.venue || 'Impianto da definire')}</p>
          </div>
          <div class="match-workspace-meta"><button type="button" class="button button--secondary" data-workspace-action="statistics">Apri statistiche</button><span class="match-workspace-phase" data-match-phase="${escapeHtml(phase)}">${escapeHtml(getMatchWorkflowPhaseLabel(phase))}</span><span class="match-workspace-id">MATCH ID · ${escapeHtml(String(match.id))}</span></div>
        </div>
      </header>

      <nav class="match-workspace-tabs" aria-label="Workflow partita">
        ${sections.map((section, index) => `<button type="button" data-workspace-action="${escapeHtml(section.key)}"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(section.label)}</span></button>`).join('')}
      </nav>

      <div class="match-workspace-grid">
        ${sections.map((section, index) => `<article class="match-workspace-card">
          <div><span>${String(index + 1).padStart(2, '0')}</span><h2>${escapeHtml(section.label)}</h2><p>${escapeHtml(section.description)}</p></div>
          <button type="button" class="button button--primary" data-workspace-action="${escapeHtml(section.key)}">${escapeHtml(section.actionLabel)}</button>
        </article>`).join('')}
      </div>
    </section>`
  }
}
