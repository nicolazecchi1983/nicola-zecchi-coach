export function wireDashboardEvents({ root, setActiveNavigation, setView, storage = globalThis.localStorage }) {
  const dashboardCalendar = root.querySelector('[data-dashboard-calendar]')
  if (dashboardCalendar) storage?.removeItem('staff-match-entry-origin')
  root.querySelectorAll('[data-dashboard-match-quick]').forEach((button) => {
    button.addEventListener('click', async () => {
      const section = String(button.dataset.dashboardMatchQuick || '').trim()
      const id = String(button.dataset.matchId || '').trim()
      if (!id || !section) return
      const opponent = String(button.dataset.matchOpponent || 'Partita').trim() || 'Partita'
      const date = String(button.dataset.matchDate || '').trim()
      storage?.setItem('staff-active-match', JSON.stringify({ id, opponent, date }))
      storage?.setItem('staff-match-entry-origin', 'dashboard')
      storage?.setItem('nz-active-section', section)
      const labels = { callups: 'Convocazioni', 'our-team': 'Nostra squadra', 'opponent-study': 'Studio avversario' }
      await setView(section, labels[section] || 'Partita')
    })
  })

  dashboardCalendar?.addEventListener('click', async () => {
    setActiveNavigation('calendar')
    storage?.setItem('nz-active-section', 'calendar')
    await setView('calendar', 'Calendario')
  })
}
