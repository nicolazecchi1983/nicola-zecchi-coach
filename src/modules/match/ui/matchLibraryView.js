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

export function groupMatchesByMonth(matches = []) {
  const groups = new Map()

  matches.forEach((match) => {
    const key = matchMonthKey(match)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(match)
  })

  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      label: matchMonthLabel(key),
      items,
    }))
    .sort((a, b) => {
      if (a.key === 'undated') return 1
      if (b.key === 'undated') return -1
      return b.key.localeCompare(a.key)
    })
}

function calendarMatchOption(event, escapeHtml) {
  const competition = event.matchType === 'friendly' ? 'Amichevole' : event.matchType === 'cup' ? 'Coppa' : 'Campionato'
  const opponent = event.opponent || 'Avversario da definire'
  return `<option value="${escapeHtml(String(event.id))}">${escapeHtml(`${safeDateLabel(String(event.startAt || '').slice(0, 10))} · ${event.time || '--:--'} · ${competition} vs ${opponent}`)}</option>`
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
    const calendarMatches = calendarEvents
      .filter((event) => event.type === 'match')
      .slice()
      .sort((a, b) => String(a.startAt || '').localeCompare(String(b.startAt || '')))
    const competitionOptions = [...new Set(matches.map((match) => match.competition).filter(Boolean))]

    const renderMatchCard = (match) => {
      const outcome = getMatchOutcome(match)
      const dateLabel = safeDateLabel(match.date)
      const result = match.goalsFor == null || match.goalsAgainst == null ? '–' : `${match.goalsFor}–${match.goalsAgainst}`
      const searchText = [match.opponent, match.competition, match.venue, match.season, match.date].join(' ').toLocaleLowerCase('it-IT')
      const locationLabel = match.homeAway === 'away' ? 'Trasferta' : match.homeAway === 'neutral' ? 'Campo neutro' : 'Casa'
      return `<article class="match-library-card" data-match-library-card data-search-text="${escapeHtml(searchText)}" data-competition="${escapeHtml(match.competition)}" data-location="${escapeHtml(match.homeAway)}" data-outcome="${outcome}">
        <div class="match-library-date"><strong>${escapeHtml(dateLabel)}</strong><span>${escapeHtml(match.time || '')}</span></div>
        <div class="match-library-main">
          <span class="match-library-kicker">${escapeHtml(match.competition)}${match.matchDay ? ` · Giornata ${match.matchDay}` : ''}</span>
          <h3>${match.homeAway === 'away' ? escapeHtml(match.opponent) : escapeHtml(getTeamProfile().shortName || 'Noi')} <b>${result}</b> ${match.homeAway === 'away' ? escapeHtml(getTeamProfile().shortName || 'Noi') : escapeHtml(match.opponent)}</h3>
          <p>${escapeHtml(match.venue || 'Impianto da definire')} · ${locationLabel}</p>
        </div>
        <div class="match-library-status"><span>${escapeHtml(match.documentStatus)}</span><small>${match.source === 'calendar' ? 'Calendario' : 'Legacy Library'}</small></div>
        <div class="match-library-actions">
          <button type="button" class="button button--primary" data-open-match-workspace="${escapeHtml(match.id)}" data-match-opponent="${escapeHtml(match.opponent)}" data-match-date="${escapeHtml(match.date)}">Apri partita</button>
          ${match.source === 'library' ? `<button type="button" class="icon-button" data-delete-library-match="${escapeHtml(match.id)}" aria-label="Elimina gara legacy">×</button>` : ''}
        </div>
      </article>`
    }

    const monthGroups = groupMatchesByMonth(matches)
    const currentMonthKey = new Date().toISOString().slice(0, 7)
    const defaultOpenKey = monthGroups.some((group) => group.key === currentMonthKey)
      ? currentMonthKey
      : monthGroups[0]?.key

    const rows = monthGroups.map((group) => `<details class="match-library-month" data-match-library-month="${escapeHtml(group.key)}" ${group.key === defaultOpenKey ? 'open' : ''}>
      <summary>
        <span><strong>${escapeHtml(group.label)}</strong><small><b data-match-month-visible-count>${group.items.length}</b> ${group.items.length === 1 ? 'partita' : 'partite'}</small></span>
        <span class="match-library-month-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="match-library-month-content">${group.items.map(renderMatchCard).join('')}</div>
    </details>`).join('')

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
          <label data-match-calendar-source><span>Partita già nel Calendario</span><select name="calendarEventId" data-match-calendar-event>
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
        <label class="match-library-search"><span class="nav-icon">${icon('search')}</span><input type="search" placeholder="Cerca avversario, competizione o impianto" data-match-library-search></label>
        <select data-match-library-competition><option value="">Tutte le competizioni</option>${competitionOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select>
        <select data-match-library-location><option value="">Casa, trasferta e neutro</option><option value="home">Casa</option><option value="away">Trasferta</option><option value="neutral">Campo neutro</option></select>
        <select data-match-library-outcome><option value="">Tutti i risultati</option><option value="win">Vittorie</option><option value="draw">Pareggi</option><option value="loss">Sconfitte</option><option value="pending">Da giocare</option></select>
      </div>

      <div class="match-library-summary"><strong data-match-library-visible-count>${matches.length}</strong><span>partite</span></div>
      <div class="match-library-list" data-match-library-list>${rows || '<div class="empty-state">Nessuna partita presente. Creala dal Calendario oppure da qui.</div>'}</div>
      <div class="empty-state" data-match-library-empty hidden>Nessuna gara corrisponde ai filtri selezionati.</div>
    </section>`
  }
}
