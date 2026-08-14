import { describe, it, expect } from 'vitest'
import {
  coordOnLineOfFormalPts,
  coordOnSegment8Dir,
  coordOnSegment,
  CoordOnLineJudgeConfig
} from '@/utils/coordUtils/coordOnLine'
import { ControlPointDir } from '@/models/save'
import { FormalPt } from '@/models/coord'

const defaultConfig: CoordOnLineJudgeConfig = {
  clickLineThrs: 12,
  clickLineThrsSq: 144,
  clickLineThrs_sqrt2_sq: 288
}

function fp(pos: FormalPt['pos'], afterIdxEqv: number, free?: boolean): FormalPt {
  return { pos, afterIdxEqv, free }
}

describe('coordOnSegment8Dir', () => {
  it('水平线段点击应命中', () => {
    const res = coordOnSegment8Dir([50, 5], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned).toEqual([50, 0])
    expect(res.dir).toBe(ControlPointDir.vertical)
  })

  it('垂直线段点击应命中', () => {
    const res = coordOnSegment8Dir([5, 50], [0, 0], [0, 100], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned).toEqual([0, 50])
    expect(res.dir).toBe(ControlPointDir.vertical)
  })

  it('45° 斜线段点击应命中并返回 incline', () => {
    const res = coordOnSegment8Dir([46, 54], [0, 0], [100, 100], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned).toEqual([50, 50])
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('135° 斜线段点击应命中并返回 incline', () => {
    const res = coordOnSegment8Dir([54, 54], [0, 100], [100, 0], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned).toEqual([50, 50])
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('超出阈值不应命中', () => {
    const res = coordOnSegment8Dir([50, 20], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeFalsy()
  })

  it('在线段外接矩形外不应命中', () => {
    const res = coordOnSegment8Dir([150, 5], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeFalsy()
  })
})

describe('coordOnSegment（任意角度）', () => {
  it('水平线段点击应命中', () => {
    const res = coordOnSegment([50, 5], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(50)
    expect(res.aligned[1]).toBeCloseTo(0)
    expect(res.dir).toBe(ControlPointDir.vertical)
  })

  it('垂直线段点击应命中', () => {
    const res = coordOnSegment([5, 50], [0, 0], [0, 100], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(0)
    expect(res.aligned[1]).toBeCloseTo(50)
    expect(res.dir).toBe(ControlPointDir.vertical)
  })

  it('45° 斜线段点击应命中', () => {
    const res = coordOnSegment([46, 54], [0, 0], [100, 100], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(50)
    expect(res.aligned[1]).toBeCloseTo(50)
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('浅斜率任意角度直接段点击应命中', () => {
    // A(0,0) -> B(100,10)，点 (50,10) 垂距约 4.98
    const res = coordOnSegment([50, 10], [0, 0], [100, 10], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(50.5, 1)
    expect(res.aligned[1]).toBeCloseTo(5.05, 1)
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('陡斜率任意角度直接段点击应命中', () => {
    // A(0,0) -> B(10,100)，点 (10,50) 垂距约 4.97
    const res = coordOnSegment([10, 50], [0, 0], [10, 100], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(5.05, 1)
    expect(res.aligned[1]).toBeCloseTo(50.5, 1)
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('负斜率任意角度直接段点击应命中', () => {
    // A(0,100) -> B(100,10)，点 (53,59) 垂距约 4.98
    const res = coordOnSegment([53, 59], [0, 100], [100, 10], defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.aligned[0]).toBeCloseTo(49.67, 1)
    expect(res.aligned[1]).toBeCloseTo(55.30, 1)
    expect(res.dir).toBe(ControlPointDir.incline)
  })

  it('点击在线段延长线上但超出端点时不应命中', () => {
    const res = coordOnSegment([150, 0], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeFalsy()
  })

  it('超出垂距阈值不应命中', () => {
    const res = coordOnSegment([50, 20], [0, 0], [100, 0], defaultConfig)

    expect(res).toBeFalsy()
  })

  it('零长度线段不应命中', () => {
    const res = coordOnSegment([5, 5], [0, 0], [0, 0], defaultConfig)

    expect(res).toBeFalsy()
  })
})

describe('coordOnLineOfFormalPts', () => {
  it('应遍历所有区间并返回第一个命中', () => {
    const pts: FormalPt[] = [
      fp([0, 0], 0),
      fp([100, 0], 1),
      fp([100, 100], 2)
    ]

    const res = coordOnLineOfFormalPts([100, 50], pts, defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.afterPt).toBe(1)
    expect(res.aligned).toEqual([100, 50])
  })

  it('无命中时返回 false', () => {
    const pts: FormalPt[] = [
      fp([0, 0], 0),
      fp([100, 0], 1)
    ]

    const res = coordOnLineOfFormalPts([50, 50], pts, defaultConfig)

    expect(res).toBeFalsy()
  })

  it('少于 2 个 formalPt 返回 false', () => {
    expect(coordOnLineOfFormalPts([0, 0], [], defaultConfig)).toBeFalsy()
    expect(coordOnLineOfFormalPts([0, 0], [fp([0, 0], 0)], defaultConfig)).toBeFalsy()
  })

  it('应返回正确的 afterPtIdx（区间起点的 afterIdxEqv）', () => {
    const pts: FormalPt[] = [
      fp([0, 0], 0),
      fp([50, 0], 0),
      fp([100, 0], 1),
      fp([150, 0], 1),
      fp([200, 0], 2)
    ]

    const res = coordOnLineOfFormalPts([125, 5], pts, defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.afterPt).toBe(1)
  })

  it('direct seg 应使用任意角度检测', () => {
    const pts: FormalPt[] = [
      fp([0, 0], 0),
      fp([100, 10], 1, true)
    ]

    const res = coordOnLineOfFormalPts([50, 10], pts, defaultConfig)

    expect(res).toBeTruthy()
    if (!res) return
    expect(res.afterPt).toBe(0)
    expect(res.aligned[0]).toBeCloseTo(50.5, 1)
    expect(res.aligned[1]).toBeCloseTo(5.05, 1)
  })
})
