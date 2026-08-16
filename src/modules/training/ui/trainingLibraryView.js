import { escapeHtml } from '../../../shared/html/escapeHtml.js'

function startOfWeek(dateLike) {
  const date = new Date(dateLike)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

function endOfWeek(dateLike) {
  const date = startOfWeek(dateLike)
  date.setDate(date.getDate() + 6)
  return date
}

function dateKey(dateLike) {
  const date = new Date(dateLike)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function trainingSheetName(event) {
  const rawName = decodeURIComponent(String(event.trainingSheetPath ?? '').split('/').pop() || '')
    .replace(/^[0-9a-f-]{36}-/i, '').replace(/\.(png|jpe?g|webp|pdf)$/i, '').replace(/[-_]+/g, ' ').trim()
  const codeMatch = rawName.match(/\bA(?:L|LL)\s*0*(\d{1,3})\b/i)
  return codeMatch ? `AL_${String(codeMatch[1]).padStart(3, '0')}` : rawName || `TS ${new Date(event.startAt).toLocaleDateString('it-IT')}`
}

function formatSheetDate(dateLike) {
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateLike))
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = endOfWeek(start)
  const startText = new Intl.DateTimeFormat('it-IT', { day: 'numeric', ...(start.getMonth() === end.getMonth() ? {} : { month: 'long' }) }).format(start)
  const endText = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' }).format(end)
  return `${startText} – ${endText}`
}

