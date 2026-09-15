import { escapeHtml } from '../../../shared/html/escapeHtml.js'
import { getMatchPostUtilities, getMatchWorkflowSectionsForMoment } from '../matchWorkflowModel.js'

const ICONS = Object.freeze({
  study:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  callups:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5S13.8 16 14.5 19M17 8h4M19 6v4M17 15h4M17 19h4"/></svg>',
  formation:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.4"/><circle cx="15" cy="9" r="1.4"/><circle cx="9" cy="15" r="1.4"/><circle cx="15" cy="15" r="1.4"/></svg>',
  analysis:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/></svg>',
  statistics:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16v-5M11 16V7M16 16v-8M21 16V4"/></svg>',
  gps:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M19 4v16M5 12h14"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg>',
  post:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  report:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 13h5M10 17h5"/></svg>',
})

const byKey = (items, key) => items.find((item) => item.key === key) || null

function activeFor(activeSection, route) {
  if (route === 'report') return activeSection === 'report' || activeSection === 'match-report-workspace'
  const utility = getMatchPostUtilities().find((item) => item.key === route)
  if (utility) return activeSection === utility.route
  return activeSection === route
}

function card({ route, section, title, icon, activeSection }) {
  const active = activeFor(activeSection, route)
  return `<button type="button" class="match-phase-card ${active ? 'is-active' : ''}" data-phase-card data-workspace-action="${route}" ${active ? 'aria-current="page"' : ''}>
    <span class="match-phase-card__icon">${ICONS[icon] || ''}</span>
    <strong>${escapeHtml(title || section?.label || '')}</strong>
  </button>`
}

function formationCard({ activeSection, teamName, ownSection, opponentSection }) {
  const ownActive = activeSection === 'our-team'
  const opponentActive = activeSection === 'opponent'
  const active = ownActive || opponentActive
  const ownLabel = String(teamName || '').trim() || ownSection?.label || 'Nostra squadra'
  return `<article class="match-phase-card match-phase-card--formation ${active ? 'is-active' : ''}" data-phase-card data-phase-card-group="formation">
    <span class="match-phase-card__icon">${ICONS.formation}</span>
    <strong>Preparazione tattica</strong>
    <div class="match-phase-card__subactions" aria-label="Preparazione tattica">
      <button type="button" class="${ownActive ? 'is-active' : ''}" data-workspace-action="our-team" ${ownActive ? 'aria-current="page"' : ''}>${escapeHtml(ownLabel)}</button>
      <button type="button" class="${opponentActive ? 'is-active' : ''}" data-workspace-action="opponent" ${opponentActive ? 'aria-current="page"' : ''}>Avversario</button>
    </div>
  </article>`
}

function preBoard(activeSection, teamName) {
  const sections = getMatchWorkflowSectionsForMoment('pre-match')
  const study = byKey(sections, 'opponent-study')
  const callups = byKey(sections, 'callups')
  const own = byKey(sections, 'our-team')
  const opponent = byKey(sections, 'opponent')
  if (!study || !callups || !own || !opponent) return ''
  return `<section class="match-phase-board match-phase-board--pre" aria-label="Workspace PRE" data-phase-workspace-board="pre-match">
    <div class="match-phase-board__grid match-phase-board__grid--pre">
      ${card({ route:'opponent-study', section:study, title:'Studio avversario', icon:'study', activeSection })}
      ${card({ route:'callups', section:callups, title:'Convocazioni', icon:'callups', activeSection })}
      ${formationCard({ activeSection, teamName, ownSection:own, opponentSection:opponent })}
    </div>
  </section>`
}

function postBoard(activeSection) {
  const sections = getMatchWorkflowSectionsForMoment('post-match')
  const analysis = byKey(sections, 'analysis')
  const report = byKey(sections, 'report')
  const post = byKey(sections, 'post-match')
  const utilities = getMatchPostUtilities()
  if (!analysis || !report || !post) return ''
  return `<section class="match-phase-board match-phase-board--post" aria-label="Workspace POST" data-phase-workspace-board="post-match">
    <div class="match-phase-board__grid match-phase-board__grid--post">
      ${card({ route:'analysis', section:analysis, title:'Analisi', icon:'analysis', activeSection })}
      ${utilities.map((utility) => card({ route:utility.key, title:utility.label, icon:utility.icon, activeSection })).join('')}
      ${card({ route:'post-match', section:post, title:'Post gara', icon:'post', activeSection })}
      ${card({ route:'report', section:report, title:'Report finale', icon:'report', activeSection })}
    </div>
  </section>`
}

export function renderPhaseWorkspaceNavigator({ activeSection = '', teamName = '' } = {}) {
  if (['opponent-study', 'callups', 'our-team', 'opponent'].includes(activeSection)) return preBoard(activeSection, teamName)
  if (['analysis', 'match-statistics', 'match-gps', 'post-match', 'report', 'match-report-workspace'].includes(activeSection)) return postBoard(activeSection)
  return ''
}
