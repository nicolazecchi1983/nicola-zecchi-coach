function safeDateLabel(value) {
  if (!value) return 'Data da definire'
  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`))
  } catch {
    return String(value)
  }
}


function matchMonthKey(match) {
  const raw = String(match?.date || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'undated'
  return raw.slice(0, 7)
}

function matchMonthLabel(key) {
  if (key === 'undated') return 'Data da definire'
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1, 1, 12, 0, 0)
  if (Number.isNaN(date.getTime())) return key
  return new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  }).format(date).replace(/^./, (char) => char.toLocaleUpperCase('it-IT'))
}

function dateDayNumber(value) {
  const raw = String(value || '').slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return Math.floor(timestamp / 86400000)
}

function referenceDayNumber(referenceDate = new Date()) {
  if (typeof referenceDate === 'string') {
    const parsed = dateDayNumber(referenceDate)
    if (parsed != null) return parsed
  }
  if (referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())) {
    return Math.floor(Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    ) / 86400000)
  }
  return referenceDayNumber(new Date())
}

export function groupMatchesByMonth(matches = [], referenceDate = new Date()) {
  const referenceDay = referenceDayNumber(referenceDate)
  const upcoming = matches
    .map((match) => ({ match, day: dateDayNumber(match?.date) }))
    .filter(({ day }) => day != null && day >= referenceDay)
    .sort((left, right) => {
      if (left.day !== right.day) return left.day - right.day
      return String(left.match?.id || '').localeCompare(String(right.match?.id || ''))
    })

  const firstUpcoming = upcoming[0]
  if (!firstUpcoming) return []

  const key = matchMonthKey(firstUpcoming.match)
  const items = upcoming
    .filter(({ match }) => matchMonthKey(match) === key)
    .map(({ match }) => match)

  return [{ key, label: matchMonthLabel(key), items }]
}

export function getMatchLibraryUpcomingAgenda(matches = [], referenceDate = new Date()) {
  const referenceDay = referenceDayNumber(referenceDate)
  const operationalMonthKey = groupMatchesByMonth(matches, referenceDate)[0]?.key || null

  if (!operationalMonthKey) return []

  return matches
    .map((match) => ({ match, day: dateDayNumber(match?.date) }))
    .filter(({ match, day }) => day != null && day >= referenceDay && matchMonthKey(match) !== operationalMonthKey)
    .sort((left, right) => {
      if (left.day !== right.day) return left.day - right.day
      return String(left.match?.id || '').localeCompare(String(right.match?.id || ''))
    })
    .map(({ match }) => match)
}

function agendaDateParts(value) {
  const raw = String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { day: '--', month: '' }
  const date = new Date(`${raw}T12:00:00`)
  if (Number.isNaN(date.getTime())) return { day: '--', month: '' }
  return {
    day: new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(date).replace('.', '').toLocaleUpperCase('it-IT'),
  }
}

function calendarMatchOption(event, escapeHtml) {
  const competition = event.matchType === 'friendly' ? 'Amichevole' : event.matchType === 'cup' ? 'Coppa' : 'Campionato'
  const opponent = event.opponent || 'Avversario da definire'
  return `<option value="${escapeHtml(String(event.id))}">${escapeHtml(`${safeDateLabel(String(event.startAt || '').slice(0, 10))} \u00B7 ${event.time || '--:--'} \u00B7 ${competition} vs ${opponent}`)}</option>`
}

export function createMatchLibraryView({
  createMatchLibraryService,
  getMatchOutcome,
  getTeamProfile,
  getCalendarEvents,
  storage,
  escapeHtml,
  icon,
}) {
  return function matchLibraryView() {
    const service = createMatchLibraryService({ storage })
    const season = getTeamProfile().season || ''
    const calendarEvents = getCalendarEvents()
    const matches = service.list(calendarEvents, season)
    const monthGroups = groupMatchesByMonth(matches)
    const operationalMatches = monthGroups.flatMap((group) => group.items)
    const upcomingAgendaMatches = getMatchLibraryUpcomingAgenda(matches)
    const upcomingAgendaPreview = upcomingAgendaMatches.slice(0, 4)
    const upcomingAgendaMore = upcomingAgendaMatches.slice(4)
    const calendarMatches = calendarEvents
      .filter((event) => event.type === 'match')
      .slice()
      .sort((a, b) => String(a.startAt || '').localeCompare(String(b.startAt || '')))
    const competitionOptions = [...new Set(operationalMatches.map((match) => match.competition).filter(Boolean))]

    const renderMatchCard = (match) => {
      const outcome = getMatchOutcome(match)
      const dateLabel = safeDateLabel(match.date)
      const result = match.goalsFor == null || match.goalsAgainst == null ? '\u2013' : `${match.goalsFor}\u2013${match.goalsAgainst}`
      const searchText = [match.opponent, match.competition, match.venue, match.season, match.date].join(' ').toLocaleLowerCase('it-IT')
      const locationLabel = match.homeAway === 'away' ? 'Trasferta' : match.homeAway === 'neutral' ? 'Campo neutro' : 'Casa'
      return `<article class="match-library-card" data-match-library-card data-search-text="${escapeHtml(searchText)}" data-competition="${escapeHtml(match.competition)}" data-location="${escapeHtml(match.homeAway)}" data-outcome="${outcome}">
        <div class="match-library-date"><strong>${escapeHtml(dateLabel)}</strong><span>${escapeHtml(match.time || '')}</span></div>
        <div class="match-library-main">
          <span class="match-library-kicker">${escapeHtml(match.competition)}${match.matchDay ? ` \u00B7 Giornata ${match.matchDay}` : ''}</span>
          <h3>${match.homeAway === 'away' ? escapeHtml(match.opponent) : escapeHtml(getTeamProfile().shortName || 'Noi')} <b>${result}</b> ${match.homeAway === 'away' ? escapeHtml(getTeamProfile().shortName || 'Noi') : escapeHtml(match.opponent)}</h3>
          <p>${escapeHtml(match.venue || 'Impianto da definire')} \u00B7 ${locationLabel}</p>
        </div>
        <div class="match-library-status"><span>${escapeHtml(match.documentStatus)}</span><small>${match.source === 'calendar' ? 'Calendario' : 'Legacy Library'}</small></div>
        <div class="match-library-actions">
          <button type="button" class="button button--primary" data-open-match-workspace="${escapeHtml(match.id)}" data-match-opponent="${escapeHtml(match.opponent)}" data-match-date="${escapeHtml(match.date)}">Apri partita</button>
          <button type="button" class="button button--secondary match-library-statistics-button" data-open-match-statistics="${escapeHtml(match.id)}" data-match-opponent="${escapeHtml(match.opponent)}" data-match-date="${escapeHtml(match.date)}">Statistiche</button>
          ${match.source === 'library' ? `<button type="button" class="icon-button" data-delete-library-match="${escapeHtml(match.id)}" aria-label="Elimina gara legacy">\u00D7</button>` : ''}
        </div>
      </article>`
    }

    const renderAgendaRow = (match) => {
      const date = agendaDateParts(match.date)
      const locationLabel = match.homeAway === 'away' ? 'Trasferta' : match.homeAway === 'neutral' ? 'Campo neutro' : 'Casa'
      const meta = [match.competition, match.matchDay ? `Giornata ${match.matchDay}` : ''].filter(Boolean).join(' \u00B7 ')
      return `<button type="button" class="match-library-agenda-row" data-open-match-workspace="${escapeHtml(match.id)}" data-match-opponent="${escapeHtml(match.opponent)}" data-match-date="${escapeHtml(match.date)}" aria-label="Apri ${escapeHtml(match.opponent)} del ${escapeHtml(safeDateLabel(match.date))}">
        <span class="match-library-agenda-date"><strong>${escapeHtml(date.day)}</strong><small>${escapeHtml(date.month)}</small></span>
        <span class="match-library-agenda-main"><strong>${escapeHtml(match.opponent)}</strong><small>${escapeHtml(meta)}</small></span>
        <span class="match-library-agenda-location">${escapeHtml(locationLabel)}</span>
        <span class="match-library-agenda-arrow" aria-hidden="true">\u203A</span>
      </button>`
    }

    const defaultOpenKey = monthGroups[0]?.key

    const rows = monthGroups.map((group) => `<details class="match-library-month" data-match-library-month="${escapeHtml(group.key)}" ${group.key === defaultOpenKey ? 'open' : ''}>
      <summary>
        <span><strong>${escapeHtml(group.label)}</strong><small><b data-match-month-visible-count>${group.items.length}</b> ${group.items.length === 1 ? 'partita' : 'partite'}</small></span>
        <span class="match-library-month-chevron" aria-hidden="true">\u2304</span>
      </summary>
      <div class="match-library-month-content">${group.items.map(renderMatchCard).join('')}</div>
    </details>`).join('')

    const agenda = upcomingAgendaMatches.length ? `<section class="match-library-agenda" data-match-library-agenda>
      <header class="match-library-agenda-header">
        <div>
          <span class="match-library-agenda-eyebrow">A SEGUIRE</span>
          <h2>Prossime gare</h2>
          <p>Una vista rapida delle partite dopo il mese operativo.</p>
        </div>
        <span class="match-library-agenda-count">${upcomingAgendaMatches.length} ${upcomingAgendaMatches.length === 1 ? 'gara' : 'gare'}</span>
      </header>
      <div class="match-library-agenda-list">${upcomingAgendaPreview.map(renderAgendaRow).join('')}</div>
      ${upcomingAgendaMore.length ? `<details class="match-library-agenda-more">
        <summary><span>Mostra altre ${upcomingAgendaMore.length} ${upcomingAgendaMore.length === 1 ? 'gara' : 'gare'}</span><span class="match-library-agenda-more-chevron" aria-hidden="true">\u2304</span></summary>
        <div class="match-library-agenda-list match-library-agenda-list--more">${upcomingAgendaMore.map(renderAgendaRow).join('')}</div>
      </details>` : ''}
    </section>` : ''

    return `<section class="content-section match-library" data-match-library>
      <header class="page-heading match-library-heading">
        <div><span class="eyebrow">MATCH ENGINE</span><h1>Match Library</h1><p>Ogni partita nasce una volta e raccoglie tutto il lavoro pre-gara, gara e post-gara.</p></div>
        <button type="button" class="button button--primary" data-toggle-match-create>+ Crea partita</button>
      </header>

      <form class="match-library-create" data-match-create-form hidden>
        <div class="match-library-form-grid">
          <label><span>Origine partita</span><select name="sourceMode" data-match-source-mode>
            <option value="calendar">Dal Calendario</option>
            <option value="new">Nuova partita</option>
          </select></label>
          <label data-match-calendar-source><span>Partita gi\u00E0 nel Calendario</span><select name="calendarEventId" data-match-calendar-event>
            <option value="">Seleziona una partita</option>
            ${calendarMatches.map((event) => calendarMatchOption(event, escapeHtml)).join('')}
          </select></label>
        </div>

        <div class="match-library-form-grid" data-match-new-fields hidden>
          <label><span>Data</span><input type="date" name="date"></label>
          <label><span>Ora</span><input type="time" name="time" value="15:30"></label>
          <label><span>Avversario</span><input type="text" name="opponent" placeholder="Nome squadra"></label>
          <label><span>Competizione</span><select name="competition"><option>Campionato</option><option>Coppa</option><option>Amichevole</option></select></label>
          <label><span>Casa / trasferta</span><select name="homeAway"><option value="home">Casa</option><option value="away">Trasferta</option><option value="neutral">Campo neutro</option></select></label>
          <label><span>Impianto</span><input type="text" name="location" placeholder="Campo o stadio"></label>
          <label><span>Giornata / turno</span><input type="number" min="1" name="matchDay" placeholder="Facoltativo"></label>
        </div>

        <div class="match-library-form-actions">
          <button type="submit" class="button button--primary" data-match-create-submit>Apri partita</button>
          <button type="button" class="button" data-cancel-match-create>Annulla</button>
          <span data-match-create-message></span>
        </div>
      </form>

      <div class="match-library-toolbar">
        <label class="match-library-search"><span class="nav-icon">${icon('search')}</span><input name="match_library_search" type="search" placeholder="Cerca avversario, competizione o impianto" data-match-library-search></label>
        <select name="match_library_competition" data-match-library-competition><option value="">Tutte le competizioni</option>${competitionOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select>
        <select name="match_library_location" data-match-library-location><option value="">Casa, trasferta e neutro</option><option value="home">Casa</option><option value="away">Trasferta</option><option value="neutral">Campo neutro</option></select>
        <select name="match_library_outcome" data-match-library-outcome><option value="">Tutti i risultati</option><option value="win">Vittorie</option><option value="draw">Pareggi</option><option value="loss">Sconfitte</option><option value="pending">Da giocare</option></select>
      </div>

      <div class="match-library-summary"><strong data-match-library-visible-count>${operationalMatches.length}</strong><span>partite</span></div>
      <div class="match-library-list" data-match-library-list>${rows || '<div class="empty-state">Nessuna partita futura programmata.</div>'}</div>
      <div class="empty-state" data-match-library-empty hidden>Nessuna gara corrisponde ai filtri selezionati.</div>
      ${agenda}
    </section>`
  }
}
