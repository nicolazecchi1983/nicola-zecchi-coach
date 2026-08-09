import { createAppModule } from './appModuleContract.js'

export function createAppViewRegistry(modules, fallback) {
  const registry = new Map()
  let activeModule = null

  for (const definition of modules) {
    const module = createAppModule(definition)
    if (registry.has(module.key)) {
      throw new Error(`Duplicate app module key: ${module.key}`)
    }
    registry.set(module.key, module)
  }

  return {
    has(key) {
      return registry.has(key)
    },
    async activate(key, label, context = {}) {
      const nextModule = registry.get(key)
      if (!nextModule) {
        await activeModule?.dispose(context)
        activeModule = null
        return fallback(label)
      }

      if (activeModule && activeModule !== nextModule) {
        await activeModule.dispose(context)
      }

      await nextModule.prepare(context)
      activeModule = nextModule
      return nextModule.render(context)
    },
    keys() {
      return [...registry.keys()]
    },
    getActiveKey() {
      return activeModule?.key ?? null
    },
  }
}
