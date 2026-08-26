import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'

export function createCallupsDirtyState(initialSelectionKey = '') {
  let cleanSelectionKey = String(initialSelectionKey ?? '')
  let dirty = false

  return Object.freeze({
    isDirty: () => dirty,
    onUserSelection(currentSelectionKey) {
      dirty = String(currentSelectionKey ?? '') !== cleanSelectionKey
      return dirty
    },
    commit(submittedSelectionKey, currentSelectionKey) {
      cleanSelectionKey = String(submittedSelectionKey ?? '')
      dirty = String(currentSelectionKey ?? '') !== cleanSelectionKey
      return dirty
    },
    reset(currentSelectionKey) {
      cleanSelectionKey = String(currentSelectionKey ?? '')
      dirty = false
      return dirty
    },
  })
}

export function isTrustedCallupsUserEvent(event, expectedType) {
  return event?.type === expectedType && event?.isTrusted === true
}
export function createCallupsActivationIntent() {
  const armedControls = new WeakSet()
  return Object.freeze({
    arm(control, event) {
      const pointer = event?.type === 'pointerdown'
      const keyboard = event?.type === 'keydown' && (event?.key === ' ' || event?.key === 'Enter')
      if (!control || event?.isTrusted !== true || (!pointer && !keyboard)) return false
      armedControls.add(control)
      return true
    },
    consume(control) {
      if (!control || !armedControls.has(control)) return false
      armedControls.delete(control)
      return true
    },
  })
}

