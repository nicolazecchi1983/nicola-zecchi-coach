export function wireTeamAndRosterEvents({
  root, setView, bindStaffColorPickers, saveTeamProfile, appState,
  replaceTeamFacilities, getTeamProfile, teamLogoHtml, modalRoot,
  rosterPlayerModalHtml, saveRosterPlayer, legacyPlayers, loadRosterPlayers,
  activePlayers, rosterPlayerIdentity, removeRosterPlayer, showAccessNotice, getDataAccessUserMessage,
  documentRef = globalThis.document, windowRef = globalThis.window,
  FileCtor = globalThis.File, FileReaderCtor = globalThis.FileReader,
}) {
    root.querySelector('[data-open-team-settings]')?.addEventListener('click', () => setView('team-settings', 'Identità squadra'))
    root.querySelector('[data-open-team-roster]')?.addEventListener('click', () => setView('squad', 'Rosa'))

    const teamSettingsForm = root.querySelector('[data-team-settings-form]')
    if (teamSettingsForm) {
      const logoInput = teamSettingsForm.elements.logoFile
      const hiddenLogo = teamSettingsForm.elements.logo
      const message = teamSettingsForm.querySelector('[data-team-settings-message]')
      const preview = teamSettingsForm.querySelector('[data-team-brand-preview]')
      const refreshPreview = () => {
        const data = Object.fromEntries(new FormData(teamSettingsForm).entries())
        preview.style.setProperty('--team-primary', data.primaryColor || '#07194f')
        preview.style.setProperty('--team-secondary', data.secondaryColor || '#1f93e5')
        preview.querySelector('strong').textContent = data.name || 'Squadra'
        preview.querySelector('span').textContent = [data.category, data.competitionGroup ? `Girone ${data.competitionGroup}` : '', data.season].filter(Boolean).join(' · ')
      }
      teamSettingsForm.addEventListener('input', refreshPreview)
      logoInput?.addEventListener('change', async () => {
        const file = logoInput.files?.[0]
        if (!file) return
        if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          message.textContent = 'Usa un’immagine PNG, JPG o WebP inferiore a 2 MB.'
          logoInput.value = ''
          return
        }
        const reader = new FileReaderCtor()
        reader.onload = () => {
          hiddenLogo.value = String(reader.result || '')
          const old = preview.querySelector('.team-brand-preview-logo')
          old?.replaceWith(Object.assign(documentRef.createElement('img'), {
            className: 'team-brand-preview-logo',
            src: hiddenLogo.value,
            alt: 'Logo squadra',
          }))
        }
        reader.readAsDataURL(file)
      })
      teamSettingsForm.querySelector('[data-team-logo-remove]')?.addEventListener('click', () => {
        hiddenLogo.value = ''
        logoInput.value = ''
        const old = preview.querySelector('.team-brand-preview-logo')
        if (old) {
          const fallback = documentRef.createElement('span')
          fallback.className = 'team-brand-preview-logo team-brand-preview-logo--fallback'
          fallback.textContent = (teamSettingsForm.elements.shortName.value || 'T').slice(0,2).toUpperCase()
          old.replaceWith(fallback)
        }
      })
      bindStaffColorPickers(teamSettingsForm)
      const tokenPreview = teamSettingsForm.querySelector('[data-team-token-preview] .team-token-preview')
      const refreshTeamPreview = () => {
        const primary = teamSettingsForm.elements.primaryColor.value
        const secondary = teamSettingsForm.elements.secondaryColor.value
        const pattern = teamSettingsForm.elements.kitPattern.value
        preview.style.setProperty('--team-primary', primary)
        preview.style.setProperty('--team-secondary', secondary)
        if (tokenPreview) {
          tokenPreview.style.setProperty('--token-primary', primary)
          tokenPreview.style.setProperty('--token-secondary', secondary)
          tokenPreview.className = `team-token-preview team-token-preview--${pattern} staff-team-token staff-team-token--preview`
          const label = tokenPreview.querySelector('small')
          if (label) label.textContent = teamSettingsForm.elements.shortName.value || 'TEAM'
        }
      }
      teamSettingsForm.addEventListener('input', refreshTeamPreview)
      teamSettingsForm.addEventListener('change', refreshTeamPreview)

      const facilitiesList = teamSettingsForm.querySelector('[data-team-facilities-list]')
      const bindFacilityRemoveButtons = () => {
        facilitiesList?.querySelectorAll('[data-remove-team-facility]').forEach((button) => {
          if (button.dataset.bound === 'true') return
          button.dataset.bound = 'true'
          button.addEventListener('click', () => {
            button.closest('[data-team-facility-row]')?.remove()
            if (facilitiesList && !facilitiesList.querySelector('[data-team-facility-row]')) {
              facilitiesList.innerHTML = '<div class="team-facilities-empty" data-team-facilities-empty>Nessun impianto configurato. Aggiungi il primo campo della squadra.</div>'
            }
          })
        })
      }
      bindFacilityRemoveButtons()
      teamSettingsForm.querySelector('[data-add-team-facility]')?.addEventListener('click', () => {
        if (!facilitiesList) return
        facilitiesList.querySelector('[data-team-facilities-empty]')?.remove()
        const row = documentRef.createElement('div')
        row.className = 'team-facility-row'
        row.dataset.teamFacilityRow = ''
        row.innerHTML = '<input name="facility_name" type="text" maxlength="100" placeholder="Nome campo / impianto" aria-label="Nome campo o impianto"><button type="button" class="ghost-button team-facility-remove" data-remove-team-facility>Rimuovi</button>'
        facilitiesList.appendChild(row)
        bindFacilityRemoveButtons()
        row.querySelector('input')?.focus()
      })

      teamSettingsForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const submitButton = teamSettingsForm.querySelector('button[type="submit"]')
        const formData = new FormData(teamSettingsForm)
        const data = Object.fromEntries(formData.entries())
        const logoFile = formData.get('logoFile')
        delete data.logoFile
        submitButton.disabled = true
        submitButton.textContent = 'Salvataggio...'
        message.textContent = ''
        try {
          await saveTeamProfile(data, { user: appState.currentUser, logoFile, removeLogo: !data.logo && !(logoFile instanceof FileCtor && logoFile.size) })
          const facilityNames = [...teamSettingsForm.querySelectorAll('[data-team-facility-row] input')]
            .map((input) => input.value)
          appState.teamFacilities = await replaceTeamFacilities(getTeamProfile().id, facilityNames)
          message.textContent = 'Squadra, impianti e Rosa sincronizzati.'
          message.classList.remove('is-error')
          documentRef.querySelectorAll('.team-brand-logo').forEach((node) => {
            const wrapper = documentRef.createElement('div')
            wrapper.innerHTML = teamLogoHtml(node.className)
            node.replaceWith(wrapper.firstElementChild)
          })
        } catch (error) {
          console.error('Errore salvataggio identità squadra:', error)
          message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'team-settings-save' })
          message.classList.add('is-error')
        } finally {
          submitButton.disabled = false
          submitButton.textContent = 'Salva identità squadra'
        }
      })
    }

    const closeRosterPlayerModal = () => {
      modalRoot.innerHTML = ''
      documentRef.body.classList.remove('new-event-modal-open')
    }

    const openRosterPlayerModal = (player = null) => {
      if (!modalRoot) return
      modalRoot.innerHTML = rosterPlayerModalHtml(player)
      documentRef.body.classList.add('new-event-modal-open')

      modalRoot.querySelectorAll('[data-close-roster-player]').forEach((element) => {
        element.addEventListener('click', (event) => {
          if (element.classList.contains('new-event-modal-backdrop') && event.target !== element) return
          closeRosterPlayerModal()
        })
      })

      modalRoot.querySelector('[data-roster-player-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const message = form.querySelector('[data-roster-player-message]')
        const submit = form.querySelector('button[type="submit"]')
        const values = Object.fromEntries(new FormData(form).entries())
        submit.disabled = true
        message.textContent = ''
        try {
          await saveRosterPlayer({
            team: getTeamProfile(),
            legacyPlayers,
            player: {
              id: values.id || null,
              key: values.key || null,
              name: values.name,
              role: values.role,
              year: values.year,
              foot: values.foot,
              number: values.number,
              status: values.status,
            },
          })
          await loadRosterPlayers()
          closeRosterPlayerModal()
          await setView('squad', 'Rosa')
        } catch (error) {
          console.error('Salvataggio giocatore Rosa non riuscito:', error)
          message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'roster-player-save' })
          message.className = 'form-message is-error'
          submit.disabled = false
        }
      })
    }

    root.querySelectorAll('[data-roster-create]').forEach((button) => {
      button.addEventListener('click', () => openRosterPlayerModal())
    })

    root.querySelectorAll('[data-roster-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const player = activePlayers().find((item) => rosterPlayerIdentity(item) === button.dataset.rosterEdit)
        if (player) openRosterPlayerModal(player)
      })
    })

    root.querySelectorAll('[data-roster-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const player = activePlayers().find((item) => String(item.id || '') === String(button.dataset.rosterRemove || ''))
        if (!player) return
        if (!windowRef.confirm(`Rimuovere ${player.name} dalla Rosa? I dati storici delle partite resteranno invariati.`)) return
        button.disabled = true
        try {
          await removeRosterPlayer({
            team: getTeamProfile(),
            playerId: player.id,
            legacyPlayers,
          })
          await loadRosterPlayers()
          await setView('squad', 'Rosa')
        } catch (error) {
          console.error('Rimozione giocatore Rosa non riuscita:', error)
          showAccessNotice(getDataAccessUserMessage(error, undefined, { stage: 'roster-player-remove' }))
          button.disabled = false
        }
      })
    })
}
