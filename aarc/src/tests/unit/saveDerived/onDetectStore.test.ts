import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useOnDetectStore } from '@/models/stores/saveDerived/saveDerivedDerived/onDetectStore'
import { useFormalizedLineStore } from '@/models/stores/saveDerived/formalizedLineStore'
import { ControlPointDir } from '@/models/save'
import { FormalPt } from '@/models/coord'

describe('onDetectStore - onLine', () => {
  beforeEach(() => {
    createTestPinia()
  })

  function fp(pos: FormalPt['pos'], afterIdxEqv: number, free?: boolean): FormalPt {
    return { pos, afterIdxEqv, free }
  }

  function setupFormalizedLine(lineId: number, pts: FormalPt[]) {
    const fls = useFormalizedLineStore()
    fls.setLinesFormalPts(lineId, pts)
  }

  it('点击水平线段应返回命中', () => {
    setupFormalizedLine(1, [fp([0, 0], 0), fp([100, 0], 1)])
    const store = useOnDetectStore()

    const res = store.onLine([50, 5])

    expect(res).toHaveLength(1)
    expect(res[0].lineId).toBe(1)
    expect(res[0].alignedPos).toEqual([50, 0])
    expect(res[0].afterPtIdx).toBe(0)
    expect(res[0].dir).toBe(ControlPointDir.vertical)
  })

  it('exceptLines 应过滤指定线路', () => {
    setupFormalizedLine(1, [fp([0, 0], 0), fp([100, 0], 1)])
    setupFormalizedLine(2, [fp([0, 0], 0), fp([100, 0], 1)])
    const store = useOnDetectStore()

    const res = store.onLine([50, 5], [1])

    expect(res).toHaveLength(1)
    expect(res[0].lineId).toBe(2)
  })

  it('多条线路同时被点击时应全部返回', () => {
    setupFormalizedLine(1, [fp([0, 0], 0), fp([100, 0], 1)])
    setupFormalizedLine(2, [fp([0, 10], 0), fp([100, 10], 1)])
    const store = useOnDetectStore()

    const res = store.onLine([50, 5])

    expect(res).toHaveLength(2)
    const lineIds = res.map(x => x.lineId).sort()
    expect(lineIds).toEqual([1, 2])
  })

  it('afterPtIdx 应等于被点击区间起点的 afterIdxEqv', () => {
    setupFormalizedLine(1, [
      fp([0, 0], 0),
      fp([50, 0], 0),
      fp([100, 0], 1),
      fp([150, 0], 1),
      fp([200, 0], 2)
    ])
    const store = useOnDetectStore()

    const res = store.onLine([125, 5])

    expect(res).toHaveLength(1)
    expect(res[0].afterPtIdx).toBe(1)
  })

  it('空 formalizedLines 时不应命中', () => {
    const store = useOnDetectStore()

    const res = store.onLine([0, 0])

    expect(res).toHaveLength(0)
  })

  describe('自由点 direct seg', () => {
    it('浅斜率任意角度直接段应正确命中并返回垂足', () => {
      setupFormalizedLine(1, [
        fp([0, 0], 0),
        fp([100, 10], 1, true)
      ])
      const store = useOnDetectStore()

      const res = store.onLine([50, 10])

      expect(res).toHaveLength(1)
      expect(res[0].lineId).toBe(1)
      expect(res[0].afterPtIdx).toBe(0)
      expect(res[0].alignedPos[0]).toBeCloseTo(50.5, 1)
      expect(res[0].alignedPos[1]).toBeCloseTo(5.05, 1)
    })

    it('负斜率任意角度直接段应返回正确垂足', () => {
      setupFormalizedLine(1, [
        fp([0, 100], 0),
        fp([100, 10], 1, true)
      ])
      const store = useOnDetectStore()

      const res = store.onLine([53, 59])

      expect(res).toHaveLength(1)
      expect(res[0].afterPtIdx).toBe(0)
      expect(res[0].alignedPos[0]).toBeCloseTo(49.67, 1)
      expect(res[0].alignedPos[1]).toBeCloseTo(55.30, 1)
    })

    it('混合 direct seg 与普通段时各自使用正确逻辑', () => {
      // A(0,0) -> B(free)(30,10) [direct] -> C(60,10) [normal horizontal]
      setupFormalizedLine(1, [
        fp([0, 0], 0),
        fp([30, 10], 1, true),
        fp([60, 10], 2)
      ])
      const store = useOnDetectStore()

      const onDirect = store.onLine([15, 8])
      expect(onDirect).toHaveLength(1)
      expect(onDirect[0].afterPtIdx).toBe(0)

      const onNormal = store.onLine([45, 15])
      expect(onNormal).toHaveLength(1)
      expect(onNormal[0].afterPtIdx).toBe(1)
      expect(onNormal[0].alignedPos).toEqual([45, 10])
    })
  })
})
