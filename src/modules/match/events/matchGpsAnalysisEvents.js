export function wireMatchGpsAnalysisEvents({
  root,
  workspace,
  setView,
} = {}) {
  const surface = root?.querySelector('[data-match-gps-analysis-workspace]')
  if (!surface || !workspace) return

  const reopen = () => setView('match-gps-analysis', 'Analisi GPS')

  surface.querySelectorAll('[data-match-gps-analysis-scope]')
    .forEach((button) => button.addEventListener('click', async (event) => {
      workspace.setScope(event.currentTarget.dataset.matchGpsAnalysisScope)
      await reopen()
    }))

  surface.querySelector('[data-match-gps-analysis-metric]')
    ?.addEventListener('change', async (event) => {
      workspace.setMetric(event.currentTarget.value)
      await reopen()
    })

  surface.querySelector('[data-match-gps-analysis-player]')
    ?.addEventListener('change', async (event) => {
      workspace.setPlayer(event.currentTarget.value)
      await reopen()
    })

  surface.querySelectorAll('[data-match-gps-analysis-normalization]')
    .forEach((button) => button.addEventListener('click', async (event) => {
      workspace.setNormalization(event.currentTarget.dataset.matchGpsAnalysisNormalization)
      await reopen()
    }))

  surface.querySelector('[data-match-gps-analysis-refresh]')
    ?.addEventListener('click', async (event) => {
      event.currentTarget.disabled = true
      await workspace.refresh()
      await reopen()
    })
}