function buildGroups(events) {
  const months = new Map()
  events.filter((event) => event.trainingSheetPath).sort((a, b) => new Date(b.startAt) - new Date(a.startAt)).forEach((event) => {
    const weekStart = startOfWeek(event.startAt)
    const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`
    const weekKey = dateKey(weekStart)
    if (!months.has(monthKey)) months.set(monthKey, { key: monthKey, date: new Date(weekStart.getFullYear(), weekStart.getMonth(), 1), weeks: new Map(), count: 0 })
    const month = months.get(monthKey)
    if (!month.weeks.has(weekKey)) month.weeks.set(weekKey, { key: weekKey, start: weekStart, items: [] })
    month.weeks.get(weekKey).items.push(event)
    month.count += 1
  })
  return Array.from(months.values()).sort((a, b) => b.date - a.date).map((month) => ({ ...month, weeks: Array.from(month.weeks.values()).sort((a, b) => b.start - a.start) }))
}

function phaseDuration(data = {}) {
  return (Array.isArray(data.phases) ? data.phases : [])
    .reduce((sum, phase) => sum + Math.max(0, Number(phase?.duration || 0)), 0)
}

function feedbackLabel(value) {
  return ({ green: 'Positivo', yellow: 'Da rivedere', red: 'Critico' })[value] || 'Non valutato'
}

function feedbackDot(value) {
  return value ? `<span class="library-feedback-dot is-${value}" aria-hidden="true"></span>` : '<span class="library-feedback-dot" aria-hidden="true"></span>'
}

function renderFeedbackEditor(event) {
  const feedback = event.libraryFeedback || {}
  const selected = feedback.trafficLight || ''
  return `<div class="library-feedback-editor" data-library-feedback-editor="${escapeHtml(event.id)}" hidden>
    <div class="library-feedback-editor-head">
      <div><strong>Valutazione seduta</strong><small>Facoltativa. Puoi modificarla in qualsiasi momento.</small></div>
      <button type="button" class="library-feedback-close" data-library-feedback-cancel="${escapeHtml(event.id)}" aria-label="Chiudi">×</button>
    </div>
    <div class="library-traffic-light" role="group" aria-label="Valutazione della seduta">
      <button type="button" class="library-traffic-choice is-green ${selected === 'green' ? 'is-selected' : ''}" data-feedback-value="green" title="Positivo"><span></span>Positivo</button>
      <button type="button" class="library-traffic-choice is-yellow ${selected === 'yellow' ? 'is-selected' : ''}" data-feedback-value="yellow" title="Da rivedere"><span></span>Da rivedere</button>
      <button type="button" class="library-traffic-choice is-red ${selected === 'red' ? 'is-selected' : ''}" data-feedback-value="red" title="Critico"><span></span>Critico</button>
      <button type="button" class="library-traffic-choice is-clear ${!selected ? 'is-selected' : ''}" data-feedback-value="">Nessuno</button>
    </div>
    <label class="library-feedback-notes"><span>Note tecniche</span><textarea name="library_feedback_notes" rows="4" maxlength="1500" data-library-feedback-notes placeholder="Aggiungi una nota solo se ti serve...">${escapeHtml(feedback.notes || '')}</textarea></label>
    <div class="library-feedback-actions">
      <span class="library-feedback-message" data-library-feedback-message></span>
      <button type="button" class="button" data-library-feedback-cancel="${escapeHtml(event.id)}">Annulla</button>
      <button type="button" class="button button--primary" data-library-feedback-save="${escapeHtml(event.id)}">Salva</button>
    </div>
  </div>`
}

function renderSheetCard(event, { canEditFeedback, icon }) {
  const data = event.editorData || {}
  const feedback = event.libraryFeedback || {}
  const duration = phaseDuration(data)
  const md = event.matchDay || '—'
  const focus = String(data.focus || '').trim()
  const objective = String(data.objective || '').trim()
  const principles = String(data.principles || '').trim()
  const notes = String(feedback.notes || '').trim()

  const searchText = [
    trainingSheetName(event),
    formatSheetDate(event.startAt),
    event.time || '',
    event.place || '',
    md,
    focus,
    objective,
    principles,
    notes,
    feedbackLabel(feedback.trafficLight),
  ].join(' ').toLocaleLowerCase('it-IT')

  return `<article class="library-sheet-card" data-library-sheet data-search-text="${escapeHtml(searchText)}" data-library-md="${escapeHtml(md)}" data-library-feedback="${escapeHtml(feedback.trafficLight || 'none')}">
    <div class="library-sheet-summary">
      <div class="library-sheet-mark">${icon('sheet')}</div>
      <div class="library-sheet-main">
        <div class="library-sheet-title-row">
          <h3>${escapeHtml(trainingSheetName(event))}</h3>
          <span class="library-published-badge">Pubblicata</span>
          <span class="library-feedback-badge" data-library-feedback-badge="${escapeHtml(event.id)}">${feedbackDot(feedback.trafficLight)}${escapeHtml(feedbackLabel(feedback.trafficLight))}</span>
        </div>
        <div class="library-sheet-meta">
          <span>${escapeHtml(formatSheetDate(event.startAt))} · ${escapeHtml(event.time || '')}</span>
          <span>${escapeHtml(event.place || 'Campo non indicato')}</span>
          <span>${escapeHtml(md)}</span>
          <span>Presenti ${escapeHtml(event.presentCount ?? '—')}${event.squadTotal ? `/${escapeHtml(event.squadTotal)}` : ''}</span>
          ${duration ? `<span>${duration}'</span>` : ''}
          ${data.intensity ? `<span>I${escapeHtml(data.intensity)}</span>` : ''}
          ${data.volume ? `<span>V${escapeHtml(data.volume)}</span>` : ''}
        </div>
        ${objective ? `<p class="library-sheet-objective"><b>Obiettivo:</b> ${escapeHtml(objective)}</p>` : ''}
        ${focus ? `<div class="library-sheet-tags"><span>${escapeHtml(focus)}</span></div>` : ''}
        ${notes ? `<p class="library-sheet-note-preview" data-library-note-preview="${escapeHtml(event.id)}">${escapeHtml(notes)}</p>` : `<p class="library-sheet-note-preview is-empty" data-library-note-preview="${escapeHtml(event.id)}">Nessuna nota tecnica.</p>`}
      </div>
      <div class="library-sheet-actions">
        ${canEditFeedback ? `<button class="library-feedback-button" type="button" data-library-feedback-open="${escapeHtml(event.id)}">Valutazione e note</button>` : ''}
        <button class="library-open-button" type="button" data-open-event="${escapeHtml(event.id)}">Apri</button>
      </div>
    </div>
    ${canEditFeedback ? renderFeedbackEditor(event) : ''}
  </article>`
}

export function renderTrainingLibraryView({ events, canCreate, canEditFeedback, icon }) {
  const trainingEvents = events.filter((event) => event.trainingSheetPath)
  const groups = buildGroups(trainingEvents)
  const nowWeek = startOfWeek(new Date())
  const currentWeekKey = dateKey(nowWeek)
  const currentMonthKey = `${nowWeek.getFullYear()}-${String(nowWeek.getMonth() + 1).padStart(2, '0')}`
  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
  const mdValues = [...new Set(trainingEvents.map((event) => event.matchDay).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'))

  return `<section class="view page-view product-page-shell training-library-view">
    <div class="page-head product-page-header training-library-head"><div><h1>Training Library</h1><p>Memoria tecnica delle sedute pubblicate.</p></div>
      ${canCreate ? `<button class="primary-action" type="button" data-new-event>${icon('plus')}Nuova Training Sheet</button>` : ''}</div>
    <div class="library-toolbar library-toolbar--compact">
      <div class="library-search-wrap"><span class="library-search-icon">${icon('search')}</span><input name="library_search" class="library-search" type="search" placeholder="Cerca obiettivi, focus, principi, note..." aria-label="Cerca Training Sheet" data-library-search></div>
      <details class="library-filter-menu">
        <summary>Filtri</summary>
        <div class="library-filter-panel">
          <label><span>Match Day</span><select name="library_md_filter" class="library-filter" data-library-md-filter aria-label="Filtra per Match Day"><option value="">Tutti</option>${mdValues.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label>
          <label><span>Valutazione</span><select name="library_feedback_filter" class="library-filter" data-library-feedback-filter aria-label="Filtra per valutazione"><option value="">Tutte</option><option value="green">Positivo</option><option value="yellow">Da rivedere</option><option value="red">Critico</option><option value="none">Non valutato</option></select></label>
        </div>
      </details>
    </div>
    <div class="library-summary"><strong>${trainingEvents.length}</strong><span>Training Sheet pubblicate</span></div>
    <div class="training-library" data-library-root>
      ${groups.length ? groups.map((month) => `<details class="library-month" ${month.key === currentMonthKey ? 'open' : ''} data-library-month>
        <summary><span class="library-folder-icon">${icon('library')}</span><strong>${capitalize(new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(month.date))}</strong><span class="library-count">${month.count}</span><span class="library-chevron">⌄</span></summary>
        <div class="library-month-content">${month.weeks.map((week) => `<details class="library-week" ${week.key === currentWeekKey ? 'open' : ''} data-library-week>
          <summary><span><strong>${formatWeekRange(week.start)}</strong><small>${week.items.length} Training Sheet</small></span><span class="library-chevron">⌄</span></summary>
          <div class="library-sheet-list">${week.items.map((event) => renderSheetCard(event, { canEditFeedback, icon })).join('')}</div></details>`).join('')}</div></details>`).join('') : `<div class="library-empty-state"><div>${icon('sheet')}</div><h2>Nessuna Training Sheet</h2><p>Le Training Sheet pubblicate compariranno qui automaticamente.</p></div>`}
    </div><div class="library-no-results" data-library-no-results hidden>Nessuna Training Sheet corrisponde ai filtri selezionati.</div>
  </section>`
}
