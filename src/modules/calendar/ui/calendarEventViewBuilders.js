/**
 * Calendar event presentation builders.
 *
 * Owns Calendar drawer + create/edit event markup and facility option rendering.
 * Runtime behavior and persistence remain in calendarRuntimeActions.
 */
export function createCalendarEventViewBuilders(deps) {
  const {
    getFacilities, getTeamLocationOptions, hasTeamLocation, escapeHtml, icon,
    eventTypeIcon, matchTypeLabel, isTrainingEventType, trainingSheetName,
    trainingSheetStructuredHtml, trainingSheetPreviewHtml, can, capabilities,
    trainingCalendarStatus, formatDateInputValue,
  } = deps

  function teamLocationSelectOptions(selected = '') {
    const locations = getTeamLocationOptions(getFacilities())
    const selectedValue = String(selected || '').trim()
    const selectedFacility = locations.find((location) => location.toLocaleLowerCase('it-IT') === selectedValue.toLocaleLowerCase('it-IT')) || ''
    const options = ['<option value="">Seleziona campo</option>']
    locations.forEach((location) => {
      options.push(`<option value="${escapeHtml(location)}" ${location === selectedFacility ? 'selected' : ''}>${escapeHtml(location)}</option>`)
    })
    options.push(`<option value="__custom__" ${selectedValue && !selectedFacility ? 'selected' : ''}>Altro campo…</option>`)
    return options.join('')
  }

  function isConfiguredTeamFacility(value = '') {
    return hasTeamLocation(getTeamLocationOptions(getFacilities()), value)
  }

  function drawerHtml(event) {
    const eventDate = new Date(event.startAt)
    const formattedDate = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(eventDate)

    return `
      <div class="drawer-backdrop" data-close-drawer></div>

      <aside class="event-drawer">
        <div class="drawer-head">
          <div>
            <span class="event-type-badge event-type-badge--${event.type}">
              ${eventTypeIcon(event.type, icon)}
              ${event.title.toUpperCase()}
            </span>
            <h2 class="drawer-event-date">${formattedDate}</h2>
            <time class="drawer-event-time">${event.time}</time>
          </div>

          <button type="button" data-close-drawer aria-label="Chiudi">
            ${icon('close')}
          </button>
        </div>

        <div class="drawer-section">
          <div class="event-info-grid">
            <div class="event-info-card">
              <span>Campo</span>
              <strong class="event-info-card__value">
                <i class="event-info-card__icon">${icon('location')}</i>
                ${event.place || 'Non indicato'}
              </strong>
            </div>

            ${event.type === 'match' && event.matchType ? `
                  <div class="event-info-card">
                    <span>Tipo partita</span>
                    <strong class="event-info-card__value">${escapeHtml(matchTypeLabel(event.matchType))}</strong>
                  </div>` : ''}

            ${event.type === 'match' && event.opponent ? `
                  <div class="event-info-card">
                    <span>Avversario</span>
                    <strong class="event-info-card__value">${escapeHtml(event.opponent)}</strong>
                  </div>` : ''}

            ${isTrainingEventType(event.type)
              ? `
                  <div class="event-info-card">
                    <span>Match Day</span>
                    <strong class="event-info-card__value">${event.matchDay || 'Nessuno'}</strong>
                  </div>
                `
              : ''}
          </div>
        </div>

        ${isTrainingEventType(event.type)
          ? `
              <div class="drawer-section">
                <label>Training Sheet</label>

                <div class="training-sheet-meta">
                  <div><span>Data</span><strong>${eventDate.toLocaleDateString('it-IT')}</strong></div>
                  <div><span>Ora</span><strong>${event.time}</strong></div>
                  <div><span>Campo</span><strong>${event.place || 'Non indicato'}</strong></div>
                  <div><span>Match Day</span><strong>${event.matchDay || 'Nessuno'}</strong></div>
                  <div><span>Presenti</span><strong>${event.presentCount ?? '—'}${event.squadTotal ? `/${event.squadTotal}` : ''}</strong></div>
                </div>

                ${trainingSheetStructuredHtml(event)}
                <div class="training-sheet-preview-wrap">
                  ${trainingSheetPreviewHtml(event)}
                </div>

                ${event.trainingSheetUrl && can(capabilities.TRAINING_SHEET_VIEW_PUBLISHED) ? `
                  <div class="drawer-ts-view-actions">
                    <button class="wide-button drawer-sheet-link" type="button" data-view-training-sheet="${event.id}"><span class="drawer-sheet-link__icon">${icon('sheet')}</span><span>Visualizza Training Sheet</span></button>
                  </div>` : ''}
                ${can(capabilities.TRAINING_SHEET_EDIT) ? `
                  <div class="drawer-ts-owner-actions">
                    <button class="wide-button" type="button" data-open-training-sheet-editor="${event.id}">${icon('sheet')} ${trainingCalendarStatus(event) === 'published' ? 'Apri nel TS Editor' : 'Crea Training Sheet'}</button>
                  </div>` : ''}
              </div>
            `
          : ''}

        ${can(capabilities.CALENDAR_UPDATE) || can(capabilities.CALENDAR_DELETE)
          ? `
              <div class="drawer-actions">
                ${can(capabilities.CALENDAR_UPDATE) ? `<button
                  type="button"
                  class="portal-action-button portal-action-button--secondary"
                  data-edit-event="${event.id}"
                >
                  Modifica evento
                </button>` : ''}

                ${can(capabilities.CALENDAR_DELETE) ? `<button
                  class="danger-button drawer-delete-button"
                  type="button"
                  data-delete-event="${event.id}"
                >
                  Elimina evento
                </button>` : ''}
              </div>
            `
          : ''}
      </aside>
    `
  }

  function newEventModalHtml(selectedDate = formatDateInputValue(new Date())) {
    const today = selectedDate

    return `
      <div class="new-event-modal-backdrop" data-close-new-event>
        <section
          class="new-event-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="newEventTitle"
        >
          <div class="new-event-modal__head">
            <div>
              <span>CALENDARIO</span>
              <h2 id="newEventTitle">Nuovo evento</h2>
            </div>

            <button
              class="new-event-modal__close"
              type="button"
              data-close-new-event
              aria-label="Chiudi"
            >
              ${icon('close')}
            </button>
          </div>

          <form id="newEventForm" class="new-event-form">
            <label>
              Tipo evento
              <select name="eventType" required>
                <option value="training">Allenamento</option>
                <option value="match">Partita</option>
                <option value="meeting">Riunione</option>
                <option value="rest">Riposo</option>
              </select>
            </label>

            <div data-match-fields hidden>
              <label>
                Tipo partita
                <select name="matchType">
                  <option value="friendly">Amichevole</option>
                  <option value="cup">Coppa</option>
                  <option value="league">Campionato</option>
                </select>
              </label>
              <label>
                Avversario
                <input name="opponent" type="text" maxlength="80" autocomplete="off" value="Da definire" placeholder="Nome squadra avversaria">
              </label>
            </div>

            <div data-standard-event-fields>
              <div class="new-event-form__row">
                <label>
                  Data
                  <input name="date" type="date" value="${today}" required>
                </label>

                <label>
                  Ora
                  <input name="time" type="time" value="17:30" required>
                </label>
              </div>

              <label data-location-select-field>
                Campo
                <select name="location">
                  ${teamLocationSelectOptions()}
                </select>
              </label>

              <label data-custom-location hidden>
                <span data-custom-location-label>Nome campo / impianto</span>
                <input name="customLocation" type="text" maxlength="100" autocomplete="off" placeholder="Scrivi il nome del campo">
              </label>

            <label data-md-field>
              MD
              <select name="matchDay">
                <option value="">Nessuno</option>
                <option value="MD">MD</option>
                <option value="MD-1">MD-1</option>
                <option value="MD-2">MD-2</option>
                <option value="MD-3">MD-3</option>
                <option value="MD+1">MD+1</option>
                <option value="MD+2">MD+2</option>
                <option value="MD+3">MD+3</option>
              </select>
            </label>

            <div class="new-event-form__document-info" data-training-sheet-info>
              <span>Training Sheet</span>
              <strong>Si crea dopo aver salvato l’allenamento</strong>
              <small>Salva l’evento, poi usa “Crea Training Sheet” dal dettaglio nel Calendario.</small>
            </div>

            </div>

            <label data-rest-fields hidden>
              Note riposo
              <textarea name="restNote" rows="7" maxlength="1200" placeholder="Motivo, indicazioni o comunicazioni per la giornata di riposo"></textarea>
            </label>

            <p
              id="newEventMessage"
              class="new-event-form__message"
              aria-live="polite"
            ></p>

            <div class="new-event-modal__actions">
              <button
                class="new-event-modal__secondary"
                type="button"
                data-close-new-event
              >
                Annulla
              </button>

              <button
                id="saveNewEventButton"
                class="primary-action"
                type="submit"
              >
                Salva evento
              </button>
            </div>
          </form>
        </section>
      </div>
    `
  }

  function editEventModalHtml(event) {
    const localDate = new Date(event.startAt)
    const date = formatDateInputValue(localDate)
    const time = localDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const restNote = (() => {
      try { return JSON.parse(event.rawNotes || '{}')?.rest_note || '' } catch { return '' }
    })()

    return `
      <div class="new-event-modal-backdrop" data-close-new-event>
        <section
          class="new-event-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editEventTitle"
        >
          <div class="new-event-modal__head">
            <div>
              <span>CALENDARIO</span>
              <h2 id="editEventTitle">Modifica evento</h2>
            </div>

            <button
              class="new-event-modal__close"
              type="button"
              data-close-new-event
              aria-label="Chiudi"
            >
              ${icon('close')}
            </button>
          </div>

          <form id="editEventForm" class="new-event-form">
            <input name="eventId" type="hidden" value="${event.id}">

            <label>
              Tipo evento
              <select name="eventType" required>
                <option value="training" ${event.type === 'training' ? 'selected' : ''}>
                  Allenamento
                </option>
                <option value="match" ${event.type === 'match' ? 'selected' : ''}>
                  Partita
                </option>
                <option value="meeting" ${event.type === 'meeting' ? 'selected' : ''}>
                  Riunione
                </option>
                <option value="rest" ${event.type === 'rest' ? 'selected' : ''}>
                  Riposo
                </option>
              </select>
            </label>

            <div data-match-fields ${event.type === 'match' ? '' : 'hidden'}>
              <label>
                Tipo partita
                <select name="matchType">
                  <option value="friendly" ${event.matchType === 'friendly' ? 'selected' : ''}>Amichevole</option>
                  <option value="cup" ${event.matchType === 'cup' ? 'selected' : ''}>Coppa</option>
                  <option value="league" ${event.matchType === 'league' ? 'selected' : ''}>Campionato</option>
                </select>
              </label>
              <label>
                Avversario
                <input name="opponent" type="text" maxlength="80" autocomplete="off" value="${escapeHtml(event.opponent || 'Da definire')}" placeholder="Nome squadra avversaria">
              </label>
            </div>

            <div data-standard-event-fields>
            <div class="new-event-form__row">
              <label>
                Data
                <input name="date" type="date" value="${date}" required>
              </label>

              <label>
                Ora
                <input name="time" type="time" value="${time}" required>
              </label>
            </div>

            <label data-location-select-field>
              Campo
              <select name="location">
                ${teamLocationSelectOptions(event.place)}
              </select>
            </label>

            <label data-custom-location hidden>
              <span data-custom-location-label>Nome campo / impianto</span>
              <input name="customLocation" type="text" maxlength="100" autocomplete="off" value="${escapeHtml(event.place && !isConfiguredTeamFacility(event.place) ? event.place : '')}" placeholder="Scrivi il nome del campo">
            </label>

            <label data-md-field ${isTrainingEventType(event.type) ? '' : 'hidden'}>
              MD
              <select name="matchDay">
                <option value="" ${!event.matchDay ? 'selected' : ''}>Nessuno</option>
                <option value="MD" ${event.matchDay === 'MD' ? 'selected' : ''}>MD</option>
                <option value="MD-1" ${event.matchDay === 'MD-1' ? 'selected' : ''}>MD-1</option>
                <option value="MD-2" ${event.matchDay === 'MD-2' ? 'selected' : ''}>MD-2</option>
                <option value="MD-3" ${event.matchDay === 'MD-3' ? 'selected' : ''}>MD-3</option>
                <option value="MD+1" ${event.matchDay === 'MD+1' ? 'selected' : ''}>MD+1</option>
                <option value="MD+2" ${event.matchDay === 'MD+2' ? 'selected' : ''}>MD+2</option>
                <option value="MD+3" ${event.matchDay === 'MD+3' ? 'selected' : ''}>MD+3</option>
              </select>
            </label>

            <div
              class="new-event-form__document-info"
              data-training-sheet-info
              ${isTrainingEventType(event.type) ? '' : 'hidden'}
            >
              <span>Training Sheet</span>
              <strong>${event.trainingSheetPath ? `${trainingSheetName(event)} · Pubblicata` : 'Nessuna Training Sheet collegata'}</strong>
              <small>${event.trainingSheetPath
                ? 'La Training Sheet si modifica dal suo Editor, non caricando un file dal Calendario.'
                : 'Salva l’evento, poi usa “Crea Training Sheet” dal dettaglio nel Calendario.'}</small>
            </div>

            </div>

            <label data-rest-fields ${event.type === 'rest' ? '' : 'hidden'}>
              Note riposo
              <textarea name="restNote" rows="7" maxlength="1200" placeholder="Motivo, indicazioni o comunicazioni per la giornata di riposo">${escapeHtml(restNote)}</textarea>
            </label>

            <p
              id="newEventMessage"
              class="new-event-form__message"
              aria-live="polite"
            ></p>

            <div class="new-event-modal__actions">
              <button
                class="new-event-modal__secondary"
                type="button"
                data-close-new-event
              >
                Annulla
              </button>

              <button
                id="saveNewEventButton"
                class="primary-action"
                type="submit"
              >
                Salva modifiche
              </button>
            </div>
          </form>
        </section>
      </div>
    `
  }

  return {
    teamLocationSelectOptions,
    isConfiguredTeamFacility,
    drawerHtml,
    newEventModalHtml,
    editEventModalHtml,
  }
}
