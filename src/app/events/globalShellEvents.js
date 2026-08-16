import { getDataAccessUserMessage } from '../../infrastructure/dataAccess/dataAccessUserFeedback.js'
export function wireGlobalShellEvents({
  document,
  workspaceEngine,
  setView,
  setActiveNavigation,
  bindGlobalAccessGuard,
  showAccessNotice,
  closeDrawer,
  closeNewEventModal,
}) {
  const profileMenuButton = document.querySelector('#profileMenuButton')
  const profileDropdown = document.querySelector('#profileDropdown')
  const mobileDrawerShell = document.querySelector('[data-mobile-drawer-shell]')
  const mobileDrawerOpen = document.querySelector('[data-mobile-drawer-open]')
  const mobileDrawerCloseButtons = document.querySelectorAll('[data-mobile-drawer-close]')

  if (mobileDrawerShell) mobileDrawerShell.inert = true

  const openProfileMenu = () => {
    if (!profileMenuButton || !profileDropdown) return
    profileMenuButton.setAttribute('aria-expanded', 'true')
    profileDropdown.inert = false
    profileDropdown.setAttribute('aria-hidden', 'false')
    profileDropdown.classList.add('is-open')
    document.body.classList.add('profile-menu-open')
  }

  const closeProfileMenu = () => {
    if (!profileMenuButton || !profileDropdown) return
    profileMenuButton.setAttribute('aria-expanded', 'false')
    if (profileDropdown.contains(document.activeElement)) {
      profileMenuButton.focus({ preventScroll: true })
    }
    profileDropdown.inert = true
    profileDropdown.setAttribute('aria-hidden', 'true')
    profileDropdown.classList.remove('is-open')
    document.body.classList.remove('profile-menu-open')
  }

  const toggleProfileMenu = () => {
    if (profileDropdown?.classList.contains('is-open')) closeProfileMenu()
    else openProfileMenu()
  }

  const closeMobileDrawer = () => {
    if (!mobileDrawerShell || !mobileDrawerOpen) return
    if (mobileDrawerShell.contains(document.activeElement)) {
      mobileDrawerOpen.focus({ preventScroll: true })
    }
    mobileDrawerShell.classList.remove('is-open')
    mobileDrawerShell.inert = true
    mobileDrawerShell.setAttribute('aria-hidden', 'true')
    mobileDrawerOpen.setAttribute('aria-expanded', 'false')
    document.documentElement.classList.remove('mobile-drawer-open')
  }

  const openMobileDrawer = () => {
    if (!mobileDrawerShell || !mobileDrawerOpen) return
    closeProfileMenu()
    mobileDrawerShell.inert = false
    mobileDrawerShell.setAttribute('aria-hidden', 'false')
    mobileDrawerShell.classList.add('is-open')
    mobileDrawerOpen.setAttribute('aria-expanded', 'true')
    document.documentElement.classList.add('mobile-drawer-open')
    requestAnimationFrame(() => {
      mobileDrawerShell.querySelector('.mobile-drawer-close')?.focus({ preventScroll: true })
    })
  }

  const toggleMobileDrawer = () => {
    if (mobileDrawerShell?.classList.contains('is-open')) closeMobileDrawer()
    else openMobileDrawer()
  }

  bindGlobalAccessGuard()

  document.querySelectorAll('[data-nav-group-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const group = toggle.closest('[data-nav-group]')
      const expanded = toggle.getAttribute('aria-expanded') !== 'false'
      toggle.setAttribute('aria-expanded', String(!expanded))
      group?.classList.toggle('is-collapsed', expanded)
    })
  })

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', async () => {
      const sectionKey = button.dataset.section
      const sectionLabel = button.textContent.trim()
      const previousSection = workspaceEngine.getActiveKey()

      try {
        const openedSection = await setView(sectionKey, sectionLabel)
        setActiveNavigation(openedSection)
        localStorage.setItem('nz-active-section', openedSection)
        closeProfileMenu()
        closeMobileDrawer()
      } catch (error) {
        console.error(`Errore apertura sezione ${sectionKey}:`, error)
        if (previousSection) setActiveNavigation(previousSection)
        showAccessNotice(getDataAccessUserMessage(error, undefined, { stage: 'app-section-open' }))
      }
    })
  })

  let profilePointerHandled = false
  const handleProfileMenuPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    profilePointerHandled = true
    toggleProfileMenu()
  }

  const handleProfileMenuClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (profilePointerHandled) {
      profilePointerHandled = false
      return
    }
    toggleProfileMenu()
  }

  mobileDrawerOpen?.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    toggleMobileDrawer()
  })

  mobileDrawerCloseButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      closeMobileDrawer()
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileDrawerShell?.classList.contains('is-open')) {
      closeMobileDrawer()
      mobileDrawerOpen?.focus()
    }
  })

  profileMenuButton?.addEventListener('pointerdown', handleProfileMenuPointerDown)
  profileMenuButton?.addEventListener('click', handleProfileMenuClick)
  profileDropdown?.addEventListener('click', (event) => event.stopPropagation())

  document.querySelectorAll('[data-profile-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.dataset.profileAction
      if (action === 'profile') {
        setActiveNavigation('')
        await setView('profile', 'Profilo')
        closeProfileMenu()
        return
      }
      if (action === 'logout') closeProfileMenu()
    })
  })

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile-menu-wrapper')) closeProfileMenu()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProfileMenu()
      closeDrawer()
      closeNewEventModal()
    }
  })
}
