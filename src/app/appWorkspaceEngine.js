const DEFAULT_EDITOR_FOCUS_VIEWS = new Set([])

/**
 * Coordinates application workspaces without knowing any feature module.
 * The engine owns access fallback, lifecycle activation and shell updates;
 * feature rendering remains delegated to the module registry.
 */
export function createAppWorkspaceEngine({
  root,
  registry,
  menu,
  canAccessSection,
  getFirstAccessibleSection,
  onAccessDenied = () => {},
  onNavigationChange = () => {},
  beforeActivate = () => {},
  afterActivate = async () => {},
  editorFocusViews = DEFAULT_EDITOR_FOCUS_VIEWS,
  storage = globalThis.localStorage,
  documentRef = globalThis.document,
  windowRef = globalThis.window,
}) {
  if (!root) throw new TypeError('Workspace engine requires a root element')
  if (!registry || typeof registry.activate !== 'function') {
    throw new TypeError('Workspace engine requires a module registry')
  }

  function resolveTarget(key, label) {
    if (canAccessSection(key)) return { key, label }

    onAccessDenied(key)
    const fallbackKey = getFirstAccessibleSection(menu)
    const fallbackLabel = menu.find(([sectionKey]) => sectionKey === fallbackKey)?.[1] || 'Dashboard'
    onNavigationChange(fallbackKey)
    storage?.setItem('nz-active-section', fallbackKey)
    return { key: fallbackKey, label: fallbackLabel }
  }

  function updateShell(activeKey) {
    const workspace = root.closest('.workspace')
    workspace?.classList.toggle('workspace--editor-focus', editorFocusViews.has(activeKey))
    workspace?.setAttribute('data-active-view', activeKey)
  }

  function resetScroll() {
    if (documentRef?.documentElement) documentRef.documentElement.scrollTop = 0
    if (documentRef?.body) documentRef.body.scrollTop = 0
    windowRef?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' })
    root.scrollTop = 0
    root.closest('.workspace')?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' })
  }

  return Object.freeze({
    async open(requestedKey, requestedLabel) {
      const { key, label } = resolveTarget(requestedKey, requestedLabel)
      await beforeActivate({ key, label, root })
      root.innerHTML = await registry.activate(key, label, { key, label, root })
      updateShell(key)
      await afterActivate({ key, label, root })
      storage?.setItem('nz-active-section', key)
      resetScroll()
      return key
    },
    getActiveKey() {
      return registry.getActiveKey?.() ?? null
    },
  })
}
