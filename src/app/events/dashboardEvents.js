export function wireDashboardEvents({ root, setActiveNavigation, setView, storage = globalThis.localStorage }) {
  root.querySelector('[data-dashboard-calendar]')?.addEventListener('click', async () => {
    setActiveNavigation('calendar')
    storage?.setItem('nz-active-section', 'calendar')
    await setView('calendar', 'Calendario')
  })
}
