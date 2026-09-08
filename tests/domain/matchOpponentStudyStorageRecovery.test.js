import { describe, expect, it } from 'vitest'
import {
  collectMatchOpponentStudyAssetPaths,
  createMatchOpponentStudyRecoveryStore,
  reconcileInterruptedMatchOpponentStudy,
} from '../../src/modules/match/matchOpponentStudyRecovery.js'

const memoryStorage = () => {
  const map = new Map()
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  }
}

describe('Match opponent study storage recovery', () => {
  it('collects every canonical Match study asset path', () => {
    const paths = collectMatchOpponentStudyAssetPaths({
      primaryReport: { path: 'team/match/report.pdf' },
      assets: [{ path: 'team/match/video.mp4' }, { path: 'team/match/doc.pdf' }],
      opponentLineup: { path: 'team/match/lineup.pdf' },
    })

    expect(paths).toEqual([
      'team/match/report.pdf',
      'team/match/video.mp4',
      'team/match/doc.pdf',
      'team/match/lineup.pdf',
    ])
  })

  it('preserves the committed replacement and removes only the previous orphan', async () => {
    const store = createMatchOpponentStudyRecoveryStore(memoryStorage())
    store.begin({ matchId: 'm1', paths: ['new.pdf'] })
    store.track('m1', 'old.pdf')
    const removed = []

    const result = await reconcileInterruptedMatchOpponentStudy({
      recoveryStore: store,
      matchId: 'm1',
      study: { opponentLineup: { path: 'new.pdf' } },
      removeAsset: async (path) => { removed.push(path); return true },
    })

    expect(result.status).toBe('reconciled')
    expect(removed).toEqual(['old.pdf'])
    expect(store.read('m1')).toBeNull()
  })

  it('removes an uploaded asset that never reached the canonical event', async () => {
    const store = createMatchOpponentStudyRecoveryStore(memoryStorage())
    store.begin({ matchId: 'm2', paths: ['new-uncommitted.pdf'] })
    const removed = []

    const result = await reconcileInterruptedMatchOpponentStudy({
      recoveryStore: store,
      matchId: 'm2',
      study: {},
      removeAsset: async (path) => { removed.push(path); return true },
    })

    expect(result.status).toBe('reconciled')
    expect(removed).toEqual(['new-uncommitted.pdf'])
    expect(store.read('m2')).toBeNull()
  })

  it('never deletes an asset still referenced by fresh canonical Match metadata', async () => {
    const store = createMatchOpponentStudyRecoveryStore(memoryStorage())
    store.begin({ matchId: 'm3', paths: ['still-canonical.pdf'] })
    let removeCalls = 0

    const result = await reconcileInterruptedMatchOpponentStudy({
      recoveryStore: store,
      matchId: 'm3',
      study: { primaryReport: { path: 'still-canonical.pdf' } },
      removeAsset: async () => { removeCalls += 1; return true },
    })

    expect(result.status).toBe('reconciled')
    expect(removeCalls).toBe(0)
    expect(store.read('m3')).toBeNull()
  })

  it('keeps failed orphan cleanup journaled for a later retry', async () => {
    const store = createMatchOpponentStudyRecoveryStore(memoryStorage())
    store.begin({ matchId: 'm4', paths: ['orphan-pending.pdf'] })

    const result = await reconcileInterruptedMatchOpponentStudy({
      recoveryStore: store,
      matchId: 'm4',
      study: {},
      removeAsset: async () => { throw new Error('temporary delete failure') },
    })

    expect(result.status).toBe('cleanup-pending')
    expect(store.read('m4')?.paths).toEqual(['orphan-pending.pdf'])
  })
  it('begin merges existing pending paths instead of overwriting them', () => {
    const store = createMatchOpponentStudyRecoveryStore(memoryStorage())
    store.begin({ matchId: 'merge', paths: ['first.pdf'] })
    store.begin({ matchId: 'merge', paths: ['second.pdf'] })
    expect(store.read('merge')?.paths).toEqual(['first.pdf', 'second.pdf'])
  })

})
