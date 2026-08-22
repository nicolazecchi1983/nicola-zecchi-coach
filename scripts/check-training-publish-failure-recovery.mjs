import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTrainingPublishRecoveryStore, reconcileInterruptedTrainingPublish } from '../src/modules/training/trainingPublishRecovery.js'

const root = resolve(import.meta.dirname, '..')
const service = readFileSync(resolve(root, 'src/modules/training/trainingSheetService.js'), 'utf8')
const runtime = readFileSync(resolve(root, 'src/modules/training/events/trainingEditorEvents.js'), 'utf8')
const controller = readFileSync(resolve(root, 'src/app/appController.js'), 'utf8')

const checks = []
const ok = (name, condition) => {
  if (!condition) throw new Error(`FAIL - ${name}`)
  checks.push(name)
  console.log(`OK - ${name}`)
}

ok('recovery journal is created before PDF upload', service.indexOf('publishRecovery?.begin?.') < service.indexOf('await uploadTrainingSheetPdf'))
ok('upload failure clears the planned recovery journal', /await uploadTrainingSheetPdf[\s\S]*?catch \(error\)[\s\S]*?publishRecovery\?\.clear/.test(service))
ok('calendar commit failure checks whether uploaded PDF cleanup really succeeded', service.includes('cleanupConfirmed = await removeTrainingSheetPdf(filePath)'))
ok('failed cleanup leaves recovery journal pending', service.includes('if (cleanupConfirmed)') && service.includes('STAFF riproverà automaticamente a pulire'))
ok('recovery journal tracks previous canonical PDF for crash-safe cleanup', service.includes("previousPath: existingEvent?.trainingSheetPath || ''") && service.includes('previousCleanupPending'))
ok('canonical commit clears recovery only after previous-PDF cleanup is settled', service.indexOf('if (!previousCleanupPending)') < service.lastIndexOf('publishRecovery?.clear?.()'))
ok('runtime owns a persistent recovery store', runtime.includes('createTrainingPublishRecoveryStore(localStorage)'))
ok('composition root injects a throwing authoritative Calendar refresh into Training runtime', /wireTrainingEditorEvents\(\{[\s\S]*?loadCalendarEvents: requireFreshCalendarEvents,/.test(controller))
ok('runtime requires a fresh Calendar read before reconciling interrupted publish', /let calendarIsFresh = false[\s\S]*?await loadCalendarEvents\(\)[\s\S]*?calendarIsFresh = true[\s\S]*?if \(calendarIsFresh\) \{[\s\S]*?reconcileInterruptedTrainingPublish/.test(runtime))
ok('runtime leaves recovery pending when Calendar freshness cannot be established', runtime.includes('Recovery pubblicazione in attesa') && runtime.includes('calendarIsFresh'))
ok('runtime never removes a PDF that is referenced by Calendar', runtime.includes('reconcileInterruptedTrainingPublish') && runtime.includes('calendarEvents: appState.calendarEvents'))
ok('cleanup dependency is injected through composition root', controller.includes('cleanupPublishedTrainingSheetPdf') && runtime.includes('cleanupPublishedTrainingSheetPdf'))
ok('Training event runtime does not import repository directly', !runtime.includes('trainingSheetRepository.js'))

const memoryStorage = () => {
  const map = new Map()
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  }
}

{
  const storage = memoryStorage()
  const recoveryStore = createTrainingPublishRecoveryStore(storage)
  recoveryStore.begin({ filePath: 'team/season/date/new.pdf', eventId: 'evt-1' })
  let removeCalls = 0
  const result = await reconcileInterruptedTrainingPublish({
    recoveryStore,
    calendarEvents: [{ id: 'evt-1', trainingSheetPath: 'team/season/date/new.pdf' }],
    removePublishedPdf: async () => { removeCalls += 1; return true },
  })
  ok('committed interrupted publish is preserved instead of deleted', result.status === 'committed' && removeCalls === 0 && recoveryStore.read() === null)
}

{
  const storage = memoryStorage()
  const recoveryStore = createTrainingPublishRecoveryStore(storage)
  recoveryStore.begin({ filePath: 'team/season/date/orphan.pdf' })
  let removeCalls = 0
  const result = await reconcileInterruptedTrainingPublish({
    recoveryStore,
    calendarEvents: [],
    removePublishedPdf: async () => { removeCalls += 1; return true },
  })
  ok('uncommitted uploaded PDF is removed after reload', result.status === 'cleaned' && removeCalls === 1 && recoveryStore.read() === null)
}

{
  const storage = memoryStorage()
  const recoveryStore = createTrainingPublishRecoveryStore(storage)
  recoveryStore.begin({ filePath: 'team/season/date/pending.pdf' })
  const result = await reconcileInterruptedTrainingPublish({
    recoveryStore,
    calendarEvents: [],
    removePublishedPdf: async () => false,
  })
  ok('failed orphan cleanup remains journaled for a later retry', result.status === 'cleanup-pending' && recoveryStore.read()?.filePath.endsWith('pending.pdf'))
}


{
  const storage = memoryStorage()
  const recoveryStore = createTrainingPublishRecoveryStore(storage)
  recoveryStore.begin({ filePath: 'team/season/date/new-v2.pdf', previousPath: 'team/season/date/old-v1.pdf', eventId: 'evt-2' })
  const removed = []
  const result = await reconcileInterruptedTrainingPublish({
    recoveryStore,
    calendarEvents: [{ id: 'evt-2', trainingSheetPath: 'team/season/date/new-v2.pdf' }],
    removePublishedPdf: async (path) => { removed.push(path); return true },
  })
  ok('committed update cleans unreferenced previous PDF after reload', result.status === 'committed' && removed.length === 1 && removed[0].endsWith('old-v1.pdf') && recoveryStore.read() === null)
}

{
  const storage = memoryStorage()
  const recoveryStore = createTrainingPublishRecoveryStore(storage)
  recoveryStore.begin({ filePath: 'team/season/date/new-v3.pdf', previousPath: 'team/season/date/old-shared.pdf', eventId: 'evt-3' })
  let removeCalls = 0
  const result = await reconcileInterruptedTrainingPublish({
    recoveryStore,
    calendarEvents: [
      { id: 'evt-3', trainingSheetPath: 'team/season/date/new-v3.pdf' },
      { id: 'evt-other', trainingSheetPath: 'team/season/date/old-shared.pdf' },
    ],
    removePublishedPdf: async () => { removeCalls += 1; return true },
  })
  ok('previous PDF is never removed while another Calendar event still references it', result.status === 'committed' && removeCalls === 0 && recoveryStore.read() === null)
}

console.log(`TRAINING PUBLISH FAILURE & RECOVERY: ${checks.length}/${checks.length} OK`)
