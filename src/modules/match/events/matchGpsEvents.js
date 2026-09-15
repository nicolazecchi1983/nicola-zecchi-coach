export function wireMatchGpsEvents({ root, workspace, setView } = {}) {
  const surface = root?.querySelector('[data-match-gps-workspace]')
  if (!surface || !workspace) return
  const reopen = () => setView('match-gps', 'GPS partita')

  surface.querySelector('[data-match-gps-file]')?.addEventListener('change', async (event) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    try { await workspace.importFile(file) } catch (error) { workspace.setError(error, 'match-gps-parse') }
    await reopen()
  })
  surface.querySelectorAll('[data-match-gps-player-map]').forEach((select) => select.addEventListener('change', async (event) => {
    workspace.assign(event.currentTarget.dataset.sourceRow, event.currentTarget.value)
    await reopen()
  }))
  surface.querySelector('[data-match-gps-clear]')?.addEventListener('click', async () => {
    workspace.clearPreview()
    await reopen()
  })
  surface.querySelector('[data-match-gps-save]')?.addEventListener('click', async (event) => {
    event.currentTarget.disabled = true
    try { await workspace.save() } catch (error) { workspace.setError(error, 'match-gps-save') }
    await reopen()
  })
}
