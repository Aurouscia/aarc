import { describe, it, expect } from 'vitest'
import { ControlPoint, ControlPointDir, ControlPointSta } from '@/models/save'
import {
  calcStaNameSnapCandidates,
  snapNameToCandidates,
  getNameSnapStatus,
  snapGrid,
  snapNeighborExtends,
  snapInterPt
} from '@/utils/snapUtils/snapCore'

function makePt(
  id: number,
  pos: [number, number],
  dir: ControlPointDir = ControlPointDir.vertical,
  nameP?: [number, number]
): ControlPoint {
  return {
    id,
    pos,
    dir,
    sta: ControlPointSta.sta,
    nameP
  }
}

describe('calcStaNameSnapCandidates', () => {
  it('inner 模式生成 8 个候选点（4 正交 + 4 内侧对角）', () => {
    const cands = calcStaNameSnapCandidates(18, 1, 'inner')
    expect(cands).toHaveLength(8)
  })

  it('both 模式生成 12 个候选点', () => {
    const cands = calcStaNameSnapCandidates(18, 1, 'both')
    expect(cands).toHaveLength(12)
  })

  it('正交候选点距离等于 baseDist * distRatio', () => {
    const cands = calcStaNameSnapCandidates(10, 2, 'both')
    expect(cands[0]).toEqual([20, 0])
    expect(cands[1]).toEqual([-20, 0])
    expect(cands[2]).toEqual([0, 20])
    expect(cands[3]).toEqual([0, -20])
  })

  it('内侧对角候选点距离等于 baseDist * distRatio', () => {
    const cands = calcStaNameSnapCandidates(10, 1, 'inner')
    const inner = cands[4]
    const dist = Math.sqrt(inner[0] ** 2 + inner[1] ** 2)
    expect(dist).toBeCloseTo(10)
  })

  it('外侧对角候选点距离等于 baseDist * distRatio * √2', () => {
    const cands = calcStaNameSnapCandidates(10, 1, 'outer')
    const outer = cands[4]
    const dist = Math.sqrt(outer[0] ** 2 + outer[1] ** 2)
    expect(dist).toBeCloseTo(10 * Math.SQRT2)
  })
})

describe('snapNameToCandidates', () => {
  it('nameP 精确命中候选点时返回 accu 吸附', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [10, 0])
    const cands: [number, number][] = [[10, 0], [0, 10]]
    const res = snapNameToCandidates(pt, cands, 100, 5)
    expect(res).toEqual({ to: [10, 0], type: 'accu' })
  })

  it('nameP 接近 x=0 时仅将 x 归零并返回 vague 吸附', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [2, 7])
    const cands: [number, number][] = [[10, 0], [0, 10]]
    const res = snapNameToCandidates(pt, cands, 1, 6)
    expect(res).toEqual({ to: [0, 7], type: 'vague' })
  })

  it('nameP 同时接近 x=0 和 y=0 时返回 [0,0]', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [1, 1])
    const cands: [number, number][] = [[10, 0]]
    const res = snapNameToCandidates(pt, cands, 0.1, 2)
    expect(res).toEqual({ to: [0, 0], type: 'vague' })
  })

  it('未命中任何候选且不接近坐标轴时返回 undefined', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [5, 5])
    const cands: [number, number][] = [[100, 0]]
    const res = snapNameToCandidates(pt, cands, 1, 1)
    expect(res).toBeUndefined()
  })

  it('nameP 不存在时返回 undefined', () => {
    const pt = makePt(1, [0, 0])
    const res = snapNameToCandidates(pt, [], 100, 5)
    expect(res).toBeUndefined()
  })
})

