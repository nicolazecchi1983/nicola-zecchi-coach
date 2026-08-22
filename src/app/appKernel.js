import { isSupabaseConfigured, supabase } from '../supabase.js'
import {
  signIn,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
} from '../services/auth.js'
import { renderLogin } from '../modules/auth/loginView.js'
import { renderApp, attachAppEvents, prepareAppData } from './appController.js'

function createDomAdapter(rootElement) {
  if (!rootElement) throw new Error('Root applicativo #app non trovato')

  return {
    render(html) {
      rootElement.innerHTML = html
    },
    query(selector) {
      return document.querySelector(selector)
    },
  }
}

export function createAppKernel({ rootElement = document.querySelector('#app') } = {}) {
  const dom = createDomAdapter(rootElement)
  let authSubscription = null
  let renderedUserId = null
  let dashboardRenderPromise = null

  function attachPasswordToggle() {
    dom.query('#togglePassword')?.addEventListener('click', () => {
      const input = dom.query('#password')
      const button = dom.query('#togglePassword')
      if (!input || !button) return

      const visible = input.type === 'text'
      input.type = visible ? 'password' : 'text'
      button.textContent = visible ? 'Mostra' : 'Nascondi'
    })
  }

  async function showLogin() {
    renderedUserId = null
    dom.render(renderLogin({ configured: isSupabaseConfigured }))
    attachPasswordToggle()

    dom.query('#loginForm')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      if (!supabase) return

      const form = new FormData(event.currentTarget)
      const email = String(form.get('email') ?? '').trim()
      const password = String(form.get('password') ?? '')
      const button = dom.query('#loginButton')
      const message = dom.query('#authMessage')

      if (button) {
        button.disabled = true
        button.textContent = 'Accesso...'
      }
      if (message) message.textContent = ''

      const { error } = await signIn(email, password)

      if (button) {
        button.disabled = false
        button.textContent = 'Accedi'
      }

      if (error) {
        if (message) message.textContent = 'Email o password non corrette.'
        return
      }

      await showDashboard()
    })
  }

  async function showDashboard({ force = false } = {}) {
    if (dashboardRenderPromise) return dashboardRenderPromise

    dashboardRenderPromise = (async () => {
      const { data: { user } } = await getUser()
      if (!user) return showLogin()

      const workspaceAlreadyMounted = Boolean(rootElement.querySelector('.workspace'))
      if (!force && renderedUserId === user.id && workspaceAlreadyMounted) return

      globalThis.performance?.mark?.('staff:dashboard:start')
      globalThis.performance?.mark?.('staff:prepare-data:start')
      await prepareAppData(user)
      globalThis.performance?.mark?.('staff:prepare-data:end')
      globalThis.performance?.measure?.('staff:prepare-data', 'staff:prepare-data:start', 'staff:prepare-data:end')

      dom.render(renderApp(user))
      globalThis.performance?.mark?.('staff:shell-rendered')

      globalThis.performance?.mark?.('staff:attach-events:start')
      await attachAppEvents(user)
      globalThis.performance?.mark?.('staff:attach-events:end')
      globalThis.performance?.measure?.('staff:attach-events', 'staff:attach-events:start', 'staff:attach-events:end')
      globalThis.performance?.mark?.('staff:app-ready')
      globalThis.performance?.measure?.('staff:dashboard-ready', 'staff:dashboard:start', 'staff:app-ready')
      renderedUserId = user.id

      dom.query('#logoutButton')?.addEventListener('click', async () => {
        await signOut()
      })
    })()

    try {
      return await dashboardRenderPromise
    } finally {
      dashboardRenderPromise = null
    }
  }

  async function start() {
    if (!isSupabaseConfigured || !supabase) {
      await showLogin()
      return
    }

    const { data: { session } } = await getSession()
    if (session) await showDashboard()
    else await showLogin()

    const subscription = onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user?.id || null
      if (!nextSession) {
        if (renderedUserId !== null || !rootElement.querySelector('.login-page')) showLogin()
        return
      }

      // Supabase può emettere SIGNED_IN/TOKEN_REFRESHED anche tornando sulla scheda.
      // Se l'utente è lo stesso e l'app è già montata, non distruggiamo il workspace corrente.
      if (renderedUserId === nextUserId && rootElement.querySelector('.workspace')) return
      showDashboard()
    })
    authSubscription = subscription?.data?.subscription ?? subscription ?? null
  }

  function dispose() {
    authSubscription?.unsubscribe?.()
    authSubscription = null
  }

  return Object.freeze({ start, dispose })
}

export async function bootstrapApp(options) {
  const kernel = createAppKernel(options)
  await kernel.start()
  return kernel
}
