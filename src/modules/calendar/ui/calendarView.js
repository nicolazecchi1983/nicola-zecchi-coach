export function matchTypeLabel(value) {
  return ({ friendly: 'Amichevole', cup: 'Coppa', league: 'Campionato' })[value] || 'Partita'
}

export function matchTypeValueFromLabel(value = '') {
  const normalized = String(value).trim().toLowerCase()
  return ({ amichevole: 'friendly', coppa: 'cup', campionato: 'league' })[normalized] || null
}

export function parseMatchTitle(title = '') {
  const parts = String(title).split('·').map((part) => part.trim()).filter(Boolean)
  if (!/^partita$/i.test(parts[0] || '')) return { matchType: null, opponent: '' }
  return {
    matchType: matchTypeValueFromLabel(parts[1] || ''),
    opponent: String(parts[2] || '').replace(/^vs\s+/i, '').trim(),
  }
}

export function buildEventTitle(eventType, matchType, opponent) {
  if (eventType !== 'match') {
    return ({ training: 'Allenamento', meeting: 'Riunione', rest: 'Riposo' })[eventType] || 'Evento'
  }
  return ['Partita', matchTypeLabel(matchType), `vs ${String(opponent || 'Da definire').trim() || 'Da definire'}`].join(' · ')
}

export function eventTypeIcon(type, iconRenderer) {
  const icons = { training: 'calendar', match: 'analysis', meeting: 'methodology', rest: 'close' }
  return typeof iconRenderer === 'function'
    ? iconRenderer(icons[type] ?? 'calendar')
    : ''
}

export function isTrainingEventType(type) {
  return String(type || '').trim().toLowerCase() === 'training'
}


const TRAINING_EVALUATION_VALUES = new Set(['green', 'yellow', 'red'])

export function trainingEvaluationValue(event = {}) {
  if (!event.trainingSheetPath) return null
  const value = String(event.libraryFeedback?.trafficLight || '').trim().toLowerCase()
  return TRAINING_EVALUATION_VALUES.has(value) ? value : null
}

function renderTrainingEvaluationDot(event = {}) {
  const value = trainingEvaluationValue(event)
  if (!value) return ''
  const label = ({ green: 'Positiva', yellow: 'Da rivedere', red: 'Critica' })[value]
  return `<span class="calendar-evaluation-dot is-${value}" role="img" aria-label="Valutazione seduta: ${label}" title="Valutazione seduta: ${label}"></span>`
}

export function renderCalendarView({
  currentDate,
  events,
  canCreate,
  icon,
  escapeHtml,
  formatDateInputValue,
  team = {},
}) {

  const eventPlaceLabel = (event) => event.place ? ` · ${event.place}` : ''
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const mondayIndex = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((mondayIndex + lastDay.getDate()) / 7) * 7
  const today = new Date()

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(year, month, index - mondayIndex + 1)
    const muted = cellDate.getMonth() !== month
    const dateValue = formatDateInputValue(cellDate)
    const dayEvents = events.filter((item) => {
      const eventDate = new Date(item.startAt)
      return eventDate.getFullYear() === cellDate.getFullYear()
        && eventDate.getMonth() === cellDate.getMonth()
        && eventDate.getDate() === cellDate.getDate()
    })
    const isToday = cellDate.toDateString() === today.toDateString()
    const weekdayLabel = new Intl.DateTimeFormat('it-IT', { weekday: 'short' })
      .format(cellDate)
      .replace('.', '')
      .toUpperCase()
    const accessibleDate = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(cellDate)

    return `<div class="calendar-cell ${muted ? 'is-muted' : ''} ${isToday ? 'is-today' : ''} ${dayEvents.length ? 'has-events' : 'is-empty'}" aria-label="${escapeHtml(accessibleDate)}" ${!muted && canCreate ? `data-create-event-date="${dateValue}"` : ''}>
      <div class="calendar-cell-date">
        <span class="calendar-cell-weekday">${weekdayLabel}</span>
        <span class="day-number ${isToday ? 'is-today' : ''}">${cellDate.getDate()}</span>
      </div>
      <div class="calendar-cell-events">
        ${dayEvents.map((event) => `<button class="calendar-event calendar-event--${event.type} ${event.type === 'match' && event.matchType ? `calendar-event--match-${event.matchType}` : ''}" data-open-event="${event.id}" type="button">
          <strong><span class="calendar-event__icon">${eventTypeIcon(event.type, icon)}</span>${event.title}</strong>
          ${event.type === 'rest' ? '' : `<span>${event.time}${eventPlaceLabel(event)}</span>`}
          ${event.type === 'training' ? `<small class="calendar-event-details">${event.matchDay || 'MD —'}${event.editorData?.focus ? ` · ${escapeHtml(event.editorData.focus)}` : ''}${event.trainingSheetPath ? ' · TS pubblicata' : ' · Crea TS'}${renderTrainingEvaluationDot(event)}</small>` : ''}
          ${event.type === 'match' && event.matchType ? `<small class="calendar-event-details">${escapeHtml(matchTypeLabel(event.matchType))}${event.matchReportStatus === 'completed' ? ' · REPORT' : ''}</small>` : ''}
        </button>`).join('')}
      </div>
    </div>`
  }).join('')

  const monthTitle = (() => {
    const title = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(currentDate)
    return title.charAt(0).toUpperCase() + title.slice(1)
  })()

  return `<section class="view page-view">
    <div class="page-head"><div><h1>Calendario</h1><p><span>${escapeHtml(team.season ? `STAGIONE ${team.season}` : 'STAGIONE')}</span>${team.category ? `<b>•</b>${escapeHtml(team.category)}` : ''}${team.competitionGroup ? `<b>•</b>${escapeHtml(`GIRONE ${team.competitionGroup}`)}` : ''}</p></div>
      <div class="page-head-actions calendar-page-actions">
        <button class="calendar-today-button calendar-today-button--prominent" type="button" data-calendar-today>Oggi</button>
        ${canCreate ? `<details class="calendar-actions-menu" data-calendar-actions-menu>
          <summary class="button">Azioni <span aria-hidden="true">⌄</span></summary>
          <div class="calendar-actions-menu__panel">
            <button type="button" data-new-event>${icon('plus')}<span>Nuovo evento</span></button>
            <button type="button" data-import-season-calendar><span aria-hidden="true">↓</span><span>Importa calendario stagione</span></button>
            <hr>
            <button type="button" data-manage-calendar-events><span aria-hidden="true">⚙</span><span>Gestisci / elimina eventi</span></button>
          </div>
        </details>` : ''}
      </div>
    </div>
    <section class="calendar-panel"><div class="calendar-toolbar calendar-toolbar--clean">
      <button class="calendar-month-nav" type="button" data-calendar-prev aria-label="Mese precedente">‹</button><h2>${monthTitle}</h2><button class="calendar-month-nav" type="button" data-calendar-next aria-label="Mese successivo">›</button>
    </div>
    <div class="calendar-weekdays"><span>LUN</span><span>MAR</span><span>MER</span><span>GIO</span><span>VEN</span><span>SAB</span><span>DOM</span></div>
    <div class="calendar-grid">${cells}</div></section>
  </section>`
}