describe('getNameSnapStatus', () => {
  it('nameP 精确命中候选点时返回 accu', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [10, 0])
    const cands: [number, number][] = [[10, 0]]
    expect(getNameSnapStatus(pt, cands, 1e-6)).toEqual({ type: 'accu' })
  })

  it('nameP 在坐标轴上时返回 vague', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [0, 5])
    expect(getNameSnapStatus(pt, [], 1e-6)).toEqual({ type: 'vague' })
  })

  it('nameP 不在候选点也不在坐标轴上时返回 undefined', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical, [3, 4])
    expect(getNameSnapStatus(pt, [], 1e-6)).toBeUndefined()
  })
})

describe('snapGrid', () => {
  it('普通坐标吸附到最近的网格线', () => {
    const res = snapGrid([12, 18], 10, 100, 100)
    expect(res?.pos).toEqual([10, 20])
  })

  it('超出阈值时不吸附', () => {
    const res = snapGrid([14, 14], 100, 1000, 1000, undefined, 6)
    // 最近的网格线在 100 处，差值为 86，超过阈值 6
    expect(res?.pos).toEqual([14, 14])
    expect(res?.snapLines).toHaveLength(0)
  })

  it('ensureSnap=true 时强制吸附到最近网格线', () => {
    const res = snapGrid([14, 14], 100, 1000, 1000, undefined, undefined, true)
    expect(res?.pos).toEqual([100, 100])
  })

  it('freeAxis=竖向时只吸附 y 坐标', () => {
    const res = snapGrid([12, 18], 10, 100, 100, [0, 1])
    expect(res?.pos).toEqual([12, 20])
    expect(res?.snapLines).toHaveLength(2)
  })

  it('freeAxis=横向时只吸附 x 坐标', () => {
    const res = snapGrid([12, 18], 10, 100, 100, [1, 0])
    expect(res?.pos).toEqual([10, 18])
    expect(res?.snapLines).toHaveLength(2)
  })

  it('freeAxis=fall 对角线时沿对角线吸附', () => {
    // 点 (12,12) 到网格线 x=10 差 2，y=10 差 2，正好同时满足 fall 对角线
    const res = snapGrid([12, 12], 10, 100, 100, [1, 1])
    expect(res?.pos).toEqual([10, 10])
  })

  it('命中 x 和 y 网格线时生成 4 条辅助线', () => {
    const res = snapGrid([12, 18], 10, 100, 100)
    expect(res?.snapLines).toHaveLength(4)
  })

  it('网格间距为 0 或 undefined 时返回 undefined', () => {
    expect(snapGrid([12, 12], 0, 100, 100)).toBeUndefined()
  })
})

describe('snapNeighborExtends', () => {
  it('水平方向对齐：当前点与邻点 y 坐标对齐', () => {
    // 阈值设为 4，使对角候选（dist≈4.95）不进入，仅保留正交候选
    const pt = makePt(1, [0, 0])
    const neighbor = makePt(2, [10, 3])
    const res = snapNeighborExtends(pt, [neighbor], 4, false)
    expect(res.snapRes).toEqual([0, 3])
  })

  it('垂直方向对齐：当前点与邻点 x 坐标对齐', () => {
    const pt = makePt(1, [0, 0])
    const neighbor = makePt(2, [3, 10])
    const res = snapNeighborExtends(pt, [neighbor], 4, false)
    expect(res.snapRes).toEqual([3, 0])
  })

  it('距离超出阈值时不吸附', () => {
    const pt = makePt(1, [0, 0])
    const neighbor = makePt(2, [100, 50])
    const res = snapNeighborExtends(pt, [neighbor], 5, false)
    expect(res.snapRes).toBeUndefined()
    expect(res.snapLines).toHaveLength(0)
  })

  it('onlySameDir=true 时过滤不同方向的邻点', () => {
    const pt = makePt(1, [0, 0], ControlPointDir.vertical)
    const neighbor = makePt(2, [10, 3], ControlPointDir.incline)
    const res = snapNeighborExtends(pt, [neighbor], 10, true)
    expect(res.snapRes).toBeUndefined()
  })

  it('两个候选方向相交时返回交点', () => {
    const pt = makePt(1, [0, 0])
    const hNeighbor = makePt(2, [10, 3]) // 水平延长线 y=3
    const vNeighbor = makePt(3, [3, 10]) // 垂直延长线 x=3
    const res = snapNeighborExtends(pt, [hNeighbor, vNeighbor], 10, false)
    expect(res.snapRes).toEqual([3, 3])
  })

  it('斜向对齐产生预期吸附位置', () => {
    // 阈值 2 使正交候选（dist=4）不进入，仅保留斜向候选
    const pt = makePt(1, [0, 0], ControlPointDir.incline)
    const neighbor = makePt(2, [6, 4], ControlPointDir.incline)
    const res = snapNeighborExtends(pt, [neighbor], 2, false)
    // diffdiff = y - x = -2, snapTo = [0-(-2)/2, 0+(-2)/2] = [1, -1]
    expect(res.snapRes).toEqual([1, -1])
  })
})

