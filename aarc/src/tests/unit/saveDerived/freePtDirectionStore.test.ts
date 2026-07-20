import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useFreePtDirectionStore } from '@/models/stores/saveDerived/freePtDirectionStore'
import { ControlPointDir, ControlPointSta } from '@/models/save'
import {
  resetIdCounter,
  createEmptySave
} from '../../helpers/saveFactory'

describe('freePtDirectionStore', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  it('free 点的相邻段和方向信息应正确', () => {
    const saveStore = useSaveStore()
    const freePt = {
      id: 2,
      pos: [1, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta,
      free: true
    }
    const prevPt = {
      id: 1,
      pos: [0, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta
    }
    const nextPt = {
      id: 3,
      pos: [3, 1] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta
    }
    saveStore.save = createEmptySave({
      points: [prevPt, freePt, nextPt],
      lines: [{
        id: 1,
        pts: [1, 2, 3],
        name: '测试线',
        nameSub: '',
        color: '#ff0000',
        type: 0
      }]
    })

    const store = useFreePtDirectionStore()
    const seg = store.getAdjacentSeg(2)
    expect(seg?.prev).toStrictEqual(prevPt)
    expect(seg?.next).toStrictEqual(nextPt)

    const info = store.getPtDirectionInfo(2)
    expect(info).toBeDefined()
    expect(info!.prev).toBeDefined()
    expect(info!.next).toBeDefined()
    expect(info!.all).toHaveLength(2)

    const dirs = store.getPtDirections(2)
    expect(dirs).toHaveLength(2)
  })

  it('非 free 点不应被缓存', () => {
    const saveStore = useSaveStore()
    const nonFreePt = {
      id: 2,
      pos: [1, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta
    }
    const prevPt = {
      id: 1,
      pos: [0, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta
    }
    saveStore.save = createEmptySave({
      points: [prevPt, nonFreePt],
      lines: [{
        id: 1,
        pts: [1, 2],
        name: '测试线',
        nameSub: '',
        color: '#ff0000',
        type: 0
      }]
    })

    const store = useFreePtDirectionStore()
    expect(store.getAdjacentSeg(2)).toBeUndefined()
    expect(store.getPtDirectionInfo(2)).toBeUndefined()
    expect(store.getPtDirections(2)).toHaveLength(0)
  })

  it('save 变化后缓存应重新计算', () => {
    const saveStore = useSaveStore()
    const freePt = {
      id: 2,
      pos: [1, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta,
      free: true
    }
    const prevPt = {
      id: 1,
      pos: [0, 0] as [number, number],
      dir: ControlPointDir.vertical,
      sta: ControlPointSta.sta
    }
    saveStore.save = createEmptySave({
      points: [prevPt, freePt],
      lines: [{
        id: 1,
        pts: [1, 2],
        name: '测试线',
        nameSub: '',
        color: '#ff0000',
        type: 0
      }]
    })

    const store = useFreePtDirectionStore()
    expect(store.getPtDirections(2)).toHaveLength(1)

    // 移动 prevPt 到与 freePt 重合，方向应消失
    prevPt.pos = [1, 0]
    saveStore.save = { ...saveStore.save! }
    expect(store.getPtDirections(2)).toHaveLength(0)
  })
})
