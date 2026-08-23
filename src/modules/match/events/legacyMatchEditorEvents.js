import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'
export function wireLegacyMatchEditorEvents({
  root,
  getActiveMatchContext,
  createMatchDraftService,
  storage = globalThis.localStorage,
  getTrainingSheetRosterPlayers,
  escapeHtml,
  getFormationLayout,
  getCustomFormationLayout,
  getTeamProfile,
  createMatchReportRenderer,
  createMatchReportService,
  formationOptionsHtml,
  bindStaffColorPickers,
  bindMatchAnalysisSchemaEditors,
  analysisTemplateOptions,
  createMatchCalendarService,
  createMatchOpponentStudyService,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  loadCalendarEvents,
  appState,
  printMatchReport,
  windowRef = globalThis.window,
  documentRef = globalThis.document,
  urlApi = globalThis.URL,
  requestFrame = globalThis.requestAnimationFrame,
}) {
    const matchEditor = root.querySelector('[data-match-editor]')
    if (matchEditor) {
      const form = matchEditor.querySelector('[data-match-form]')
      const steps = [...matchEditor.querySelectorAll('[data-match-step]')]
      const stepButtons = [...matchEditor.querySelectorAll('[data-match-step-button]')]
      const prev = matchEditor.querySelector('[data-match-prev]')
      const next = matchEditor.querySelector('[data-match-next]')
      const finalSave = matchEditor.querySelector('[data-match-save-final]')
      const progress = matchEditor.querySelector('[data-match-progress]')
      const state = matchEditor.querySelector('[data-match-save-state]')
      const activeMatchForDraft = getActiveMatchContext()
      const draftService = createMatchDraftService({ storage: storage, storageKey: activeMatchForDraft?.id ? `nz-match-sheet-editor-v2:${activeMatchForDraft.id}` : undefined })
      const matchRosterOptions = getTrainingSheetRosterPlayers()
        .map((player) => `<option value="${escapeHtml(player.canonicalName)}">${escapeHtml(player.surname)} ${escapeHtml(player.firstName)}</option>`)
        .join('')
      let activeStep = 1
      let saveTimer
      let hasSavedTokenPositions = false
      let hasSavedOpponentTokenPositions = false
      let restoredLeadership = null
      const showStep = (value) => {
        activeStep = Math.min(5, Math.max(1, Number(value)))
        steps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.matchStep) === activeStep))
        stepButtons.forEach((button) => button.classList.toggle('is-active', Number(button.dataset.matchStepButton) === activeStep))
        prev.disabled = activeStep === 1
        next.hidden = activeStep === 5
        finalSave.hidden = activeStep !== 5
        progress.textContent = `Passaggio ${activeStep} di 5`
        renderReport()
        windowRef.scrollTo({top:0, behavior:'smooth'})
      }
      const syncCompactScore = (prefix) => {
        const display = form.elements[prefix]
        const home = form.elements[`${prefix}_home`]
        const away = form.elements[`${prefix}_away`]
        if (!display || !home || !away) return
        const left = String(home.value || '').replace(/\D/g, '').slice(0, 2)
        const right = String(away.value || '').replace(/\D/g, '').slice(0, 2)
        home.value = left
        away.value = right
        display.value = left || right ? `${left || 0}-${right || 0}` : ''
      }
      const bindCompactScore = (prefix) => {
        const home = form.elements[`${prefix}_home`]
        const away = form.elements[`${prefix}_away`]
        if (!home || !away) return
        home.addEventListener('input', () => {
          syncCompactScore(prefix)
          if (home.value.length === 1) away.focus()
        })
        away.addEventListener('input', () => syncCompactScore(prefix))
        away.addEventListener('keydown', (event) => {
          if (event.key === 'Backspace' && !away.value) home.focus()
        })
      }
      bindCompactScore('result')
      bindCompactScore('half_result')
      const collect = () => draftService.collect(form)
      const save = () => {
        draftService.save(form)
        if (state) state.textContent = 'Bozza salvata'
      }
      const scheduleSave = () => {
        if (state) state.textContent = 'Salvataggio…'
        clearTimeout(saveTimer)
        saveTimer = setTimeout(save, 350)
      }
      const renderNotes = () => {
        const rootNotes = matchEditor.querySelector('[data-note-fields]')
        const mode = form.elements.notes_mode.value
        const labels = mode==='halves' ? ['Primo tempo','Intervallo','Secondo tempo','Considerazioni finali'] : mode==='quarters' ? ['0’–15’','16’–30’','31’–45’','46’–60’','61’–75’','76’–90’','Recupero'] : ['Note partita']
        rootNotes.innerHTML = `<div class="dynamic-notes-grid ${mode==='free'?'single':''}">${labels.map((label,i)=>`<label><span>${label}</span><textarea name="own_note_${i}" rows="${mode==='free'?12:5}"></textarea></label>`).join('')}</div>`
      }
      const eventContainers = {
        substitution: matchEditor.querySelector('[data-substitutions]'),
        goal: matchEditor.querySelector('[data-goals]'),
        card: matchEditor.querySelector('[data-cards]'),
      }
      const eventRowCounts = { substitution: 0, goal: 0, card: 0 }
      const eventRowMarkup = (type, index, values = {}) => {
        const remove = '<button type="button" class="event-remove-button" data-remove-match-row aria-label="Rimuovi riga">×</button>'
        if (type === 'substitution') return `<div class="event-row event-row--sub" data-match-row="substitution"><input type="number" name="sub_minute_${index}" min="1" max="130" placeholder="Min." value="${escapeHtml(values.minute || '')}"><select name="sub_out_${index}"><option value="">Esce</option>${matchRosterOptions}</select><select name="sub_in_${index}"><option value="">Entra</option>${matchRosterOptions}</select><select name="sub_reason_${index}"><option>Tattico</option><option>Tecnico</option><option>Fisico</option><option>Infortunio</option><option>Gestione</option></select>${remove}</div>`
        if (type === 'goal') return `<div class="event-row event-row--goal" data-match-row="goal"><input type="number" name="goal_minute_${index}" min="1" max="130" placeholder="Min." value="${escapeHtml(values.minute || '')}"><select name="scorer_${index}"><option value="">Marcatore</option>${matchRosterOptions}</select><select name="assist_${index}"><option value="">Assist</option>${matchRosterOptions}</select>${remove}</div>`
        return `<div class="event-row event-row--card" data-match-row="card"><input type="number" name="card_minute_${index}" min="1" max="130" placeholder="Min." value="${escapeHtml(values.minute || '')}"><select name="card_player_${index}"><option value="">Giocatore</option>${matchRosterOptions}</select><select name="card_type_${index}"><option>Ammonizione</option><option>Doppia ammonizione</option><option>Espulsione</option></select>${remove}</div>`
      }
      const addEventRow = (type, values = {}) => {
        const container = eventContainers[type]
        if (!container) return
        const limit = type === 'substitution' ? 5 : 12
        if (container.children.length >= limit) return
        const index = eventRowCounts[type]++
        container.insertAdjacentHTML('beforeend', eventRowMarkup(type, index, values))
        const row = container.lastElementChild
        Object.entries(values).forEach(([key, value]) => {
          const fieldMap = type === 'substitution' ? {out:`sub_out_${index}`,in:`sub_in_${index}`,reason:`sub_reason_${index}`} : type === 'goal' ? {scorer:`scorer_${index}`,assist:`assist_${index}`} : {player:`card_player_${index}`,cardType:`card_type_${index}`}
          const field = form.elements[fieldMap[key]]
          if (field) field.value = value
        })
        row.querySelector('[data-remove-match-row]')?.addEventListener('click', () => { row.remove(); scheduleSave(); renderReport() })
      }
      matchEditor.addEventListener('click', (event) => {
        const resetButton = event.target.closest('[data-reset-formation]')
        if (resetButton && matchEditor.contains(resetButton)) {
          event.preventDefault()
          if (!resetFormationPositions() && state) state.textContent = 'Sistema non valido: impossibile azzerare le posizioni'
          return
        }
        const addButton = event.target.closest('[data-add-match-row]')
        if (!addButton || !matchEditor.contains(addButton)) return
        event.preventDefault()
        try {
          addEventRow(addButton.dataset.addMatchRow)
          scheduleSave()
          renderReport()
        } catch (error) {
          console.error('Errore aggiunta evento Match Sheet:', error)
          if (state) state.textContent = 'Errore: impossibile aggiungere la riga'
        }
      })
      const autoAssignCoreRoles = () => {
        const roster = getTrainingSheetRosterPlayers()
        const currentSelections = Array.from({ length: 11 }, (_, i) => form.elements[`starter_${i}`]?.value).filter(Boolean)
        if (currentSelections.length) return
        const byRole = (pattern) => roster.filter((player) => pattern.test(player.role || ''))
        const pools = {
          goalkeeper: byRole(/portier/i),
          defenders: byRole(/difensor/i),
          midfielders: byRole(/centrocamp/i),
          attackers: byRole(/attacc/i),
        }
        const assignment = [
          pools.goalkeeper[0],
          pools.defenders[0], pools.defenders[1], pools.defenders[2], pools.defenders[3],
          pools.midfielders[0], pools.midfielders[1], pools.midfielders[2], pools.midfielders[3], pools.attackers[1] || pools.midfielders[4],
          pools.attackers[0],
        ]
        assignment.forEach((player, index) => {
          if (!player || !form.elements[`starter_${index}`]) return
          form.elements[`starter_${index}`].value = player.canonicalName
          const shirtNumber = Number(player.number)
          if (Number.isInteger(shirtNumber) && shirtNumber >= 1 && shirtNumber <= 99 && form.elements[`starter_number_${index}`]) {
            form.elements[`starter_number_${index}`].value = String(shirtNumber)
          }
        })
      }

      const normalizedRosterShirtNumber = (value) => {
        const number = Number(value)
        return Number.isInteger(number) && number >= 1 && number <= 99 ? number : null
      }
      const playerAssignedShirtNumber = (playerName) => {
        const player = getTrainingSheetRosterPlayers().find((item) => item.canonicalName === String(playerName || ''))
        return normalizedRosterShirtNumber(player?.number)
      }
      const uniquePlayerForShirtNumber = (shirtNumber) => {
        const number = normalizedRosterShirtNumber(shirtNumber)
        if (number == null) return null
        const matches = getTrainingSheetRosterPlayers().filter((item) => normalizedRosterShirtNumber(item.number) === number)
        return matches.length === 1 ? matches[0] : null
      }
      const starterUsesPlayerElsewhere = (playerName, index) => Array.from({ length: 11 }, (_, candidateIndex) =>
        candidateIndex !== index ? String(form.elements[`starter_${candidateIndex}`]?.value || '') : ''
      ).some((value) => value === playerName)
      const syncStarterNumberFromPlayer = (index) => {
        const playerName = String(form.elements[`starter_${index}`]?.value || '')
        const assignedNumber = playerAssignedShirtNumber(playerName)
        const numberField = form.elements[`starter_number_${index}`]
        if (assignedNumber != null && numberField) numberField.value = String(assignedNumber)
      }
      const syncStarterPlayerFromNumber = (index) => {
        const numberField = form.elements[`starter_number_${index}`]
        const playerField = form.elements[`starter_${index}`]
        if (!numberField || !playerField) return
        const player = uniquePlayerForShirtNumber(numberField.value)
        if (!player || starterUsesPlayerElsewhere(player.canonicalName, index)) return
        playerField.value = player.canonicalName
      }

      const leadershipField = (role) => role === 'vice_captain' ? form.elements.vice_captain : form.elements.captain
      const leadershipSelect = (role) => matchEditor.querySelector(`[data-leadership-select="${role}"]`)
      const currentStarterEntries = () => [...matchEditor.querySelectorAll('.lineup-row select[name^="starter_"]')]
        .map((select) => {
          const match = select.name.match(/^starter_(\d+)$/)
          return match ? { index: match[1], name: String(select.value || '').trim() } : null
        })
        .filter((item) => item?.name)

      const refreshLeadershipSelects = () => {
        const starters = currentStarterEntries()
        ;['captain', 'vice_captain'].forEach((role) => {
          const select = leadershipSelect(role)
          const field = leadershipField(role)
          if (!select || !field) return
          const current = String(field.value ?? '')
          const options = starters.map((item) =>
            `<option value="${item.index}" ${item.index === current ? 'selected' : ''}>${escapeHtml(item.name)}</option>`
          ).join('')
          select.innerHTML = `<option value="">Nessuno</option>${options}`
          select.value = starters.some((item) => item.index === current) ? current : ''
        })
      }

      const assignLeadershipRole = (role, playerIndex) => {
        const targetField = leadershipField(role)
        const otherRole = role === 'captain' ? 'vice_captain' : 'captain'
        const otherField = leadershipField(otherRole)
        const index = String(playerIndex ?? '')
        const starter = currentStarterEntries().find((item) => item.index === index)
        if (!targetField) return
        if (index && !starter) return
        if (index && otherField?.value === index) otherField.value = ''
        targetField.value = index
        refreshLeadershipSelects()
        updateTokens()
        renderReport()
        save()
      }

      const updateTokens = () => {
        const showNumber = Boolean(form.elements.token_number?.checked)
        const showSurname = Boolean(form.elements.token_surname?.checked)
        const showPhoto = Boolean(form.elements.token_photo?.checked)
        const captainIndex = String(form.elements.captain?.value ?? '')
        const viceCaptainIndex = String(form.elements.vice_captain?.value ?? '')
        if (captainIndex && !currentStarterEntries().some((item) => item.index === captainIndex)) form.elements.captain.value = ''
        if (viceCaptainIndex && !currentStarterEntries().some((item) => item.index === viceCaptainIndex)) form.elements.vice_captain.value = ''
        matchEditor.querySelectorAll('[data-player-token]').forEach((token) => {
          const i = Number(token.dataset.playerToken)
          const name = form.elements[`starter_${i}`]?.value || `Giocatore ${i + 1}`
          const number = form.elements[`starter_number_${i}`]?.value || i + 1
          const surname = name.trim().split(/\s+/).at(-1) || name
          const badge = token.querySelector('.token-photo')
          const tokenNumber = token.querySelector('.staff-match-token__number')
          const label = token.querySelector('small')
          token.classList.toggle('show-photo', showPhoto)
          token.classList.toggle('is-captain', String(form.elements.captain?.value ?? '') === String(i))
          token.classList.toggle('is-vice-captain', String(form.elements.vice_captain?.value ?? '') === String(i))
          if (tokenNumber) tokenNumber.textContent = showPhoto ? surname.slice(0, 2).toUpperCase() : (showNumber ? number : '')
          // The token shell is a field object and must always remain visible.
          // Display controls only affect its content (number/photo) and surname label.
          badge.hidden = false
          token.classList.toggle('is-token-content-empty', !showPhoto && !showNumber)
          label.textContent = showSurname ? surname : ''
          label.hidden = !showSurname
        })
        refreshLeadershipSelects()
      }

      const bindLeadershipSelectors = () => {
        ;['captain', 'vice_captain'].forEach((role) => {
          leadershipSelect(role)?.addEventListener('change', (event) => assignLeadershipRole(role, event.target.value))
        })
        refreshLeadershipSelects()
        requestFrame(refreshLeadershipSelects)
      }

      const updateStarterOptions = () => {
        const selected = Array.from({ length: 11 }, (_, index) => form.elements[`starter_${index}`]?.value || '')
        for (let index = 0; index < 11; index += 1) {
          const select = form.elements[`starter_${index}`]
          if (!select) continue
          Array.from(select.options).forEach((option) => {
            if (!option.value) return
            option.disabled = selected.some((value, selectedIndex) => selectedIndex !== index && value === option.value)
          })
        }
      }
      const updateAutomaticBench = () => {
        const benchRoot = matchEditor.querySelector('[data-bench-slots]')
        const countNode = matchEditor.querySelector('[data-bench-count]')
        if (!benchRoot) return

        const roster = getTrainingSheetRosterPlayers()
        const starters = new Set(Array.from({ length: 11 }, (_, index) => form.elements[`starter_${index}`]?.value).filter(Boolean))
        const benchSelects = Array.from({ length: 9 }, (_, index) => form.elements[`bench_${index}`]).filter(Boolean)
        const currentBench = benchSelects.map((select) => select.value || '')

        benchSelects.forEach((select, index) => {
          const ownValue = currentBench[index]
          const usedElsewhere = new Set(currentBench.filter((value, usedIndex) => usedIndex !== index && value))
          const options = roster.filter((player) => !starters.has(player.canonicalName) && !usedElsewhere.has(player.canonicalName))
          select.innerHTML = [
            '<option value="">Seleziona giocatore</option>',
            ...options.map((player) => `<option value="${escapeHtml(player.canonicalName)}">${escapeHtml(player.displayName || player.canonicalName)}</option>`),
          ].join('')
          if (ownValue && options.some((player) => player.canonicalName === ownValue)) select.value = ownValue
          else select.value = ''
          const numberNode = benchRoot.querySelector(`[data-bench-slot-number="${index}"]`)
          const selectedPlayer = roster.find((player) => player.canonicalName === select.value)
          const assignedNumber = normalizedRosterShirtNumber(selectedPlayer?.number)
          if (numberNode) numberNode.textContent = String(assignedNumber ?? (index + 12))
          if (!select.dataset.benchBound) {
            select.dataset.benchBound = 'true'
            select.addEventListener('change', () => { updateAutomaticBench(); renderReport(); save() })
          }
        })

        const selectedBench = benchSelects.filter((select) => select.value).length
        const total = starters.size + selectedBench
        if (countNode) {
          countNode.textContent = `Distinta: ${total}/20`
          countNode.classList.toggle('is-complete', total === 20)
          countNode.classList.remove('is-over-limit')
        }
        if (finalSave) finalSave.disabled = false
      }

      const syncStarterSelectionState = () => {
        updateStarterOptions()
        updateAutomaticBench()
        refreshLeadershipSelects()
        updateTokens()
        renderReport()
        scheduleSave()
      }

      const resetFormationPositions = () => {
        const formation = String(form.elements.formation?.value || '4-4-2')
        const customFormation = String(form.elements.custom_formation?.value || '').trim()
        const layout = formation === 'Personalizzato'
          ? (positionsFromCustomFormation(customFormation) || getFormationLayout(customFormation || '4-4-2'))
          : getFormationLayout(formation)
        if (!layout || layout.length !== 11) return false
        layout.forEach(([x, y], index) => setTokenPosition(index, x, y, false))
        hasSavedTokenPositions = true
        renderReport()
        save()
        return true
      }

      const setOpponentTokenPosition = (index, x, y, persist = true) => {
        const token = matchEditor.querySelector(`[data-opponent-token="${index}"]`)
        if (!token) return
        const safeX = Math.min(93, Math.max(7, Number(x) || 50))
        const safeY = Math.min(93, Math.max(7, Number(y) || 50))
        token.style.setProperty('--x', safeX.toFixed(2))
        token.style.setProperty('--y', safeY.toFixed(2))
        const xInput = form.elements[`opponent_position_x_${index}`]
        const yInput = form.elements[`opponent_position_y_${index}`]
        if (xInput) xInput.value = safeX.toFixed(2)
        if (yInput) yInput.value = safeY.toFixed(2)
        if (persist) scheduleSave()
      }
      const updateOpponentPitch = (formation = '4-4-2', persist = true) => {
        const layout = getFormationLayout(formation)
        layout.forEach(([x,y], index) => setOpponentTokenPosition(index, x, y, false))
        if (persist) scheduleSave()
      }
      const bindOpponentTokenDragging = () => {
        const pitch = matchEditor.querySelector('[data-opponent-pitch]')
        if (!pitch) return
        matchEditor.querySelectorAll('[data-opponent-token]').forEach((token) => {
          let dragging = false
          const move = (event) => {
            if (!dragging) return
            const rect = pitch.getBoundingClientRect()
            setOpponentTokenPosition(Number(token.dataset.opponentToken), ((event.clientX-rect.left)/rect.width)*100, ((event.clientY-rect.top)/rect.height)*100, false)
          }
          token.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return
            dragging = true
            token.classList.add('is-dragging')
            token.setPointerCapture?.(event.pointerId)
            event.preventDefault()
          })
          token.addEventListener('pointermove', move)
          token.addEventListener('pointerup', (event) => {
            if (!dragging) return
            move(event); dragging = false; token.classList.remove('is-dragging'); token.releasePointerCapture?.(event.pointerId); scheduleSave(); renderReport()
          })
          token.addEventListener('pointercancel', () => { dragging = false; token.classList.remove('is-dragging') })
        })
      }
      const clampPosition = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
      const setTokenPosition = (index, x, y, persist = true) => {
        const token = matchEditor.querySelector(`[data-player-token="${index}"]`)
        if (!token) return
        const safeX = clampPosition(x, 7, 93)
        const safeY = clampPosition(y, 7, 93)
        token.style.setProperty('--x', safeX.toFixed(2))
        token.style.setProperty('--y', safeY.toFixed(2))
        const xInput = form.elements[`position_x_${index}`]
        const yInput = form.elements[`position_y_${index}`]
        if (xInput) xInput.value = safeX.toFixed(2)
        if (yInput) yInput.value = safeY.toFixed(2)
        if (persist) scheduleSave()
      }
      const positionsFromCustomFormation = getCustomFormationLayout

      const applyFormation = (formation, persist = true) => {
        const customFormation = String(form.elements.custom_formation?.value || '').trim()
        const layout = formation === 'Personalizzato'
          ? (positionsFromCustomFormation(customFormation) || getFormationLayout(customFormation || '4-4-2'))
          : getFormationLayout(formation)
        if (!layout || layout.length !== 11) return false
        layout.forEach(([x,y], index) => setTokenPosition(index, x, y, false))
        if (persist) scheduleSave()
        return true
      }
      const restoreTokenPositions = () => {
        if (!hasSavedTokenPositions) {
          applyFormation(form.elements.formation.value, false)
          return
        }
        let restored = true
        for (let i=0;i<11;i++) {
          const x = Number(form.elements[`position_x_${i}`]?.value)
          const y = Number(form.elements[`position_y_${i}`]?.value)
          if (!Number.isFinite(x) || !Number.isFinite(y)) { restored = false; break }
        }
        if (restored) {
          for (let i=0;i<11;i++) setTokenPosition(i, form.elements[`position_x_${i}`].value, form.elements[`position_y_${i}`].value, false)
        } else {
          applyFormation(form.elements.formation.value, false)
        }
      }
      const bindTokenDragging = () => {
        const pitch = matchEditor.querySelector('[data-football-pitch]')
        if (!pitch) return
        matchEditor.querySelectorAll('[data-player-token]').forEach((token) => {
          let dragging = false
          const move = (event) => {
            if (!dragging) return
            const rect = pitch.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / rect.width) * 100
            const y = ((event.clientY - rect.top) / rect.height) * 100
            setTokenPosition(Number(token.dataset.playerToken), x, y, false)
          }
          token.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return
            dragging = true
            token.classList.add('is-dragging')
            token.setPointerCapture?.(event.pointerId)
            event.preventDefault()
          })
          token.addEventListener('pointermove', move)
          token.addEventListener('pointerup', (event) => {
            if (!dragging) return
            move(event)
            dragging = false
            token.classList.remove('is-dragging')
            token.releasePointerCapture?.(event.pointerId)
            scheduleSave()
          })
          token.addEventListener('pointercancel', () => {
            dragging = false
            token.classList.remove('is-dragging')
          })
          token.addEventListener('keydown', (event) => {
            const delta = event.shiftKey ? 5 : 1
            const currentX = Number(form.elements[`position_x_${token.dataset.playerToken}`]?.value || 50)
            const currentY = Number(form.elements[`position_y_${token.dataset.playerToken}`]?.value || 50)
            const directions = {ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]}
            if (!directions[event.key]) return
            event.preventDefault()
            const [dx,dy] = directions[event.key]
            setTokenPosition(Number(token.dataset.playerToken), currentX+dx, currentY+dy)
          })
        })
      }
      const matchReportRenderer = createMatchReportRenderer({ escapeHtml })
      const matchReportService = createMatchReportService({
        root: matchEditor,
        collectData: collect,
        getTeam: getTeamProfile,
        renderer: matchReportRenderer,
      })
      const renderReport = () => matchReportService.render()
      const bindCoreSquadControls = () => {
        matchEditor.querySelectorAll('.lineup-row select[name^="starter_"], .lineup-row input[name^="starter_number_"]').forEach((control) => {
          const playerMatch = control.name.match(/^starter_(\d+)$/)
          const numberMatch = control.name.match(/^starter_number_(\d+)$/)
          if (playerMatch && control.dataset.starterRuntimeBound !== 'true') {
            control.dataset.starterRuntimeBound = 'true'
            control.addEventListener('change', () => {
              syncStarterNumberFromPlayer(Number(playerMatch[1]))
              syncStarterSelectionState()
            })
          }
          if (numberMatch && control.dataset.starterNumberRuntimeBound !== 'true') {
            control.dataset.starterNumberRuntimeBound = 'true'
            const syncNumberControl = () => {
              const normalized = normalizedRosterShirtNumber(control.value)
              if (normalized == null) return
              control.value = String(normalized)
              syncStarterPlayerFromNumber(Number(numberMatch[1]))
              syncStarterSelectionState()
            }
            control.addEventListener('change', syncNumberControl)
            control.addEventListener('blur', syncNumberControl)
          }
        })
      }
      // Core lineup interactions must survive failures in optional/secondary Match widgets.
      bindCoreSquadControls()
      const formationSelect=form.elements.formation
      const customFormationField = matchEditor.querySelector('[data-custom-formation]')
      const opponentFormationsRoot = matchEditor.querySelector('[data-opponent-formations]')
      const addOpponentFormationButton = matchEditor.querySelector('[data-add-opponent-formation]')
      const opponentInitialSystemSelect = form.elements.opponent_system_0
      let opponentFormationCount = 1
      const nextOpponentFormationIndex = () => {
        while (form.elements[`opponent_system_${opponentFormationCount}`]) opponentFormationCount += 1
        return opponentFormationCount++
      }
      const addOpponentFormation = (data = {}, requestedIndex = null) => {
        if (!opponentFormationsRoot) return
        const index = Number.isInteger(requestedIndex) && requestedIndex >= 1 ? requestedIndex : nextOpponentFormationIndex()
        if (index >= 6) return
        opponentFormationCount = Math.max(opponentFormationCount, index + 1)
        const card = documentRef.createElement('article')
        card.className = 'opponent-formation-card'
        card.dataset.opponentFormation = String(index)
        card.innerHTML = `<div class="opponent-formation-card-head"><strong>Cambio sistema</strong><button type="button" data-remove-opponent-formation aria-label="Rimuovi cambio sistema">×</button></div><div class="opponent-formation-fields"><label><span>Nuovo sistema</span><select name="opponent_system_${index}">${formationOptionsHtml(data.system || '4-4-2')}</select></label><label><span>Dal minuto</span><input type="number" min="1" max="130" name="opponent_system_minute_${index}" value="${escapeHtml(data.minute ?? '')}"></label></div><label><span>Nota</span><textarea name="opponent_system_note_${index}" rows="2" placeholder="Cosa cambia nella lettura dell’avversario?">${escapeHtml(data.note || '')}</textarea></label>`
        card.querySelector('[data-remove-opponent-formation]')?.addEventListener('click', () => { card.remove(); scheduleSave(); renderReport() })
        opponentFormationsRoot.appendChild(card)
        card.querySelectorAll('select,input,textarea').forEach((control) => control.addEventListener('change', () => { scheduleSave(); renderReport() }))
      }
      opponentInitialSystemSelect?.addEventListener('change', () => {
        updateOpponentPitch(opponentInitialSystemSelect.value)
        renderReport()
      })
      addOpponentFormationButton?.addEventListener('click', () => { addOpponentFormation(); scheduleSave() })
      const syncCustomFormation = () => {
        const isCustom = formationSelect.value === 'Personalizzato'
        customFormationField.hidden = !isCustom
        if (!isCustom) form.elements.custom_formation.value = ''
      }
      formationSelect.addEventListener('change',()=>{
        syncCustomFormation()
        applyFormation(formationSelect.value)
      })
      form.elements.custom_formation.addEventListener('change',()=>{
        if (formationSelect.value === 'Personalizzato') applyFormation('Personalizzato')
      })
      try {
        bindStaffColorPickers(matchEditor)
      } catch (error) {
        console.error('Match team color controls binding failed:', error)
      }
      try {
        bindMatchAnalysisSchemaEditors(matchEditor, analysisTemplateOptions())
      } catch (error) {
        console.error('Match analysis schema binding failed; core lineup remains active:', error)
      }
      const updateOpponentTokenStyle = () => {
        const primary = form.elements.opponent_token_primary?.value || '#9f1239'
        const secondary = form.elements.opponent_token_secondary?.value || '#f8fafc'
        const pattern = form.elements.opponent_token_pattern?.value || 'solid'
        const showNumber = form.elements.opponent_token_number?.checked !== false
        matchEditor.style.setProperty('--opponent-token-primary', primary)
        matchEditor.style.setProperty('--opponent-token-secondary', secondary)
        matchEditor.dataset.opponentTokenPattern = pattern
        const opponentStep = matchEditor.querySelector('.match-opponent-step')
        if (opponentStep) opponentStep.dataset.staffTokenPattern = pattern
        matchEditor.querySelectorAll('[data-opponent-token]').forEach((token) => {
          token.classList.toggle('is-number-hidden', !showNumber)
        })
      }
      form.elements.notes_mode.addEventListener('change',()=>{renderNotes();scheduleSave()})
      const handleMatchFormMutation = (event) => {
        const fieldName = event.target?.name || ''
        const directSquadField = /^starter_(?:number_)?\d+$/.test(fieldName)
        if (directSquadField) return
        updateTokens()
        updateOpponentTokenStyle()
        renderReport()
        scheduleSave()
      }
      form.addEventListener('input', handleMatchFormMutation)
      form.addEventListener('change', handleMatchFormMutation)
      next.addEventListener('click',()=>showStep(activeStep+1)); prev.addEventListener('click',()=>showStep(activeStep-1)); stepButtons.forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.matchStepButton)))
      matchEditor.querySelector('[data-match-reset]').addEventListener('click',()=>{if(confirm('Cancellare la Match Sheet?')){form.reset();draftService.clear();syncCustomFormation();applyFormation(form.elements.formation.value,false);renderNotes();updateTokens();showStep(1)}})
      const fileInput = form.elements.opponent_sheet
      const opponentSheetPreview = matchEditor.querySelector('[data-opponent-sheet-preview]')
      const opponentSheetEmpty = matchEditor.querySelector('[data-opponent-sheet-empty]')
      const opponentSheetState = matchEditor.querySelector('[data-opponent-sheet-state]')
      const opponentSheetMessage = matchEditor.querySelector('[data-opponent-sheet-message]')
      const removeOpponentSheetButton = matchEditor.querySelector('[data-remove-opponent-sheet]')
      const activeMatchForOpponentSheet = getActiveMatchContext()
      const opponentStudyService = activeMatchForOpponentSheet?.id && typeof createMatchOpponentStudyService === 'function'
        ? createMatchOpponentStudyService({
            getEvent: getCalendarEvent,
            updateEvent: updateCalendarEvent,
            reloadEvents: loadCalendarEvents,
          })
        : null
      let opponentSheetObjectUrl = ''

      const setOpponentSheetMessage = (message = '', type = '') => {
        if (!opponentSheetMessage) return
        opponentSheetMessage.textContent = message
        opponentSheetMessage.dataset.type = type
      }
      const clearOpponentSheetObjectUrl = () => {
        if (!opponentSheetObjectUrl) return
        urlApi.revokeObjectURL?.(opponentSheetObjectUrl)
        opponentSheetObjectUrl = ''
      }
      const renderOpponentSheetAsset = async (asset) => {
        clearOpponentSheetObjectUrl()
        if (!asset?.path || !opponentStudyService) {
          if (opponentSheetPreview) {
            opponentSheetPreview.removeAttribute('src')
            opponentSheetPreview.hidden = true
          }
          if (opponentSheetEmpty) opponentSheetEmpty.hidden = false
          if (opponentSheetState) opponentSheetState.textContent = 'Non caricata'
          if (removeOpponentSheetButton) removeOpponentSheetButton.hidden = true
          return
        }
        const signedUrl = await opponentStudyService.getAssetUrl(asset.path)
        if (!signedUrl) throw new Error('URL distinta non disponibile.')
        if (opponentSheetPreview) {
          opponentSheetPreview.src = signedUrl
          opponentSheetPreview.hidden = false
        }
        if (opponentSheetEmpty) opponentSheetEmpty.hidden = true
        if (opponentSheetState) opponentSheetState.textContent = 'Salvata'
        if (removeOpponentSheetButton) removeOpponentSheetButton.hidden = false
      }
      const reloadOpponentSheet = async () => {
        if (!opponentStudyService || !activeMatchForOpponentSheet?.id) return
        const event = await getCalendarEvent(activeMatchForOpponentSheet.id)
        const study = opponentStudyService.load(event, activeMatchForOpponentSheet.id)
        await renderOpponentSheetAsset(study.opponentLineup)
      }

      fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0]
        if (!file || !opponentStudyService || !activeMatchForOpponentSheet?.id) return
        const previousSrc = opponentSheetPreview?.src || ''
        const previousHidden = opponentSheetPreview?.hidden ?? true
        const previousEmptyHidden = opponentSheetEmpty?.hidden ?? false
        const previousRemoveHidden = removeOpponentSheetButton?.hidden ?? true
        clearOpponentSheetObjectUrl()
        opponentSheetObjectUrl = urlApi.createObjectURL(file)
        if (opponentSheetPreview) {
          opponentSheetPreview.src = opponentSheetObjectUrl
          opponentSheetPreview.hidden = false
        }
        if (opponentSheetEmpty) opponentSheetEmpty.hidden = true
        if (opponentSheetState) opponentSheetState.textContent = 'Caricamento…'
        if (removeOpponentSheetButton) removeOpponentSheetButton.hidden = true
        setOpponentSheetMessage('Salvataggio distinta in corso…')
        fileInput.disabled = true
        try {
          const saved = await opponentStudyService.uploadOpponentLineup({
            matchId: activeMatchForOpponentSheet.id,
            team: getTeamProfile(),
            file,
          })
          await renderOpponentSheetAsset(saved.opponentLineup)
          setOpponentSheetMessage('Distinta salvata.', 'success')
        } catch (error) {
          console.error('Upload distinta avversaria non riuscito:', error)
          clearOpponentSheetObjectUrl()
          if (opponentSheetPreview) {
            if (previousSrc) opponentSheetPreview.src = previousSrc
            else opponentSheetPreview.removeAttribute('src')
            opponentSheetPreview.hidden = previousHidden
          }
          if (opponentSheetEmpty) opponentSheetEmpty.hidden = previousEmptyHidden
          if (removeOpponentSheetButton) removeOpponentSheetButton.hidden = previousRemoveHidden
          if (opponentSheetState) opponentSheetState.textContent = previousHidden ? 'Non caricata' : 'Salvata'
          setOpponentSheetMessage(getDataAccessUserMessage(error, undefined, { stage: 'match-opponent-lineup-upload' }), 'error')
        } finally {
          fileInput.value = ''
          fileInput.disabled = false
        }
      })

      removeOpponentSheetButton?.addEventListener('click', async () => {
        if (!opponentStudyService || !activeMatchForOpponentSheet?.id) return
        if (!windowRef.confirm('Rimuovere la distinta avversaria salvata?')) return
        removeOpponentSheetButton.disabled = true
        if (fileInput) fileInput.disabled = true
        if (opponentSheetState) opponentSheetState.textContent = 'Rimozione…'
        setOpponentSheetMessage('Rimozione distinta in corso…')
        try {
          await opponentStudyService.removeOpponentLineup(activeMatchForOpponentSheet.id)
          await renderOpponentSheetAsset(null)
          setOpponentSheetMessage('Distinta rimossa.', 'success')
        } catch (error) {
          console.error('Rimozione distinta avversaria non riuscita:', error)
          if (opponentSheetState) opponentSheetState.textContent = 'Salvata'
          setOpponentSheetMessage(getDataAccessUserMessage(error, undefined, { stage: 'match-opponent-lineup-remove' }), 'error')
        } finally {
          removeOpponentSheetButton.disabled = false
          if (fileInput) fileInput.disabled = false
        }
      })

      reloadOpponentSheet().catch((error) => {
        console.error('Ripristino distinta avversaria non riuscito:', error)
        setOpponentSheetMessage(getDataAccessUserMessage(error, undefined, { stage: 'match-opponent-lineup-load' }), 'error')
      })
      const openMatchReportPreview = () => {
        const { paper, validation } = matchReportService.getPrintablePaper()
        if (!paper) {
          if (state) state.textContent = 'Report non disponibile'
          return
        }
        if (!validation.valid && state) {
          state.textContent = `Report incompleto: ${validation.errors.join(' · ')}`
        }
        documentRef.querySelector('[data-match-report-dialog]')?.remove()
        const trigger = document.activeElement
        const dialog = documentRef.createElement('div')
        dialog.className = 'match-report-dialog'
        dialog.dataset.matchReportDialog = ''
        dialog.innerHTML = `<section class="match-report-dialog-panel" role="dialog" aria-modal="true" aria-label="Anteprima Match Report"><header><div><span>ANTEPRIMA DI STAMPA</span><h2>Match Report</h2></div><button type="button" data-close-match-report aria-label="Chiudi">×</button></header><div class="match-report-dialog-body">${paper.outerHTML}</div><footer><button type="button" class="secondary-button" data-close-match-report>Annulla</button><button type="button" class="primary-button" data-confirm-match-report>Stampa / salva PDF</button></footer></section>`
        documentRef.body.appendChild(dialog)
        documentRef.body.classList.add('modal-open')
        const close = () => {
          dialog.remove()
          documentRef.body.classList.remove('modal-open')
          trigger?.focus?.()
        }
        dialog.querySelectorAll('[data-close-match-report]').forEach((button) => button.addEventListener('click', close))
        dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
        dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') close() })
        dialog.querySelector('[data-close-match-report]')?.focus()
        dialog.querySelector('[data-confirm-match-report]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget
          const printable = dialog.querySelector('.match-report-paper')
          const activeMatch = (() => {
            try { return JSON.parse(storage.getItem('staff-active-match') || 'null') } catch { return null }
          })()
          button.disabled = true
          button.textContent = 'Salvataggio nel Calendario…'
          if (state) state.textContent = 'Collegamento al Calendario…'
          try {
            const calendarService = createMatchCalendarService({
              createEvent: createCalendarEvent,
              updateEvent: updateCalendarEvent,
              reloadEvents: loadCalendarEvents,
            })
            const saved = await calendarService.publish({
              matchData: collect(),
              activeMatch,
              calendarEvents: appState.calendarEvents,
            })
            if (saved.eventId) {
              storage.setItem('staff-active-match', JSON.stringify({
                ...(activeMatch || {}),
                id: saved.eventId,
                opponent: form.elements.opponent?.value || activeMatch?.opponent || '',
                date: form.elements.date?.value || activeMatch?.date || '',
              }))
            }
            draftService.save(form)
            if (state) state.textContent = saved.created ? 'Report salvato e gara creata nel Calendario' : 'Report salvato nel Calendario'
            printMatchReport(printable)
            button.textContent = 'Stampa / salva PDF'
            button.disabled = false
          } catch (error) {
            console.error('Salvataggio Match Report nel Calendario non riuscito:', error)
            if (state) state.textContent = getDataAccessUserMessage(error, undefined, { stage: 'legacy-match-report-calendar-save' })
            button.textContent = 'Riprova salvataggio'
            button.disabled = false
          }
        })
      }
      finalSave?.addEventListener('click', () => { save(); if (state) state.textContent = 'Match Sheet salvata' })
      try {
        const saved = draftService.load()
        if(saved){
          const inferIndexes = (pattern) => Object.keys(saved).filter((key) => pattern.test(key)).map((key) => Number(key.match(/\d+/)?.[0])).filter(Number.isFinite).sort((a,b)=>a-b)
          const subIndexes = inferIndexes(/^sub_minute_\d+$/)
          const goalIndexes = inferIndexes(/^goal_minute_\d+$/)
          const cardIndexes = inferIndexes(/^card_minute_\d+$/)
          restoredLeadership = {
            captain: String(saved.captain ?? ''),
            vice_captain: String(saved.vice_captain ?? ''),
          }
          ;(subIndexes.length ? subIndexes : [0]).forEach((index)=>addEventRow('substitution',{minute:saved[`sub_minute_${index}`],out:saved[`sub_out_${index}`],in:saved[`sub_in_${index}`],reason:saved[`sub_reason_${index}`]}))
          ;(goalIndexes.length ? goalIndexes : [0]).forEach((index)=>addEventRow('goal',{minute:saved[`goal_minute_${index}`],scorer:saved[`scorer_${index}`],assist:saved[`assist_${index}`]}))
          ;(cardIndexes.length ? cardIndexes : [0]).forEach((index)=>addEventRow('card',{minute:saved[`card_minute_${index}`],player:saved[`card_player_${index}`],cardType:saved[`card_type_${index}`]}))
          const savedOpponentIndexes = Object.keys(saved).filter((key)=>/^opponent_system_\d+$/.test(key)).map((key)=>Number(key.match(/\d+/)[0])).sort((a,b)=>a-b)
          if (opponentFormationsRoot) opponentFormationsRoot.innerHTML = ''
          opponentFormationCount = 1
          savedOpponentIndexes.filter((index) => index >= 1).forEach((index)=>addOpponentFormation({system:saved[`opponent_system_${index}`],minute:saved[`opponent_system_minute_${index}`],note:saved[`opponent_system_note_${index}`]}, index))
          Object.entries(saved).forEach(([k,v])=>{
            if (k === 'captain' || k === 'vice_captain') return
            const f=form.elements.namedItem(k)
            if(!f||f.type==='file')return
            if(f.type==='checkbox')f.checked=v===true||v==='true'||v==='on'
            else f.value=v
          })
          syncCompactScore('result')
          syncCompactScore('half_result')
          for (let i=0;i<11;i+=1) {
            if (saved[`opponent_position_x_${i}`] !== undefined && saved[`opponent_position_y_${i}`] !== undefined) setOpponentTokenPosition(i, saved[`opponent_position_x_${i}`], saved[`opponent_position_y_${i}`], false)
          }
          hasSavedOpponentTokenPositions = Array.from({length:11},(_,i)=>`opponent_position_x_${i}`).every((key)=>saved[key] !== undefined) && Array.from({length:11},(_,i)=>`opponent_position_y_${i}`).every((key)=>saved[key] !== undefined)
          hasSavedTokenPositions = Array.from({length:11},(_,i)=>`position_x_${i}`).every((key)=>saved[key] !== undefined) && Array.from({length:11},(_,i)=>`position_y_${i}`).every((key)=>saved[key] !== undefined)
        }
      } catch {}
      if (!eventContainers.substitution.children.length) addEventRow('substitution')
      if (!eventContainers.goal.children.length) addEventRow('goal')
      if (!eventContainers.card.children.length) addEventRow('card')
      syncCustomFormation()
      restoreTokenPositions()
      bindTokenDragging()
      if (!hasSavedOpponentTokenPositions) updateOpponentPitch(opponentInitialSystemSelect?.value || '4-4-2', false)
      bindOpponentTokenDragging()
      bindLeadershipSelectors()
      autoAssignCoreRoles()
      renderNotes()
      updateStarterOptions()
      refreshLeadershipSelects()
      if (restoredLeadership) {
        const starterIndexes = new Set(currentStarterEntries().map((item) => item.index))
        if (starterIndexes.has(restoredLeadership.captain)) form.elements.captain.value = restoredLeadership.captain
        if (starterIndexes.has(restoredLeadership.vice_captain) && restoredLeadership.vice_captain !== form.elements.captain.value) {
          form.elements.vice_captain.value = restoredLeadership.vice_captain
        }
        refreshLeadershipSelects()
      }
      updateTokens()
      updateAutomaticBench()
      updateOpponentTokenStyle()
      renderReport()
      showStep(1)
    }
}