describe('snapInterPt', () => {
  it('noBias 模式下精确匹配附近点位置', () => {
    const pt = makePt(1, [0, 0])
    const opt = makePt(2, [10, 0])
    const res = snapInterPt(
      pt,
      [opt],
      { snapDistBase: 10, snapThrs: 15 },
      undefined,
      true
    )
    expect(res.matched).toEqual([10, 0])
  })

  it('斜向方向存在可吸附点时返回匹配坐标', () => {
    // 零偏置距离约 14.14 超过阈值，但对角偏置可命中
    const pt = makePt(1, [0, 0], ControlPointDir.incline)
    const opt = makePt(2, [10, 10], ControlPointDir.incline)
    const res = snapInterPt(
      pt,
      [opt],
      { snapDistBase: 10, snapThrs: 10 },
      undefined,
      false
    )
    // applyBias([10,10], [-1,-1], 10) = [2.93, 2.93], dist ~ 4.14 < 10
    expect(res.matched).toBeDefined()
    expect(res.matched![0]).toBeCloseTo(2.93, 1)
    expect(res.matched![1]).toBeCloseTo(2.93, 1)
  })

  it('无命中时返回 undefined 但记录候选目标', () => {
    const pt = makePt(1, [0, 0])
    const opt = makePt(2, [100, 0])
    const res = snapInterPt(
      pt,
      [opt],
      { snapDistBase: 10, snapThrs: 5 },
      undefined,
      true
    )
    expect(res.matched).toBeUndefined()
    expect(res.targets.snapToPts).toHaveLength(1)
    expect(res.targets.snapPoss.length).toBeGreaterThan(0)
  })

  it('尺寸倍率影响吸附距离', () => {
    const pt = makePt(1, [0, 0])
    const opt = makePt(2, [30, 0])
    const getSizes = (id: number) => id === 1 ? [2] : [2]
    // sizesAdded = [4], snapDist = 4/2 * 10 = 20
    // noBias 下只有 opt.pos=[30,0]，dist=30 > 25，不应命中
    const resNoHit = snapInterPt(
      pt,
      [opt],
      { snapDistBase: 10, snapThrs: 25 },
      getSizes,
      true
    )
    expect(resNoHit.matched).toBeUndefined()

    // sizesAdded = [4], snapDist = 4/2 * 20 = 40
    // opt.pos=[30,0] dist=30 < 35，应命中
    const resHit = snapInterPt(
      pt,
      [opt],
      { snapDistBase: 20, snapThrs: 35 },
      getSizes,
      true
    )
    expect(resHit.matched).toEqual([30, 0])
  })

  it('空附近点列表时返回空目标', () => {
    const pt = makePt(1, [0, 0])
    const res = snapInterPt(pt, [], { snapDistBase: 10, snapThrs: 10 })
    expect(res.matched).toBeUndefined()
    expect(res.targets.snapPoss).toHaveLength(0)
    expect(res.targets.snapToPts).toHaveLength(0)
  })
})
