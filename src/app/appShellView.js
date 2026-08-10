import { icon } from '../design-system/iconRegistry.js'
import { renderMobileNavigation, renderSidebarMenu } from './appNavigation.js'

const ROLE_LABELS = {
  owner: 'Proprietario', coach: 'Allenatore', assistant: 'Vice allenatore',
  athletic_coach: 'Preparatore fisico', goalkeeper_coach: 'Preparatore portieri',
  analyst: 'Match analyst', observer: 'Osservatore', physio: 'Fisioterapista',
  collaborator: 'Collaboratore', sporting_director: 'Direttore sportivo', read_only: 'Solo lettura',
}


function resolveSidebarTeamName(team = {}) {
  const shortName = String(team.shortName || '').trim()
  const fullName = String(team.name || '').trim()
  if (shortName.length >= 5) return shortName
  const withoutSuffix = fullName
    .replace(/\s+(calcio|football club|fc|asd|ssd|srl)\b.*$/i, '')
    .trim()
  return withoutSuffix || fullName || shortName || 'Squadra'
}

function resolveIdentity(user, currentUserRole, currentUserProfile) {
  const email = user?.email ?? ''
  const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name
  const profileName = [currentUserProfile?.first_name, currentUserProfile?.last_name].filter(Boolean).join(' ').trim()
  const fallback = email.split('@')[0].replace(/\d+$/g, '').replace(/[._-]+/g, ' ').trim().replace(/\b\w/g, (letter) => letter.toUpperCase())
  const name = profileName || metadataName || fallback || 'Utente'
  return { email, name, initial: name.charAt(0).toUpperCase() || 'N', role: ROLE_LABELS[currentUserRole] || 'Staff' }
}

function renderProfileMenu(identity) {
  return `<div class="profile-menu-wrapper">
    <button id="profileMenuButton" class="profile-menu-button" type="button" aria-expanded="false" aria-controls="profileDropdown" aria-label="Apri menu profilo">
      <span class="user-avatar" aria-hidden="true"><span class="avatar-initial">${identity.initial}</span></span>
      <span class="profile-menu-identity"><strong>${identity.name}</strong><small>${identity.role}</small></span>
      <span class="profile-menu-chevron" aria-hidden="true">⌄</span>
    </button>
    <div id="profileDropdown" class="profile-dropdown" role="menu" aria-hidden="true" inert>
      <div class="profile-dropdown-head"><span class="profile-dropdown-avatar" aria-hidden="true"><span class="avatar-initial">${identity.initial}</span></span><div><strong>${identity.name}</strong><span>${identity.email}</span></div></div>
      <div class="profile-dropdown-separator"></div>
      <button class="profile-dropdown-item" type="button" data-profile-action="profile" role="menuitem"><span class="profile-dropdown-icon">${icon('squad')}</span><span>Profilo</span></button>
      <div class="profile-dropdown-separator"></div>
      <button id="logoutButton" class="profile-dropdown-item profile-dropdown-item--logout" type="button" data-profile-action="logout" role="menuitem"><span class="profile-dropdown-icon">${icon('logout')}</span><span>Esci</span></button>
    </div>
  </div>`
}

export function renderAppShell({ user, team, currentUserRole, currentUserProfile, renderTeamLogo, renderDashboard, escapeHtml }) {
  const identity = resolveIdentity(user, currentUserRole, currentUserProfile)
  return `<div class="app-shell">
    <aside class="sidebar"><div class="sidebar-brand">${renderTeamLogo('brand-square team-brand-logo')}<div><strong>${escapeHtml(resolveSidebarTeamName(team))}</strong></div></div><nav class="sidebar-nav">${renderSidebarMenu()}</nav></aside>
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-context" aria-label="Contesto STAFF">
          ${team?.season ? `<span class="topbar-context-season">Stagione ${escapeHtml(team.season)}</span>` : '<span class="topbar-context-product">STAFF</span>'}
        </div>
        ${renderProfileMenu(identity)}
      </header>
      <main id="viewRoot">${renderDashboard()}</main>
    </div>
    ${renderMobileNavigation()}
    <div id="drawerRoot"></div><div id="modalRoot"></div><div id="documentViewerRoot"></div>
  </div>`
}
