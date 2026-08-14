import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useClusterCvsWorker } from '@/models/cvs/workers/clusterCvsWorker'
import { ControlPointSta } from '@/models/save'
import { isZero } from '@/utils/sgn'
import {
  resetIdCounter,
  createPoint,
  createLine,
  createEmptySave
} from '../../helpers/saveFactory'

function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
  const saveStore = useSaveStore()
  saveStore.save = save
  return saveStore
}

function bbox(coords: [number, number][]) {
  const xs = coords.map(p => p[0])
  const ys = coords.map(p => p[1])
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

function expectBoxCovers(
  box: ReturnType<typeof bbox>,
  expected: { minX: number; maxX: number; minY: number; maxY: number }
) {
  expect(isZero(box.minX - expected.minX)).toBe(true)
  expect(isZero(box.maxX - expected.maxX)).toBe(true)
  expect(isZero(box.minY - expected.minY)).toBe(true)
  expect(isZero(box.maxY - expected.maxY)).toBe(true)
}

describe('clusterCvsWorker - getClustersRenderingData', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  it('free 点 cluster 的四角点只覆盖实际点，不覆盖远处 snap 候选', () => {
    // 两个 free 点实际坐标 (0,0) 与 (50,5)，前后线段夹角 90°
    // 平行线交点候选延伸到约 -35.36 / 85.36，四角点应紧贴实际点。
    const offset = 50 * Math.sqrt(2)
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [100, 100], sta: ControlPointSta.sta },
        { ...createPoint(2), pos: [0, 0], sta: ControlPointSta.sta, free: true },
        { ...createPoint(3), pos: [100, -100], sta: ControlPointSta.sta },
        { ...createPoint(4), pos: [50 - offset, 5 + offset], sta: ControlPointSta.sta },
        { ...createPoint(5), pos: [50, 5], sta: ControlPointSta.sta, free: true },
        { ...createPoint(6), pos: [50 - offset, 5 - offset], sta: ControlPointSta.sta }
      ],
      lines: [
        createLine([1, 2, 3]),
        createLine([4, 5, 6])
      ]
    })
    setupSaveStore(save)

    const worker = useClusterCvsWorker()
    const data = worker.getClustersRenderingData()

    expect(data).toHaveLength(1)
    const poly = data[0].coords
    const polyBox = bbox(poly)

    // 应紧贴覆盖两个实际点 (0,0) 与 (50,5)
    expectBoxCovers(polyBox, { minX: 0, maxX: 50, minY: 0, maxY: 5 })

    // 不应覆盖远处的平行线交点候选（约 -35.36 / 85.36）
    expect(polyBox.minX).toBeGreaterThan(-30)
    expect(polyBox.maxX).toBeLessThan(80)

    // 由于只覆盖实际点，四角点不应过分膨胀
    expect(polyBox.maxX - polyBox.minX).toBeLessThan(80)
    expect(polyBox.maxY - polyBox.minY).toBeLessThan(10)
  })

  it('120° 拐角 free 点 cluster 使用角平分线方向得到贴身四角点', () => {
    // 两个 free 点实际坐标 (0,0) 与 (50,5)
    // 前后线段夹角 120°，方向分别为 60°/120° 与 -60°/-120°（归一化后 60°/120°）
    // 若不加入角平分线 0°，OBB 会选用 60°/120°，得到高约 45 的胖矩形；
    // 加入角平分线后应选中 0°，得到紧贴实际点的低矩形。
    const sqrt3 = Math.sqrt(3)
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [50, -50 * sqrt3], sta: ControlPointSta.sta },
        { ...createPoint(2), pos: [0, 0], sta: ControlPointSta.sta, free: true },
        { ...createPoint(3), pos: [50, 50 * sqrt3], sta: ControlPointSta.sta },
        { ...createPoint(4), pos: [0, 50 + 50 * sqrt3], sta: ControlPointSta.sta },
        { ...createPoint(5), pos: [50, 5], sta: ControlPointSta.sta, free: true },
        { ...createPoint(6), pos: [0, 5 - 50 * sqrt3], sta: ControlPointSta.sta }
      ],
      lines: [
        createLine([1, 2, 3]),
        createLine([4, 5, 6])
      ]
    })
    setupSaveStore(save)

    const worker = useClusterCvsWorker()
    const data = worker.getClustersRenderingData()

    expect(data).toHaveLength(1)
    const poly = data[0].coords
    const polyBox = bbox(poly)

    // 应紧贴覆盖两个实际点 (0,0) 与 (50,5)
    expectBoxCovers(polyBox, { minX: 0, maxX: 50, minY: 0, maxY: 5 })

    // 使用角平分线后，高度应很小；若用 60°/120° 方向，高度会约 45
    expect(polyBox.maxY - polyBox.minY).toBeLessThan(10)
  })

  it('非 free 点 cluster 行为不受新逻辑影响', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [10, 0] }
      ]
    })
    setupSaveStore(save)

    const worker = useClusterCvsWorker()
    const data = worker.getClustersRenderingData()

    expect(data).toHaveLength(1)
    const polyBox = bbox(data[0].coords)
    expect(isZero(polyBox.minX - 0)).toBe(true)
    expect(isZero(polyBox.maxX - 10)).toBe(true)
  })
})
