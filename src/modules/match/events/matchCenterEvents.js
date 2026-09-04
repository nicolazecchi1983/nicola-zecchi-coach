import { createMatchCenterService } from '../matchCenterService.js'
import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'

function selectedPlayer(form, name) {
  const select = form?.elements?.[name]
  const option = select?.selectedOptions?.[0]
  return {
    playerId: String(option?.dataset?.playerId || ''),
    name: String(option?.dataset?.playerName || ''),
  }
}

function integerField(form, name) {
  const value = Number(form?.elements?.[name]?.value)
  return Number.isInteger(value) ? value : null
}

function samePlayer(left = {}, right = {}) {
  if (left.playerId && right.playerId) return left.playerId === right.playerId
  return Boolean(left.name && right.name && left.name === right.name)
}

function setMessage(node, text, type = '') {
  if (!node) return
  node.textContent = text
  node.dataset.type = type
}

export function wireMatchCenterEvents({
  root,
  getActiveMatchContext,
  getCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
  setView,
  confirmUser = globalThis.confirm,
}) {
  const host = root.querySelector('[data-match-center]')
  if (!host) return

  const activeMatch = getActiveMatchContext()
  if (!activeMatch?.id) return

  const service = createMatchCenterService({
    getEvent: getCalendarEvent,
    updateEvent: updateCalendarEvent,
    reloadEvents: loadCalendarEvents,
  })

  const rerender = async () => {
    await setView('match-center', 'Match Center')
  }

  const stateForm = host.querySelector('[data-match-center-state-form]')
  stateForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const submit = stateForm.querySelector('[type="submit"]')
    const message = stateForm.querySelector('[data-match-center-message]')
    if (!submit) return

    submit.disabled = true
    setMessage(message, 'Salvataggio…')

    try {
      await service.setMatchState(activeMatch.id, {
        status: stateForm.elements.match_center_status?.value,
        period: stateForm.elements.match_center_period?.value,
        score: {
          our: integerField(stateForm, 'match_center_score_our'),
          opponent: integerField(stateForm, 'match_center_score_opponent'),
        },
      })
      await rerender()
    } catch (error) {
      console.error('Aggiornamento Match Center non riuscito:', error)
      setMessage(message, getDataAccessUserMessage(error, undefined, { stage: 'match-center-state-save' }), 'error')
      submit.disabled = false
    }
  })

  host.querySelectorAll('[data-match-center-event-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const type = form.dataset.matchCenterEventForm
      const submit = form.querySelector('[type="submit"]')
      const message = host.querySelector('[data-match-center-event-message]')
      if (!submit) return

      const base = {
        type,
        side: form.elements.side?.value || 'our',
        minute: integerField(form, 'minute'),
        addedMinute: integerField(form, 'added_minute') || 0,
      }

      let payload = base
      if (type === 'goal') {
        payload = {
          ...base,
          scorer: base.side === 'our' ? selectedPlayer(form, 'scorer') : { playerId: '', name: '' },
          assist: base.side === 'our' ? selectedPlayer(form, 'assist') : { playerId: '', name: '' },
        }
      } else if (type === 'substitution') {
        const out = selectedPlayer(form, 'out')
        const incoming = selectedPlayer(form, 'in')
        if (samePlayer(out, incoming)) {
          setMessage(message, 'Il giocatore che entra deve essere diverso da quello che esce.', 'error')
          return
        }
        payload = {
          ...base,
          side: 'our',
          out,
          in: incoming,
          reason: form.elements.reason?.value || '',
        }
      } else if (type === 'sanction') {
        payload = {
          ...base,
          player: base.side === 'our' ? selectedPlayer(form, 'player') : { playerId: '', name: '' },
          sanction: form.elements.sanction?.value || 'yellow',
        }
      } else if (type === 'formation_change') {
        payload = {
          ...base,
          formation: String(form.elements.formation?.value || '').trim(),
        }
      }

      submit.disabled = true
      setMessage(message, 'Registrazione evento…')

      try {
        await service.appendEvent(activeMatch.id, payload)
        await rerender()
      } catch (error) {
        console.error('Registrazione evento Match Center non riuscita:', error)
        setMessage(message, getDataAccessUserMessage(error, undefined, { stage: 'match-center-event-save' }), 'error')
        submit.disabled = false
      }
    })
  })

  host.addEventListener('click', async (event) => {
    const remove = event.target.closest('[data-match-center-remove]')
    if (!remove || remove.disabled) return

    const eventId = String(remove.dataset.matchCenterRemove || '')
    if (!eventId || !confirmUser?.('Rimuovere questo evento dalla timeline?')) return

    remove.disabled = true
    try {
      await service.removeEvent(activeMatch.id, eventId)
      await rerender()
    } catch (error) {
      console.error('Rimozione evento Match Center non riuscita:', error)
      setMessage(
        host.querySelector('[data-match-center-event-message]'),
        getDataAccessUserMessage(error, undefined, { stage: 'match-center-event-remove' }),
        'error',
      )
      remove.disabled = false
    }
  })
}
