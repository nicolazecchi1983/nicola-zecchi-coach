export function wireStaffEvents({
  root,
  getDataAccessUserMessage,
  can,
  capabilities,
  showAccessNotice,
  generateTemporaryPassword,
  getTeamProfile,
  createStaffUser,
  appState,
  loadStaffProfiles,
  staffManagementView,
  bindDynamic,
  updateStaffProfile,
  setAccessRole,
  syncProfileHeader,
  deleteStaffUser,
  supabase,
  confirmUser = globalThis.confirm,
}) {
    const createStaffPanel = root.querySelector('[data-create-staff-form]')
    const toggleCreateStaff = (open) => {
      if (!createStaffPanel) return
      createStaffPanel.hidden = !open
      root.querySelector('[data-toggle-create-staff]')?.setAttribute('aria-expanded', String(open))
      if (open) createStaffPanel.querySelector('input[name="first_name"]')?.focus()
    }

    root.querySelector('[data-toggle-create-staff]')?.addEventListener('click', () => {
      if (!can(capabilities.STAFF_CREATE)) { showAccessNotice(); return }
      toggleCreateStaff(createStaffPanel?.hidden !== false)
    })
    root.querySelector('[data-close-create-staff]')?.addEventListener('click', () => toggleCreateStaff(false))
    root.querySelector('[data-cancel-create-staff]')?.addEventListener('click', () => {
      createStaffPanel?.reset()
      toggleCreateStaff(false)
    })
    root.querySelector('[data-generate-staff-password]')?.addEventListener('click', () => {
      const input = createStaffPanel?.querySelector('input[name="password"]')
      if (input) {
        input.value = generateTemporaryPassword()
        input.focus()
        input.select()
      }
    })
    createStaffPanel?.addEventListener('submit', async (event) => {
      event.preventDefault()
      if (!can(capabilities.STAFF_CREATE)) { showAccessNotice(); return }
      const form = event.currentTarget
      const message = form.querySelector('[data-create-staff-message]')
      const submit = form.querySelector('button[type="submit"]')
      const data = new FormData(form)
      const teamId = getTeamProfile().id || null
      submit.disabled = true
      message.textContent = 'Creazione account in corso…'
      message.className = 'form-message'
      try {
        const result = await createStaffUser({
          teamId,
          firstName: data.get('first_name')?.toString().trim(),
          lastName: data.get('last_name')?.toString().trim(),
          email: data.get('email')?.toString().trim(),
          password: data.get('password')?.toString(),
          role: data.get('role')?.toString(),
          appRole: data.get('app_role')?.toString(),
        })
        appState.staffFlashMessage = `${result.firstName} ${result.lastName} creato correttamente.`
        form.reset()
        await loadStaffProfiles()
        root.innerHTML = staffManagementView()
        bindDynamic()
      } catch (error) {
        message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'staff-user-create' })
        message.className = 'form-message is-error'
      } finally {
        submit.disabled = false
      }
    })

    root.querySelectorAll('[data-staff-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!can(capabilities.STAFF_UPDATE)) { showAccessNotice(); return }
        const userId = form.dataset.userId
        const data = new FormData(form)
        const message = form.querySelector('[data-staff-message]')
        const payload = {
          first_name: data.get('first_name')?.toString().trim() ?? '',
          last_name: data.get('last_name')?.toString().trim() ?? '',
          role: data.get('role')?.toString() ?? 'observer',
          app_role: form.dataset.isOwner === 'true' ? 'owner' : (data.get('app_role')?.toString() ?? 'collaborator'),
          active: form.dataset.isOwner === 'true' ? true : data.get('active') === 'on',
          updated_at: new Date().toISOString(),
        }

        try {
          await updateStaffProfile({
            userId,
            firstName: payload.first_name,
            lastName: payload.last_name,
            technicalRole: payload.role,
            accessRole: payload.app_role,
            active: payload.active,
          })
        } catch (error) {
          message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'staff-user-update' })
          message.className = 'form-message is-error'
          return
        }

        message.textContent = 'Membro aggiornato.'
        message.className = 'form-message is-success'

        if (userId === appState.currentUser.id) {
          appState.currentUserProfile = { ...appState.currentUserProfile, ...payload }
          appState.currentUserRole = payload.role
          setAccessRole(payload.app_role)
          syncProfileHeader()
        }
      })
    })

    root.querySelectorAll('[data-delete-staff-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!can(capabilities.STAFF_DELETE)) { showAccessNotice(); return }
        const form = button.closest('[data-staff-form]')
        const userId = form?.dataset.userId
        const name = form?.querySelector('[data-staff-message]')?.closest('.staff-member-actions')?.querySelector('.staff-member-name')?.textContent?.trim() || 'questo utente'
        if (!userId) return
        const confirmed = confirmUser?.(`Eliminare definitivamente ${name}? L’utente perderà subito l’accesso al portale. Questa operazione non può essere annullata.`)
        if (!confirmed) return
        const message = form.querySelector('[data-staff-message]')
        button.disabled = true
        message.textContent = 'Eliminazione account in corso…'
        message.className = 'form-message'
        try {
          await deleteStaffUser({ teamId: getTeamProfile().id || null, userId })
          appState.staffFlashMessage = `${name} eliminato correttamente.`
          await loadStaffProfiles()
          root.innerHTML = staffManagementView()
          bindDynamic()
        } catch (error) {
          message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'staff-user-delete' })
          message.className = 'form-message is-error'
          button.disabled = false
        }
      })
    })

    root.querySelector('[data-password-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      const password = data.get('password')?.toString() ?? ''
      const confirmation = data.get('password_confirm')?.toString() ?? ''
      const message = form.querySelector('[data-password-message]')
      if (password !== confirmation) { message.textContent = 'Le password non coincidono.'; message.className = 'form-message is-error'; return }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'staff-password-update' }); message.className = 'form-message is-error'; return }
      form.reset()
      message.textContent = 'Password aggiornata.'
      message.className = 'form-message is-success'
    })
}