export function wireCallupsEvents({
  root,
  getTeamProfile,
  escapeHtml,
  printHtmlDocument,
  alertUser = globalThis.alert,
  getActiveMatchContext,
  createMatchCallupsService,
  getCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
}) {
  const callupsPanel = root.querySelector('[data-callups-panel]')
  if (!callupsPanel) return
  if (callupsPanel.dataset.callupsEventsWired === 'true') return
  callupsPanel.dataset.callupsEventsWired = 'true'

  const checks = [...callupsPanel.querySelectorAll('[data-callup-player]')]
  const countEl = callupsPanel.querySelector('[data-callups-count]')
  const alertEl = callupsPanel.querySelector('[data-callups-alert]')
  const pdfButton = callupsPanel.querySelector('[data-callups-pdf]')
  const saveButton = callupsPanel.querySelector('[data-callups-save]')
  const selectAllButton = callupsPanel.querySelector('[data-callups-select-all]')
  const clearAllButton = callupsPanel.querySelector('[data-callups-clear-all]')
  const activeMatch = getActiveMatchContext?.()
  const service = createMatchCallupsService?.({ getEvent: getCalendarEvent, updateEvent: updateCalendarEvent, reloadEvents: loadCalendarEvents })

  const selectionKey = () => checks
    .filter((check) => check.checked)
    .map((check) => check.dataset.callupPlayerId || check.value)
    .join('\u001f')

  const dirtyState = createCallupsDirtyState(selectionKey())
  if (alertEl) {
    alertEl.hidden = true
    alertEl.setAttribute('hidden', '')
    alertEl.textContent = ''
  }

  const selectedPlayers = () => checks.filter((check) => check.checked).map((check, index) => ({
    order: index + 1,
    playerId: check.dataset.callupPlayerId || '',
    name: check.value,
    role: check.dataset.callupRole || 'Altro',
    shirtNumber: check.dataset.callupShirtNumber || null,
  }))

  const updateCallups = () => {
    const selected = checks.filter((check) => check.checked)
    selected.forEach((check, index) => {
      check.closest('.callup-player').querySelector('[data-callup-order]').textContent = String(index + 1).padStart(2, '0')
    })
    checks.filter((check) => !check.checked).forEach((check) => {
      check.closest('.callup-player').querySelector('[data-callup-order]').textContent = 'â€”'
    })
    countEl.textContent = String(selected.length)
    pdfButton.disabled = selected.length === 0
    saveButton.disabled = !activeMatch?.id
    if (selectAllButton) selectAllButton.disabled = checks.length === 0 || selected.length === checks.length
    if (clearAllButton) clearAllButton.disabled = selected.length === 0
    if (alertEl) {
      const dirty = dirtyState.isDirty()
      alertEl.hidden = !dirty
      alertEl.textContent = dirty ? 'Modifiche non salvate.' : ''
    }
  }

  const activationIntent = createCallupsActivationIntent()
  const handleCheckboxClick = (event) => {
    const check = event.currentTarget
    if (activationIntent.consume(check) && isTrustedCallupsUserEvent(event, 'click')) {
      dirtyState.onUserSelection(selectionKey())
    }
    updateCallups()
  }
  const handleCheckboxChange = () => {
    updateCallups()
  }
  checks.forEach((check) => {
    const row = check.closest('.callup-player')
    row?.addEventListener('pointerdown', (event) => activationIntent.arm(check, event))
    row?.addEventListener('keydown', (event) => activationIntent.arm(check, event))
    check.addEventListener('click', handleCheckboxClick)
    check.addEventListener('change', handleCheckboxChange)
  })

  const setAllCallups = (checked, event) => {
    checks.forEach((check) => { check.checked = checked })
    if (activationIntent.consume(event.currentTarget) && isTrustedCallupsUserEvent(event, 'click')) {
      dirtyState.onUserSelection(selectionKey())
    }
    updateCallups()
  }
  ;[selectAllButton, clearAllButton].forEach((button) => {
    button?.addEventListener('pointerdown', (event) => activationIntent.arm(button, event))
    button?.addEventListener('keydown', (event) => activationIntent.arm(button, event))
  })
  selectAllButton?.addEventListener('click', (event) => setAllCallups(true, event))
  clearAllButton?.addEventListener('click', (event) => setAllCallups(false, event))

  saveButton?.addEventListener('click', async () => {
    if (!activeMatch?.id || !service) return
    saveButton.disabled = true
    const playersToSave = selectedPlayers()
    const selectionKeyToSave = selectionKey()
    try {
      await service.save(activeMatch.id, playersToSave)
      dirtyState.commit(selectionKeyToSave, selectionKey())
      updateCallups()
      if (alertEl && !dirtyState.isDirty()) {
        alertEl.hidden = false
        alertEl.textContent = 'Convocati salvati. Nostra squadra userÃ  questa selezione.'
      }
    } catch (error) {
      alertUser?.(getDataAccessUserMessage(error, undefined, { stage: 'callups-save' }))
    } finally {
      saveButton.disabled = !activeMatch?.id
    }
  })

  pdfButton?.addEventListener('click', async () => {
    const team = getTeamProfile()
    const selected = selectedPlayers()
    const match = callupsPanel.querySelector('[data-callups-match]').value || 'Partita da definire'
    const date = callupsPanel.querySelector('[data-callups-date]').value || ''
    const roleOrder = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante', 'Altro']
    const roleLabels = { Portiere:'PORTIERI', Difensore:'DIFENSORI', Centrocampista:'CENTROCAMPISTI', Attaccante:'ATTACCANTI', Altro:'ALTRI' }
    const groups = roleOrder.map((role) => ({ role, items:selected.filter((item) => item.role === role) })).filter((group) => group.items.length)
    const logo = team.logo ? `<img src="${escapeHtml(team.logo)}" alt="Logo ${escapeHtml(team.shortName)}">` : `<span>${escapeHtml((team.shortName||'T').slice(0,2).toUpperCase())}</span>`
    const html = `<main class="callups-print"><header>${logo}<div><span class="eyebrow">CONVOCAZIONI</span><h1>${escapeHtml(team.name)}</h1><p>${escapeHtml(match)}</p></div></header><div class="meta"><b>${date ? new Date(date+'T12:00:00').toLocaleDateString('it-IT') : 'Data da definire'}</b><span>${selected.length} convocati</span></div><div class="roles">${groups.map((group)=>`<section class="role"><h2>${roleLabels[group.role] || escapeHtml(group.role.toUpperCase())}</h2><div class="list">${group.items.map(item=>`<div class="player"><b>${String(item.order).padStart(2,'0')}</b><span>${escapeHtml(item.name)}</span></div>`).join('')}</div></section>`).join('')}</div></main>`
    const styles = `@page{size:A4;margin:10mm}*{box-sizing:border-box}html,body{background:#fff!important}.callups-print{font-family:Arial,sans-serif;color:#07194f;width:100%;max-width:190mm;margin:0 auto}.callups-print header{display:flex;align-items:center;gap:16px;border-bottom:4px solid ${escapeHtml(team.primaryColor || '#07194f')};padding-bottom:14px}.callups-print header img,.callups-print header>span{width:64px;height:64px;object-fit:contain;border-radius:12px;display:grid;place-items:center;background:${escapeHtml(team.primaryColor || '#07194f')};color:#fff;font-weight:800;flex:0 0 64px}.callups-print .eyebrow{display:block;font-size:11px;letter-spacing:.14em;font-weight:800;color:${escapeHtml(team.secondaryColor || '#1f93e5')};margin-bottom:4px}.callups-print h1{margin:0;font-size:27px;line-height:1.05}.callups-print p{margin:5px 0 0;font-size:14px}.callups-print .meta{display:flex;justify-content:space-between;gap:24px;margin:16px 0;padding:11px 13px;background:#f1f5f9;border-left:4px solid ${escapeHtml(team.secondaryColor || '#1f93e5')};font-size:13px}.roles{display:grid;gap:12px}.role{break-inside:avoid}.role h2{margin:0 0 6px;font-size:12px;letter-spacing:.12em;color:${escapeHtml(team.secondaryColor || '#1f93e5')};border-bottom:1px solid #d7e0e8;padding-bottom:5px}.list{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.player{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #d4dde5;border-radius:7px;break-inside:avoid;font-size:13px}.player b{min-width:24px;font-size:14px;color:${escapeHtml(team.secondaryColor || '#1f93e5')}}@media print{.callups-print{page-break-after:avoid}.role,.player{break-inside:avoid}}`
    pdfButton.disabled = true
    try { await printHtmlDocument({ title: `Convocazioni - ${team.shortName}`, html, styles }) }
    catch (error) { alertUser?.(getDataAccessUserMessage(error, undefined, { stage: 'callups-print' })) }
    finally { pdfButton.disabled = false }
  })

  updateCallups()
}
