import { escapeHtml } from '../../../shared/html/escapeHtml.js'

export function wireTrainingEditorEvents({
  root,
  TRAINING_SHEET_STATUS,
  normalizeTrainingSheetData,
  getTrainingSheetRosterPlayers,
  activePlayers,
  getTeamProfile,
  profileFullName,
  appState,
  teamLogoHtml,
  hasTeamLocation,
  resolveTrainingCalendarPublishTarget,
  publishTrainingSheet,
  getUserErrorMessage,
  getDataAccessUserMessage = getUserErrorMessage,
  updateCalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  loadCalendarEvents,
  supabase,
  getCalendarEvent,
  buildTrainingDraftFromCalendarEvent,
}) {
    const manualEditor = root.querySelector('[data-ts-manual-editor]')
    if (manualEditor) {
      const form = manualEditor.querySelector('[data-ts-manual-form]')
      const preview = manualEditor.querySelector('[data-ts-preview]')
      const phasesRoot = manualEditor.querySelector('[data-ts-phases]')
      const tsSteps = [...manualEditor.querySelectorAll('[data-ts-step]')]
      const tsStepButtons = [...manualEditor.querySelectorAll('[data-ts-step-button]')]
      const tsStepPrev = manualEditor.querySelector('[data-ts-step-prev]')
      const tsStepNext = manualEditor.querySelector('[data-ts-step-next]')
      const tsStepStatus = manualEditor.querySelector('[data-ts-step-status]')
      const tsStepFooter = manualEditor.querySelector('[data-ts-step-footer]')
      let activeTsStep = 1
      const showTsStep = (value) => {
        const nextStep = Math.min(6, Math.max(1, Number(value) || 1))
        activeTsStep = nextStep
        tsSteps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.tsStep) === nextStep))
        tsStepButtons.forEach((button) => button.classList.toggle('is-active', Number(button.dataset.tsStepButton) === nextStep))
        if (tsStepPrev) tsStepPrev.disabled = nextStep === 1
        if (tsStepNext) {
          tsStepNext.disabled = nextStep === 6
          tsStepNext.hidden = nextStep === 6
        }
        if (tsStepStatus) tsStepStatus.textContent = `Sezione ${nextStep} di 6`
        const activeSection = tsSteps.find((step) => Number(step.dataset.tsStep) === nextStep)
        if (activeSection && tsStepFooter) activeSection.appendChild(tsStepFooter)
        if (nextStep === 6) requestAnimationFrame(() => { updatePreview(); fitPreviewToViewport() })
        manualEditor.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      tsStepButtons.forEach((button) => button.addEventListener('click', () => showTsStep(button.dataset.tsStepButton)))
      tsStepPrev?.addEventListener('click', () => showTsStep(activeTsStep - 1))
      tsStepNext?.addEventListener('click', () => showTsStep(activeTsStep + 1))
      const draftStateRoot = manualEditor.querySelector('[data-ts-draft-state]')
      const draftState = draftStateRoot?.querySelector('span')
      const publishTrainingSheetButton = manualEditor.querySelector('[data-print-sheet]')
      const tsLocationSelect = form?.elements.location
      const tsCustomLocationField = manualEditor.querySelector('[data-ts-custom-location]')
      const tsCustomLocationInput = form?.elements.custom_location
      const syncTsLocation = () => {
        const isCustom = tsLocationSelect?.value === '__custom__'
        if (tsCustomLocationField) tsCustomLocationField.hidden = !isCustom
        if (tsCustomLocationInput) {
          tsCustomLocationInput.required = Boolean(isCustom)
          if (!isCustom) tsCustomLocationInput.value = ''
        }
      }
      tsLocationSelect?.addEventListener('change', syncTsLocation)
      syncTsLocation()
      const storageKey = 'nz-training-sheet-editor-v6-2'
      let phaseCount = 0
      let saveTimer = null
      let currentEditingEventId = localStorage.getItem('nz-training-sheet-open-event-id') || ''
      let currentTrainingDocument = normalizeTrainingSheetData({ status: TRAINING_SHEET_STATUS.DRAFT })
      let hasUnpublishedChanges = false

      const updateTrainingWorkflowUi = ({ dirty = hasUnpublishedChanges } = {}) => {
        hasUnpublishedChanges = Boolean(dirty)
        const status = currentTrainingDocument.status || TRAINING_SHEET_STATUS.DRAFT
        const labels = {
          [TRAINING_SHEET_STATUS.DRAFT]: hasUnpublishedChanges ? 'Bozza · modifiche salvate' : 'Bozza',
          [TRAINING_SHEET_STATUS.PUBLISHED]: hasUnpublishedChanges ? 'Pubblicata · modifiche locali' : 'Pubblicata',
        }
        if (draftStateRoot) draftStateRoot.dataset.status = status
        if (draftState) draftState.textContent = labels[status] || 'Bozza'
      }

      const setTrainingDocument = (data = {}, options = {}) => {
        currentTrainingDocument = normalizeTrainingSheetData(data)
        updateTrainingWorkflowUi({ dirty: options.dirty === true })
      }

      const rosterPlayers = getTrainingSheetRosterPlayers()
      const rosterPlayerByCanonicalName = new Map(
        rosterPlayers.map((player) => [player.canonicalName.toLocaleLowerCase('it-IT'), player]),
      )

      const surnameOnly = (fullName = '') => {
        const normalized = String(fullName).trim().replace(/\s+/g, ' ')
        const matchingPlayer = rosterPlayerByCanonicalName.get(normalized.toLocaleLowerCase('it-IT'))
        if (matchingPlayer?.surname) return matchingPlayer.surname
        const parts = normalized.split(' ')
        return parts.at(-1) || normalized
      }
      const selectedPlayers = (type) => [...manualEditor.querySelectorAll(`[data-player-select="${type}"] input:checked`)].map(input => input.value)
      const selectedPillars = () => [...form.querySelectorAll('[name="pillars"]:checked')].map(input => input.value)
      const squadTotal = activePlayers().length
      const updatePresentCount = () => {
        const unavailable = new Set([...selectedPlayers('absent'), ...selectedPlayers('injured'), ...selectedPlayers('differentiated')])
        const provaCount = Math.max(0, Number(form.elements.aggregated_prova_count?.value || 0))
        const youthCount = Math.max(0, Number(form.elements.aggregated_youth_count?.value || 0))
        const aggregatedCount = provaCount + youthCount
        if (form.elements.aggregated_count) form.elements.aggregated_count.value = String(aggregatedCount)
        if (form.elements.aggregated) {
          form.elements.aggregated.value = provaCount && youthCount
            ? 'PROVA + SETTORE GIOVANILE'
            : provaCount
              ? 'PROVA'
              : youthCount
                ? 'SETTORE GIOVANILE'
                : ''
        }
        const present = Math.max(0, squadTotal - unavailable.size + aggregatedCount)
        if (form.elements.present) form.elements.present.value = String(present)
        return present
      }

      const addPhase = (data = {}) => {
        const index = phaseCount++
        phasesRoot.insertAdjacentHTML('beforeend', `
          <article class="ts-phase-editor" data-phase>
            <div class="ts-phase-editor-head"><strong>FASE ${index + 1}</strong><div class="ts-phase-editor-actions"><button type="button" class="staff-button staff-button--secondary ts-split-phase-button" data-toggle-phase-split>${data.split ? 'Riunisci fase' : 'Dividi fase'}</button><button type="button" class="staff-button staff-button--danger ts-remove-phase-button" data-remove-phase aria-label="Rimuovi fase">×</button></div></div>
            <div class="ts-phase-layout">
              <label class="ts-field ts-phase-title-field"><span>Titolo</span><input name="phase_title_${index}" value="${escapeHtml(data.title || '')}" placeholder="Es. Attivazione, Gioco di posizione, Possesso"></label>
              <div class="ts-phase-meta-fields">
                <label class="ts-field ts-phase-duration-field"><span>Durata</span><div class="ts-duration-input"><input name="phase_duration_${index}" type="number" min="1" value="${escapeHtml(data.duration || '')}" placeholder="10"><small>min</small></div></label>
                <label class="ts-field ts-phase-goalkeepers-field"><span>Portieri</span><select name="phase_goalkeepers_${index}"><option value="no" ${(!data.goalkeepers || data.goalkeepers==='no')?'selected':''}>No</option><option value="yes" ${data.goalkeepers==='yes'?'selected':''}>Sì</option><option value="separate" ${data.goalkeepers==='separate'?'selected':''}>Lavoro separato</option></select></label>
              </div>
            </div>
            <label class="ts-field ts-field-full"><span>Note</span><textarea name="phase_description_${index}" rows="4" placeholder="Organizzazione, numeri, spazi, regole, obiettivi e indicazioni operative...">${escapeHtml(data.description || '')}</textarea></label>
            <div class="ts-parallel-work ${data.split ? 'is-active' : ''}" data-parallel-work ${data.split ? '' : 'hidden'}>
              <div class="ts-parallel-work-head"><strong>Lavori paralleli</strong><span>Stesso intervallo temporale della fase</span></div>
              <div class="ts-parallel-work-grid">
                <section><b>GRUPPO A</b><label class="ts-field"><span>Titolo</span><input name="phase_parallel_a_title_${index}" value="${escapeHtml(data.parallelA?.title || '')}" placeholder="Es. Forza con il prof"></label><label class="ts-field"><span>Note</span><textarea name="phase_parallel_a_description_${index}" rows="3">${escapeHtml(data.parallelA?.description || '')}</textarea></label></section>
                <section><b>GRUPPO B</b><label class="ts-field"><span>Titolo</span><input name="phase_parallel_b_title_${index}" value="${escapeHtml(data.parallelB?.title || '')}" placeholder="Es. Rondo"></label><label class="ts-field"><span>Note</span><textarea name="phase_parallel_b_description_${index}" rows="3">${escapeHtml(data.parallelB?.description || '')}</textarea></label></section>
              </div>
            </div>
            <input type="hidden" name="phase_split_${index}" value="${data.split ? 'true' : 'false'}">
            <details class="ts-phase-advanced" ${(data.variants || data.coaching) ? 'open' : ''}>
              <summary>＋ Aggiungi varianti o coaching point</summary>
              <div class="ts-phase-compact two">
                <label class="ts-field"><span>Varianti</span><textarea name="phase_variants_${index}" rows="2">${escapeHtml(data.variants || '')}</textarea></label>
                <label class="ts-field"><span>Coaching point</span><textarea name="phase_coaching_${index}" rows="2">${escapeHtml(data.coaching || '')}</textarea></label>
              </div>
            </details>
          </article>
        `)
        const phaseElement = phasesRoot.lastElementChild
        phaseElement.querySelector('[data-remove-phase]').addEventListener('click', (event) => {
          event.currentTarget.closest('[data-phase]').remove(); updatePreview(); scheduleSave()
        })
        phaseElement.querySelector('[data-toggle-phase-split]')?.addEventListener('click', (event) => {
          const parallel = phaseElement.querySelector('[data-parallel-work]')
          const splitInput = phaseElement.querySelector('[name^="phase_split_"]')
          const willSplit = parallel.hidden
          parallel.hidden = !willSplit
          parallel.classList.toggle('is-active', willSplit)
          splitInput.value = willSplit ? 'true' : 'false'
          event.currentTarget.textContent = willSplit ? 'Riunisci fase' : 'Dividi fase'
          updatePreview(); scheduleSave()
        })
      }

      const collect = () => {
        const fd = new FormData(form)
        const phases = [...phasesRoot.querySelectorAll('[data-phase]')].map((node) => {
          const title = node.querySelector('[name^="phase_title_"]')?.value || ''
          const duration = node.querySelector('[name^="phase_duration_"]')?.value || ''
          const goalkeepers = node.querySelector('[name^="phase_goalkeepers_"]')?.value || ''
          const description = node.querySelector('[name^="phase_description_"]')?.value || ''
          const variants = node.querySelector('[name^="phase_variants_"]')?.value || ''
          const coaching = node.querySelector('[name^="phase_coaching_"]')?.value || ''
          const split = node.querySelector('[name^="phase_split_"]')?.value === 'true'
          const parallelA = { title: node.querySelector('[name^="phase_parallel_a_title_"]')?.value || '', description: node.querySelector('[name^="phase_parallel_a_description_"]')?.value || '' }
          const parallelB = { title: node.querySelector('[name^="phase_parallel_b_title_"]')?.value || '', description: node.querySelector('[name^="phase_parallel_b_description_"]')?.value || '' }
          return { title, duration, goalkeepers, description, variants, coaching, split, parallelA, parallelB }
        })
        return normalizeTrainingSheetData({
          ...currentTrainingDocument,
          date: fd.get('date') || '', time: fd.get('time') || '', location: fd.get('location') === '__custom__' ? (fd.get('custom_location') || '') : (fd.get('location') || ''), progressive: fd.get('progressive') || '', present: updatePresentCount(), focus: fd.get('focus') || '', match_day: fd.get('match_day') || '', intensity: fd.get('intensity') || '', volume: fd.get('volume') || '', objective: fd.get('objective') || '', principles: fd.get('principles') || '', pillars: selectedPillars(), absent: selectedPlayers('absent'), injured: selectedPlayers('injured'), differentiated: selectedPlayers('differentiated'), aggregated: fd.get('aggregated') || '', aggregated_count: Math.max(0, Number(fd.get('aggregated_count') || 0)), aggregated_prova_count: Math.max(0, Number(fd.get('aggregated_prova_count') || 0)), aggregated_youth_count: Math.max(0, Number(fd.get('aggregated_youth_count') || 0)), phases
        })
      }

      const bar = (value) => `<span class="ts-mini-scale">${[1,2,3,4,5].map(n=>`<i class="${Number(value)>=n?'on':''}"></i>`).join('')}</span>`
      const fitPreviewToViewport = () => {
        const frame = manualEditor.querySelector('.ts-paper-frame')
        if (!frame || !preview) return
        if (window.innerWidth > 720) {
          preview.style.width = ''
          preview.style.transform = ''
          preview.style.transformOrigin = ''
          frame.style.height = ''
          frame.style.overflow = ''
          return
        }
        const paperWidth = 680
        const available = Math.max(280, frame.clientWidth - 2)
        const scale = Math.min(1, available / paperWidth)
        preview.style.width = `${paperWidth}px`
        preview.style.transformOrigin = 'top left'
        preview.style.transform = `scale(${scale})`
        requestAnimationFrame(() => {
          frame.style.height = `${Math.ceil(preview.scrollHeight * scale + 4)}px`
          frame.style.overflow = 'hidden'
        })
      }

      const updatePreview = () => {
        const d = collect()
        const team = getTeamProfile()
        const coachName = profileFullName(appState.currentUserProfile)
        const coachInitials = coachName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CO'
        const teamBrand = teamLogoHtml('ts-paper-brand-logo')
        const formattedDate = d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString('it-IT') : '—'
        const total = d.phases.reduce((sum,p)=>sum+(Number(p.duration)||0),0)
        preview.innerHTML = `
          <div class="ts-watermark" aria-hidden="true"><b>${escapeHtml(coachInitials)}</b><div>${Array.from({length:8},()=>`<span>${escapeHtml(coachName.toUpperCase())} · ${escapeHtml(coachName.toUpperCase())} · ${escapeHtml(coachName.toUpperCase())}</span>`).join('')}</div></div>
          <div class="ts-paper-content">
          <header class="ts-paper-head"><div class="ts-paper-brand">${teamBrand}<div><strong>${escapeHtml(String(team.name || team.shortName || 'SQUADRA').toUpperCase())}</strong><span>TRAINING SHEET</span></div></div><div class="ts-paper-title"><small>ALLENATORE · ${escapeHtml(coachName.toUpperCase())}</small><strong>ALL_${String(d.progressive || '---').padStart(3,'0')}</strong></div></header>
          <div class="ts-paper-meta"><span><small>Data</small><b>${escapeHtml(formattedDate)}</b></span><span><small>Ora</small><b>${escapeHtml(d.time || '—')}</b></span><span><small>Campo</small><b>${escapeHtml(d.location || '—')}</b></span><span><small>Presenti</small><b>${escapeHtml(d.present || '—')}</b></span><span class="ts-paper-md ts-md-${escapeHtml((d.match_day || 'none').replace('+','plus').replace('-','minus').toLowerCase())}">${escapeHtml(d.match_day || '')}</span></div>
          <section class="ts-paper-roster ts-paper-roster--four"><div><small>ASSENTI</small><p>${d.absent.length?d.absent.map(n=>`<span>${escapeHtml(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="inj"><small>INFORTUNATI</small><p>${d.injured.length?d.injured.map(n=>`<span>${escapeHtml(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="diff"><small>DIFFERENZIATO</small><p>${d.differentiated?.length?d.differentiated.map(n=>`<span>${escapeHtml(surnameOnly(n))}</span>`).join(''):'<em>Nessuno</em>'}</p></div><div class="agg"><small>AGGREGATI</small><p>${Number(d.aggregated_prova_count || 0) || Number(d.aggregated_youth_count || 0) ? `${Number(d.aggregated_prova_count || 0) ? `<span>PROVA ${Number(d.aggregated_prova_count)}</span>` : ''}${Number(d.aggregated_youth_count || 0) ? `<span>SETTORE ${Number(d.aggregated_youth_count)}</span>` : ''}` : '<em>Nessuno</em>'}</p></div></section>
          <div class="ts-paper-load"><span><small>Focus fisico</small><b>${escapeHtml(d.focus || '—')}</b></span><span><small>Intensità</small>${bar(d.intensity)}</span><span><small>Volume</small>${bar(d.volume)}</span><span><small>Durata</small><b>${total || '—'}'</b></span></div>
          <section class="ts-paper-pillars">${['Creare il vantaggio','Conservare il vantaggio','Sfruttare il vantaggio','Difendere il vantaggio'].map((p,i)=>`<span class="pillar-${i+1} ${d.pillars.includes(p)?'is-selected':'is-muted'}">${escapeHtml(p)}</span>`).join('')}</section>
          <section class="ts-paper-body"><div class="ts-paper-phases">${d.phases.length ? d.phases.map((p,i)=>`<article class="${p.split ? 'is-split' : ''}"><div class="ts-paper-phase-head"><b>${String(i+1).padStart(2,'0')}</b><strong>FASE ${i+1}${p.title?` · ${escapeHtml(p.title)}`:''}</strong><div class="ts-paper-phase-meta"><span class="ts-phase-gk">Portieri: ${p.goalkeepers==='yes'?'Sì':p.goalkeepers==='separate'?'Separati':'No'}</span><span class="ts-phase-duration">${escapeHtml(p.duration || '—')}'</span></div></div>${p.split ? `<div class="ts-paper-parallel"><section><b>GRUPPO A${p.parallelA?.title ? ` · ${escapeHtml(p.parallelA.title)}` : ''}</b><p>${escapeHtml(p.parallelA?.description || 'Da completare')}</p></section><section><b>GRUPPO B${p.parallelB?.title ? ` · ${escapeHtml(p.parallelB.title)}` : ''}</b><p>${escapeHtml(p.parallelB?.description || 'Da completare')}</p></section></div>` : `<p>${escapeHtml(p.description || 'Descrizione da completare')}</p>`}${p.variants?`<small><b>Varianti:</b> ${escapeHtml(p.variants)}</small>`:''}${p.coaching?`<small><b>Coaching point:</b> ${escapeHtml(p.coaching)}</small>`:''}</article>`).join('') : '<p class="ts-paper-empty">Aggiungi la prima fase.</p>'}</div></section>
          <section class="ts-paper-objectives"><div><small>OBIETTIVO</small><p>${escapeHtml(d.objective || 'Da definire')}</p></div><div><small>PRINCIPI</small><p>${escapeHtml(d.principles || 'Da definire')}</p></div></section>
          </div>
        `
        requestAnimationFrame(fitPreviewToViewport)
      }
      window.addEventListener('resize', fitPreviewToViewport, { passive: true })

      const saveDraft = () => {
        const data = collect()
        localStorage.setItem(storageKey, JSON.stringify(data))
        currentTrainingDocument = data
        updateTrainingWorkflowUi({ dirty: true })
      }
      const scheduleSave = () => {
        hasUnpublishedChanges = true
        if (draftState) draftState.textContent = 'Salvataggio…'
        clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 450)
      }
      const updateCounts = () => {
        manualEditor.querySelectorAll('[data-player-select]').forEach((box) => {
          const count = box.querySelectorAll('input:checked').length
          const counter = box.querySelector('[data-count]')
          if (counter) counter.textContent = `${count} selezionati`
        })
        updatePresentCount()
      }

      const syncAggregatedUi = ({ keepOpen = false } = {}) => {
        const menu = manualEditor.querySelector('[data-aggregated-menu]')
        const summary = manualEditor.querySelector('[data-aggregated-summary]')
        const provaCount = Math.max(0, Number(form.elements.aggregated_prova_count?.value || 0))
        const youthCount = Math.max(0, Number(form.elements.aggregated_youth_count?.value || 0))
        const total = provaCount + youthCount
        if (summary) {
          summary.textContent = total
            ? `${provaCount ? `Prova ${provaCount}` : ''}${provaCount && youthCount ? ' · ' : ''}${youthCount ? `Settore ${youthCount}` : ''}`
            : 'Gestisci'
        }
        if (menu) menu.open = keepOpen || total > 0
      }

      const normalizePlayerValue = (value = '') => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('it-IT')
        .replace(/[^a-z0-9]/g, '')

      const normalizePlayerTokens = (value = '') => String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('it-IT')
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .sort()
        .join('|')

      const filterTrainingRosterSelector = (selector) => {
        if (!selector) return
        const searchInput = selector.querySelector('[data-player-search]')
        const query = normalizePlayerValue(searchInput?.value || '')
        selector.querySelectorAll('.ts-player-option').forEach((option) => {
          const input = option.querySelector('input')
          const canonicalName = String(input?.dataset.canonicalName || '')
          const surname = String(input?.dataset.surname || '')
          const surnameKey = normalizePlayerValue(surname)
          const wordKeys = canonicalName.split(/\s+/).map(normalizePlayerValue).filter(Boolean)
          const prefixMatch = surnameKey.startsWith(query) || wordKeys.some((word) => word.startsWith(query))
          const match = !query || prefixMatch
          option.classList.toggle('is-filtered-out', !match)
          if (match) option.style.removeProperty('display')
          else option.style.setProperty('display', 'none', 'important')
        })
        selector.querySelectorAll('.ts-roster-department').forEach((department) => {
          const hasVisiblePlayer = [...department.querySelectorAll('.ts-player-option')]
            .some((option) => !option.classList.contains('is-filtered-out'))
          department.classList.toggle('is-filtered-out', !hasVisiblePlayer)
          if (hasVisiblePlayer) department.style.removeProperty('display')
          else department.style.setProperty('display', 'none', 'important')
        })
      }

      manualEditor.addEventListener('input', (event) => {
        const searchInput = event.target.closest?.('[data-player-search]')
        if (!searchInput) return
        filterTrainingRosterSelector(searchInput.closest('[data-player-select]'))
      })

      manualEditor.addEventListener('click', (event) => {
        const clearButton = event.target.closest?.('[data-clear-player-search]')
        if (!clearButton) return
        event.preventDefault()
        event.stopPropagation()
        const selector = clearButton.closest('[data-player-select]')
        const searchInput = selector?.querySelector('[data-player-search]')
        if (searchInput) searchInput.value = ''
        filterTrainingRosterSelector(selector)
        if (selector) selector.open = false
      })

      manualEditor.addEventListener('search', (event) => {
        const searchInput = event.target.closest?.('[data-player-search]')
        if (!searchInput || searchInput.value) return
        const selector = searchInput.closest('[data-player-select]')
        filterTrainingRosterSelector(selector)
        if (selector) selector.open = false
      })

      const applyTrainingSheetData = (data = {}) => {
        const d = data && typeof data === 'object' ? data : {}

        phasesRoot.innerHTML = ''
        phaseCount = 0
        form.reset()
        form.querySelectorAll('[name="pillars"]').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[data-player-select]').forEach((selector) => {
        const searchInput = selector.querySelector('[data-player-search]')
        if (searchInput) searchInput.value = ''
        filterTrainingRosterSelector(selector)
      })

      manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[data-player-search]').forEach((input) => { input.value = '' })
        if (form.elements.aggregated) form.elements.aggregated.value = ''
        if (form.elements.aggregated_count) form.elements.aggregated_count.value = '0'
        if (form.elements.aggregated_prova_count) form.elements.aggregated_prova_count.value = '0'
        if (form.elements.aggregated_youth_count) form.elements.aggregated_youth_count.value = '0'
        syncAggregatedUi()

        const location = String(d.location || '').trim()
        const availableLocations = [...form.elements.location.options].map((option) => option.value).filter((value) => value && value !== '__custom__')
        if (location && hasTeamLocation(availableLocations, location)) {
          form.elements.location.value = availableLocations.find((item) => item.toLocaleLowerCase('it-IT') === location.toLocaleLowerCase('it-IT')) || location
          if (form.elements.custom_location) form.elements.custom_location.value = ''
        } else if (location) {
          form.elements.location.value = '__custom__'
          if (form.elements.custom_location) form.elements.custom_location.value = location
        } else {
          form.elements.location.value = ''
          if (form.elements.custom_location) form.elements.custom_location.value = ''
        }
        syncTsLocation()

        const scalarFields = ['date', 'time', 'progressive', 'focus', 'objective', 'principles']
        scalarFields.forEach((fieldName) => {
          const field = form.elements.namedItem(fieldName)
          if (field) field.value = d[fieldName] ?? ''
        })
        if (!form.elements.time.value) form.elements.time.value = '17:30'

        const matchDay = d.match_day || d.matchDay || ''
        if (form.elements.match_day) form.elements.match_day.value = matchDay

        const phases = Array.isArray(d.phases) ? d.phases : []
        phases.length ? phases.forEach(addPhase) : addPhase()

        const pillars = Array.isArray(d.pillars) ? d.pillars : []
        pillars.forEach((value) => {
          const input = [...form.querySelectorAll('[name="pillars"]')].find((candidate) => candidate.value === value)
          if (input) input.checked = true
        })

        ;['absent', 'injured', 'differentiated'].forEach((type) => {
          const values = Array.isArray(d[type]) ? d[type] : []
          values.forEach((value) => {
            const normalizedValue = normalizePlayerValue(value)
            const tokenizedValue = normalizePlayerTokens(value)
            const input = [...manualEditor.querySelectorAll(`[data-player-select="${type}"] input`)].find((candidate) =>
              normalizePlayerValue(candidate.value) === normalizedValue ||
              normalizePlayerValue(candidate.dataset.canonicalName) === normalizedValue ||
              normalizePlayerTokens(candidate.dataset.canonicalName) === tokenizedValue
            )
            if (input) input.checked = true
          })
        })

        if (form.elements.aggregated) {
          const aggregatedValue = Array.isArray(d.aggregated) ? '' : String(d.aggregated || '')
          form.elements.aggregated.value = ['PROVA', 'SETTORE GIOVANILE'].includes(aggregatedValue) ? aggregatedValue : ''
        }
        {
          const legacyAggregatedType = String(d.aggregated || '')
          const legacyAggregatedCount = Math.max(0, Number(d.aggregated_count ?? d.aggregatedCount ?? 0))
          const provaCount = Math.max(0, Number(d.aggregated_prova_count ?? d.aggregatedProvaCount ?? (legacyAggregatedType === 'PROVA' ? legacyAggregatedCount : 0)))
          const youthCount = Math.max(0, Number(d.aggregated_youth_count ?? d.aggregatedYouthCount ?? (legacyAggregatedType === 'SETTORE GIOVANILE' ? legacyAggregatedCount : 0)))
          if (form.elements.aggregated_prova_count) form.elements.aggregated_prova_count.value = String(provaCount)
          if (form.elements.aggregated_youth_count) form.elements.aggregated_youth_count.value = String(youthCount)
          if (form.elements.aggregated_count) form.elements.aggregated_count.value = String(provaCount + youthCount)
        }
        syncAggregatedUi()

        manualEditor.querySelectorAll('[data-md]').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.md === matchDay)
        })
        manualEditor.querySelectorAll('[data-rating]').forEach((group) => {
          const value = Number(d[group.dataset.rating] || 0)
          const hiddenInput = group.querySelector('input')
          if (hiddenInput) hiddenInput.value = value || ''
          group.querySelectorAll('button').forEach((button) => {
            button.classList.toggle('is-active', Number(button.dataset.value) <= value)
          })
        })

        updateCounts()
        updatePreview()
        setTrainingDocument(d, { dirty: false })
      }

      const restore = () => {
        const raw = localStorage.getItem(storageKey)
        if (!raw) {
          applyTrainingSheetData({ time: '17:30', location: '' })
          return
        }
        try {
          applyTrainingSheetData(JSON.parse(raw))
        } catch (error) {
          console.warn('Bozza TS non leggibile:', error)
          localStorage.removeItem(storageKey)
          applyTrainingSheetData({ time: '17:30', location: '' })
        }
      }

      manualEditor.querySelector('[data-add-phase]')?.addEventListener('click',()=>{addPhase();updatePreview();scheduleSave()})
      manualEditor.querySelectorAll('[data-md]').forEach(button=>button.addEventListener('click',()=>{ manualEditor.querySelectorAll('[data-md]').forEach(b=>b.classList.remove('is-active')); button.classList.add('is-active'); form.elements.match_day.value=button.dataset.md; updatePreview(); scheduleSave() }))
      manualEditor.querySelectorAll('[data-rating]').forEach(group=>group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{ const value=Number(button.dataset.value); group.querySelector('input').value=value; group.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',Number(b.dataset.value)<=value)); updatePreview(); scheduleSave() })))
      manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => {
        input.addEventListener('change', () => {
          if (input.checked) {
            const currentType = input.closest('[data-player-select]')?.dataset.playerSelect
            const otherType = currentType === 'absent' ? 'injured' : 'absent'
            const twin = [...manualEditor.querySelectorAll(`[data-player-select="${otherType}"] input`)]
              .find((candidate) => candidate.value === input.value)
            if (twin) twin.checked = false
          }
        })
      })
      const rosterDisclosures = [...manualEditor.querySelectorAll('[data-player-select]')]
      const aggregatedDisclosure = manualEditor.querySelector('[data-aggregated-menu]')
      rosterDisclosures.forEach((details) => {
        details.addEventListener('toggle', () => {
          if (!details.open) return
          rosterDisclosures.forEach((other) => { if (other !== details) other.open = false })
          if (aggregatedDisclosure) aggregatedDisclosure.open = false
        })
      })
      aggregatedDisclosure?.addEventListener('toggle', () => {
        if (!aggregatedDisclosure.open) return
        rosterDisclosures.forEach((details) => { details.open = false })
      })
      manualEditor.querySelectorAll('[name="aggregated_prova_count"], [name="aggregated_youth_count"]').forEach((input) => {
        input.addEventListener('input', () => syncAggregatedUi({ keepOpen: true }))
      })
      form.addEventListener('input',()=>{updateCounts();updatePreview();scheduleSave()})
      form.addEventListener('change',()=>{updateCounts();updatePreview();scheduleSave()})
      manualEditor.querySelector('[data-analyze-exercises]')?.addEventListener('click',()=>{
        const d=collect(); const text=d.phases.map(p=>`${p.title} ${p.description}`).join(' ').toLowerCase(); const pillars=d.pillars
        const objectiveBits=[]; const principles=[]
        if(/costru|uscita|portiere|prima pressione/.test(text)){objectiveBits.push('creare vantaggio nella costruzione sotto pressione');principles.push('occupazione razionale degli spazi','ricerca dell’uomo libero','sostegno al possessore')}
        if(/possesso|rondo|jolly|conserv/.test(text)){objectiveBits.push('conservare il possesso con continuità');principles.push('smarcamento in appoggio','mobilità','qualità del primo controllo')}
        if(/final|porta|attacco|invasione|profond/.test(text)){objectiveBits.push('sfruttare il vantaggio per arrivare alla finalizzazione');principles.push('attacco della profondità','occupazione dell’area','tempi di inserimento')}
        if(/press|riaggress|transizione|riconquista/.test(text)){objectiveBits.push('proteggere il vantaggio attraverso pressione e riaggressione');principles.push('reazione immediata alla perdita','densità vicino alla palla','coperture preventive')}
        if(!objectiveBits.length) objectiveBits.push(pillars.length ? pillars.join(', ').toLowerCase() : 'sviluppare i comportamenti collettivi previsti dalla seduta')
        form.elements.objective.value=objectiveBits.join('; ').replace(/^./,c=>c.toUpperCase())+'.'
        form.elements.principles.value=[...new Set(principles)].join(', ') || 'Distanze funzionali, comunicazione, orientamento del corpo e velocità di esecuzione.'
        const note=manualEditor.querySelector('[data-ai-note]'); if(note) note.textContent='Proposta inserita: controlla e modifica liberamente i due campi.'
        updatePreview();scheduleSave()
      })
      const determineNextProgressive = () => {
        const fromPaths = appState.calendarEvents
          .map((event) => event.trainingSheetPath || '')
          .map((path) => Number(path.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || 0))
        const storedNext = Number(localStorage.getItem('nz-training-sheet-next-progressive') || 0)
        return Math.max(1, storedNext, ...fromPaths.map((value) => value + 1))
      }
      const confirmPdfPreview = (blob, fileName) => new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob)
        const overlay = document.createElement('div')
        overlay.className = 'ts-pdf-confirm-overlay'
        overlay.innerHTML = `
          <section class="ts-pdf-confirm-dialog" role="dialog" aria-modal="true" aria-label="Anteprima PDF">
            <header>
              <div><span>ANTEPRIMA DI STAMPA</span><strong>${escapeHtml(fileName)}</strong></div>
              <button type="button" data-pdf-cancel aria-label="Chiudi">×</button>
            </header>
            <iframe title="Anteprima PDF" src="${objectUrl}#toolbar=1&navpanes=0&view=FitH"></iframe>
            <footer>
              <button type="button" class="secondary" data-pdf-cancel>Annulla</button>
              <button type="button" class="primary" data-pdf-confirm>Conferma e salva PDF</button>
            </footer>
          </section>`
        document.body.appendChild(overlay)
        const finish = (confirmed) => {
          URL.revokeObjectURL(objectUrl)
          overlay.remove()
          resolve(confirmed)
        }
        overlay.querySelectorAll('[data-pdf-cancel]').forEach((button) => button.addEventListener('click', () => finish(false)))
        overlay.querySelector('[data-pdf-confirm]')?.addEventListener('click', () => finish(true))
        overlay.addEventListener('click', (event) => { if (event.target === overlay) finish(false) })
      })

      const createAndPublishPdf = async () => {
        const button = manualEditor.querySelector('[data-print-sheet]')
        const note = manualEditor.querySelector('[data-publish-note]')
        const rawData = collect()
        button.disabled = true
        button.classList.add('is-loading')
        const label = button.querySelector('span')
        const originalLabel = label?.textContent || 'Crea PDF'
        if (label) label.textContent = 'Creazione…'
        if (note) note.textContent = 'Creazione e pubblicazione della Training Sheet…'

        try {
          const publishTarget = resolveTrainingCalendarPublishTarget({
            events: appState.calendarEvents,
            eventId: currentEditingEventId,
            data: rawData,
          })
          const existingEvent = publishTarget.event

          const result = await publishTrainingSheet({
            rawData,
            previewElement: preview,
            team: getTeamProfile(),
            squadTotal,
            existingEvent,
            duplicateEvents: publishTarget.duplicateEvents,
            confirmPreview: confirmPdfPreview,
            createEvent: createCalendarEvent,
            updateEvent: updateCalendarEvent,
            deleteEvent: deleteCalendarEvent,
          })

          if (result.cancelled) {
            if (note) note.textContent = 'Creazione PDF annullata. Nessun file è stato salvato.'
            return
          }

          localStorage.setItem('nz-training-sheet-next-progressive', String(Number(result.data.progressive || 1) + 1))
          localStorage.setItem(`nz-training-sheet:${result.filePath}`, JSON.stringify(result.data))
          localStorage.setItem(storageKey, JSON.stringify(result.data))
          await loadCalendarEvents()
          currentEditingEventId = String(result.event?.id || existingEvent?.id || currentEditingEventId || '')
          if (currentEditingEventId) localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
          setTrainingDocument(result.data, { dirty: false })
          if (note) {
            note.textContent = result.warnings?.length
              ? `Training Sheet pubblicata nel Calendario. ${result.warnings.map((warning) => warning.message).join(' ')}`
              : 'PDF creato e Training Sheet pubblicata nel Calendario.'
          }
        } catch (error) {
          console.error('Errore pubblicazione Training Sheet:', error)
          if (note) note.textContent = getDataAccessUserMessage(error, undefined, { stage: 'training-publish' })
        } finally {
          button.disabled = false
          button.classList.remove('is-loading')
          if (label) label.textContent = originalLabel
        }
      }

      const resetEditor = () => {
        if (!window.confirm('Vuoi cancellare tutti i campi della Training Sheet Editor?')) return
        localStorage.removeItem(storageKey)
        localStorage.removeItem('nz-training-sheet-open-event-id')
        currentEditingEventId = ''
        setTrainingDocument({ status: TRAINING_SHEET_STATUS.DRAFT }, { dirty: false })
        const openSheetSelect = manualEditor.querySelector('[data-open-training-sheet]')
        const openSheetButton = manualEditor.querySelector('[data-open-training-sheet-button]')
        if (openSheetSelect) openSheetSelect.value = ''
        if (openSheetButton) openSheetButton.disabled = true
        form.reset()
        form.elements.time.value = '17:30'
        form.elements.location.value = ''
        if (form.elements.custom_location) form.elements.custom_location.value = ''
        syncTsLocation()
        manualEditor.querySelectorAll('[data-md] button, [data-md]').forEach?.(() => {})
        manualEditor.querySelectorAll('[data-md]').forEach((button) => button.classList.remove('is-active'))
        manualEditor.querySelectorAll('[data-rating] button').forEach((button) => button.classList.remove('is-active'))
        manualEditor.querySelectorAll('[data-player-select] input').forEach((input) => { input.checked = false })
        manualEditor.querySelectorAll('[name="pillars"]')?.forEach?.((input) => { input.checked = false })
        phasesRoot.innerHTML = ''
        addPhase()
        form.elements.progressive.value = String(determineNextProgressive())
        const today = new Date().toLocaleDateString('sv-SE')
        form.elements.date.value = today
        updateCounts(); updatePreview(); saveDraft()
        if (draftState) draftState.textContent = 'Editor azzerato'
        showTsStep(1)
      }
      manualEditor.querySelector('[data-reset-training-sheet]')?.addEventListener('click', resetEditor)

      const openSheetSelect = manualEditor.querySelector('[data-open-training-sheet]')
      const openSheetButton = manualEditor.querySelector('[data-open-training-sheet-button]')

      const loadTrainingSheetByEventId = async (eventId) => {
        if (!eventId) return false
        if (draftState) draftState.textContent = 'Apertura Training Sheet…'
        if (openSheetButton) openSheetButton.disabled = true

        try {
          let selected = appState.calendarEvents.find((item) => String(item.id) === String(eventId))

          // Lettura diretta come fallback: evita che cache o lista eventi non aggiornata
          // impediscano di riaprire una Training Sheet appena pubblicata.
          if (!selected?.editorData && supabase) {
            let rawEvent = null
            try { rawEvent = await getCalendarEvent(eventId) } catch (_) {}

            if (rawEvent) {
              let parsedNotes = {}
              try { parsedNotes = JSON.parse(rawEvent.notes || '{}') } catch { parsedNotes = {} }
              selected = {
                ...(selected || {}),
                id: rawEvent.id,
                startAt: rawEvent.start_at,
                time: new Date(rawEvent.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                place: rawEvent.location || '',
                matchDay: rawEvent.match_day || null,
                trainingSheetPath: rawEvent.training_sheet_path || null,
                editorData: parsedNotes?.type === 'training_sheet_editor' ? parsedNotes.data : null,
              }
            }
          }

          if (!selected) throw new Error('Training Sheet non trovata nel Calendario.')

          const savedKey = selected.trainingSheetPath ? `nz-training-sheet:${selected.trainingSheetPath}` : ''
          const localSaved = savedKey ? localStorage.getItem(savedKey) : null
          let parsedLocalData = null
          if (localSaved) {
            try { parsedLocalData = JSON.parse(localSaved) } catch { parsedLocalData = null }
          }
          const rawSourceData = selected.editorData || parsedLocalData
          if (!rawSourceData && !selected.trainingSheetPath) {
            const draftData = buildTrainingDraftFromCalendarEvent(selected, {
              progressive: determineNextProgressive(),
              present: selected.presentCount ?? squadTotal,
              phases: [{}],
            })
            currentEditingEventId = String(selected.id)
            applyTrainingSheetData(draftData)
            localStorage.setItem(storageKey, JSON.stringify(draftData))
            localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
            if (openSheetSelect) openSheetSelect.value = ''
            updateTrainingWorkflowUi({ dirty: false })
            if (draftState) draftState.textContent = 'Bozza collegata al Calendario'
            return true
          }
          const normalizeLoadedData = (source = {}) => ({
            status: source.status || TRAINING_SHEET_STATUS.PUBLISHED,
            created_at: source.created_at || source.createdAt || null,
            updated_at: source.updated_at || source.updatedAt || null,
            published_at: source.published_at || source.publishedAt || null,
            archived_at: source.archived_at || source.archivedAt || null,
            date: source.date || new Date(selected.startAt).toLocaleDateString('sv-SE'),
            time: source.time || selected.time || '17:30',
            location: source.location || selected.place || '',
            progressive: source.progressive || selected.trainingSheetPath?.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || determineNextProgressive(),
            present: source.present ?? selected.presentCount ?? squadTotal,
            focus: source.focus || '',
            match_day: source.match_day || source.matchDay || selected.matchDay || '',
            intensity: source.intensity || '',
            volume: source.volume || '',
            objective: source.objective || '',
            principles: source.principles || '',
            pillars: Array.isArray(source.pillars) ? source.pillars : [],
            absent: Array.isArray(source.absent) ? source.absent : (Array.isArray(source.absences?.absent) ? source.absences.absent : []),
            injured: Array.isArray(source.injured) ? source.injured : (Array.isArray(source.absences?.injured) ? source.absences.injured : []),
            differentiated: Array.isArray(source.differentiated) ? source.differentiated : [],
            aggregated: typeof source.aggregated === 'string' ? source.aggregated : '',
            aggregated_count: Math.max(0, Number(source.aggregated_count ?? source.aggregatedCount ?? 0)),
            aggregated_prova_count: Math.max(0, Number(source.aggregated_prova_count ?? source.aggregatedProvaCount ?? 0)),
            aggregated_youth_count: Math.max(0, Number(source.aggregated_youth_count ?? source.aggregatedYouthCount ?? 0)),
            phases: Array.isArray(source.phases) ? source.phases.map((phase = {}) => ({
              title: phase.title || '',
              duration: phase.duration ?? phase.duration_minutes ?? '',
              goalkeepers: phase.goalkeepers === true ? 'yes' : phase.goalkeepers === false ? 'no' : (phase.goalkeepers || 'no'),
              description: phase.description || phase.notes || '',
              variants: phase.variants || '',
              coaching: phase.coaching || phase.coaching_points || '',
              split: Boolean(phase.split),
              parallelA: phase.parallelA && typeof phase.parallelA === 'object' ? phase.parallelA : { title: '', description: '' },
              parallelB: phase.parallelB && typeof phase.parallelB === 'object' ? phase.parallelB : { title: '', description: '' },
            })) : [],
          })
          const sourceData = rawSourceData ? normalizeLoadedData(rawSourceData) : null

          if (sourceData) {
            currentEditingEventId = String(selected.id)
            applyTrainingSheetData(sourceData)
            localStorage.setItem(storageKey, JSON.stringify(collect()))
          } else {
            // Compatibilità con PDF storici: ripristina almeno i dati disponibili,
            // senza fingere di poter ricostruire contenuti mai salvati come JSON.
            applyTrainingSheetData({
              status: TRAINING_SHEET_STATUS.PUBLISHED,
              date: new Date(selected.startAt).toLocaleDateString('sv-SE'),
              time: selected.time || '17:30',
              location: selected.place || '',
              match_day: selected.matchDay || '',
              progressive: String(Number(selected.trainingSheetPath?.match(/(?:ALL|AL)[_-]?(\d{1,3})/i)?.[1] || determineNextProgressive())),
              phases: [{}],
            })
            saveDraft()
            if (draftState) draftState.textContent = 'TS storica: disponibili solo i dati archiviati'
            return true
          }

          currentEditingEventId = String(selected.id)
          localStorage.setItem('nz-training-sheet-open-event-id', currentEditingEventId)
          if (openSheetSelect) openSheetSelect.value = String(selected.id)
          updateTrainingWorkflowUi({ dirty: false })
          return true
        } catch (error) {
          console.error('Errore apertura Training Sheet:', error)
          if (draftState) draftState.textContent = getDataAccessUserMessage(error, undefined, { stage: 'training-sheet-open' })
          return false
        } finally {
          if (openSheetButton) openSheetButton.disabled = !openSheetSelect?.value
        }
      }

      openSheetSelect?.addEventListener('change', () => {
        if (openSheetButton) openSheetButton.disabled = !openSheetSelect.value
      })
      openSheetButton?.addEventListener('click', () => loadTrainingSheetByEventId(openSheetSelect?.value))

      manualEditor.querySelectorAll('[data-print-sheet]').forEach((button) => button.addEventListener('click', createAndPublishPdf))
      showTsStep(1)
      restore()

      const pendingOpenEventId = localStorage.getItem('nz-training-sheet-open-event-id')
      if (pendingOpenEventId && appState.calendarEvents.some((item) => String(item.id) === String(pendingOpenEventId))) {
        loadTrainingSheetByEventId(pendingOpenEventId)
      }
      const nextProgressive = determineNextProgressive()
      if (form.elements.progressive && Number(form.elements.progressive.value || 0) < nextProgressive) {
        form.elements.progressive.value = String(nextProgressive)
      }
      updateCounts();updatePreview()
    }
}
