export function wireProfileEvents({ root, supabase, appState, syncProfileHeader, setView }) {
  root.querySelector('[data-profile-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const firstName = formData.get('first_name')?.toString().trim() ?? ''
    const lastName = formData.get('last_name')?.toString().trim() ?? ''
    const message = form.querySelector('[data-profile-message]')
    if (!firstName || !lastName) return

    const fullName = `${firstName} ${lastName}`.trim()
    const { error: profileError } = await supabase.rpc('update_my_profile', {
      p_first_name: firstName,
      p_last_name: lastName,
    })
    if (profileError) {
      message.textContent = profileError.message
      message.className = 'form-message is-error'
      return
    }

    const { data, error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    if (authError) {
      message.textContent = authError.message
      message.className = 'form-message is-error'
      return
    }

    appState.currentUser = data.user
    appState.currentUserProfile = {
      ...appState.currentUserProfile,
      first_name: firstName,
      last_name: lastName,
    }
    syncProfileHeader()
    message.textContent = 'Profilo aggiornato.'
    message.className = 'form-message is-success'
  })

  root.querySelector('[data-open-staff]')?.addEventListener('click', async () => {
    await setView('staff', 'Gestione Staff')
  })

  root.querySelector('[data-open-profile]')?.addEventListener('click', async () => {
    await setView('profile', 'Profilo')
  })
}
