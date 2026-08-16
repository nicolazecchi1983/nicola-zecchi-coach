import { getDataAccessUserMessage } from '../../../infrastructure/dataAccess/dataAccessUserFeedback.js'
export function wirePlayerProfileEvents({
  root,
  activePlayers,
  rosterPlayerIdentity,
  modalRoot,
  playerProfileModalHtml,
  savePlayerProfile,
  appState,
  rosterPlayerKey,
  documentRef = globalThis.document,
}) {
    root.querySelectorAll('[data-player-profile]').forEach((button) => {
      button.addEventListener('click', () => {
        const player = activePlayers().find((item) => rosterPlayerIdentity(item) === button.dataset.playerProfile)
        if (!player || !modalRoot) return
        modalRoot.innerHTML = playerProfileModalHtml(player)
        documentRef.body.classList.add('new-event-modal-open')

        const closeProfile = () => {
          modalRoot.innerHTML = ''
          documentRef.body.classList.remove('new-event-modal-open')
        }

        modalRoot.querySelectorAll('[data-close-player-profile]').forEach((element) => {
          element.addEventListener('click', (event) => {
            if (element.classList.contains('player-profile-backdrop') && event.target !== element) return
            closeProfile()
          })
        })

        modalRoot.querySelector('[data-player-profile-form]')?.addEventListener('submit', async (event) => {
          event.preventDefault()
          const profileForm = event.currentTarget
          const message = profileForm.querySelector('[data-player-profile-message]')
          const values = Object.fromEntries(new FormData(profileForm).entries())
          const numberOrNull = (value) => value === '' ? null : Number(value)
          const payload = {
            full_name: String(values.full_name || '').trim(),
            role: values.role,
            birth_year: values.birth_year || null,
            preferred_foot: values.preferred_foot || null,
            height_cm: numberOrNull(values.height_cm),
            weight_kg: numberOrNull(values.weight_kg),
            phone: values.phone || null,
            email: values.email || null,
            technical_notes: values.technical_notes || null,
            injury_notes: values.injury_notes || null,
            updated_at: new Date().toISOString(),
          }
          try {
            const saved = await savePlayerProfile(player, payload)
            const profileIdentity = rosterPlayerIdentity(player)
            appState.playerProfiles[profileIdentity] = saved
            const legacyProfileKey = rosterPlayerKey(player)
            if (legacyProfileKey && legacyProfileKey !== profileIdentity) {
              appState.playerProfiles[legacyProfileKey] = saved
            }
            message.textContent = 'Scheda salvata correttamente.'
            message.className = 'form-message is-success'
          } catch (error) {
            message.textContent = getDataAccessUserMessage(error, undefined, { stage: 'player-profile-save' })
            message.className = 'form-message is-error'
          }
        })
      })
    })
}
