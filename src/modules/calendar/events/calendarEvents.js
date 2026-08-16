export function wireCalendarEvents({
  root,
  appState,
  openDrawer,
  openSeasonCalendarImport,
  openCalendarBulkManagement,
  openNewEventModal,
  calendarView,
  bindDynamic,
  goToCurrentMonth,
}) {
    root
      .querySelectorAll('[data-open-event]')
      .forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          openDrawer(button.dataset.openEvent)
        })
      })

    root.querySelector('[data-import-season-calendar]')?.addEventListener('click', (event) => {
      event.preventDefault()
      openSeasonCalendarImport()
    })

    root.querySelector('[data-manage-calendar-events]')?.addEventListener('click', (event) => {
      event.preventDefault()
      openCalendarBulkManagement()
    })

    root
      .querySelectorAll('[data-new-event]')
      .forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          openNewEventModal()
        })
      })

    root
      .querySelectorAll('[data-create-event-date]')
      .forEach((cell) => {
        cell.addEventListener('click', () => {
          openNewEventModal(cell.dataset.createEventDate)
        })
      })

    root.querySelector('[data-calendar-prev]')?.addEventListener('click', () => {
      appState.currentCalendarDate = new Date(
        appState.currentCalendarDate.getFullYear(),
        appState.currentCalendarDate.getMonth() - 1,
        1,
      )
      root.innerHTML = calendarView()
      bindDynamic()
    })

    root.querySelector('[data-calendar-next]')?.addEventListener('click', () => {
      appState.currentCalendarDate = new Date(
        appState.currentCalendarDate.getFullYear(),
        appState.currentCalendarDate.getMonth() + 1,
        1,
      )
      root.innerHTML = calendarView()
      bindDynamic()
    })

    root.querySelector('[data-calendar-today]')?.addEventListener('click', () => {
      goToCurrentMonth()
      root.innerHTML = calendarView()
      bindDynamic()
      const todayCell = root.querySelector('.calendar-cell.is-today')
      todayCell?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
}
