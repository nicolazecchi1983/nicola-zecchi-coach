const EMPTY_BINDERS = Object.freeze({})

const HEAVY_FEATURE_LOADERS = Object.freeze({
  'training-sheet': () => Promise.all([
    import('../modules/training/events/trainingEditorEvents.js'),
    import('../modules/training/events/trainingDraftAndVoiceEvents.js'),
  ]),
  'our-team': () => Promise.all([
    import('../modules/match/events/legacyMatchEditorEvents.js'),
  ]),
  opponent: () => Promise.all([
    import('../modules/match/events/legacyMatchEditorEvents.js'),
  ]),
})

export async function loadHeavyFeatureEventBinders(key) {
  const load = HEAVY_FEATURE_LOADERS[key]
  if (!load) return EMPTY_BINDERS

  const modules = await load()
  return Object.assign({}, ...modules)
}
