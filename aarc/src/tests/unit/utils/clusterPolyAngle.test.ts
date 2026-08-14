import { describe, it, expect } from 'vitest'
import {
  clusterToPolyAngle,
  clusterToPolyMinimumArea,
  clusterToPolyVert,
  clusterToPolyInc
} from '@/utils/clusterUtils/clusterPolyAngle'
import { sqrt2half } from '@/utils/consts'
import { isZero } from '@/utils/sgn'

type Pt = { pos: [number, number] }

function expectPolySetEqual(
  actual: [number, number][],
  expected: [number, number][]
) {
  expect(actual).toHaveLength(expected.length)
  const toKey = (p: [number, number]) => `${p[0].toFixed(10)},${p[1].toFixed(10)}`
  const setA = new Set(actual.map(toKey))
  const setE = new Set(expected.map(toKey))
  expect(setA).toEqual(setE)
}

function expectPolyMatch(
  actual: [number, number][],
  expected: [number, number][]
) {
  expect(actual).toHaveLength(expected.length)
  for (let i = 0; i < actual.length; i++) {
    expect(isZero(actual[i][0] - expected[i][0])).toBe(true)
    expect(isZero(actual[i][1] - expected[i][1])).toBe(true)
  }
}

function bbox(cluster: Pt[]) {
  const xs = cluster.map(p => p.pos[0])
  const ys = cluster.map(p => p.pos[1])
  return {
    l: Math.min(...xs),
    r: Math.max(...xs),
    t: Math.min(...ys),
    b: Math.max(...ys)
  }
}

describe('clusterToPolyAngle', () => {
  it('0° 方向应返回轴对齐包围盒', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] },
      { pos: [10, 5] },
      { pos: [0, 5] }
    ]
    const { l, r, t, b } = bbox(cluster)

    const { poly, area } = clusterToPolyAngle(cluster, [1, 0])

    expectPolyMatch(poly, [
      [l, t],
      [r, t],
      [r, b],
      [l, b]
    ])
    expect(area).toBeCloseTo((r - l) * (b - t))
  })

  it('45° 方向应返回正确的旋转包围盒', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] },
      { pos: [10, 10] }
    ]
    const u: [number, number] = [sqrt2half, sqrt2half]
    const v: [number, number] = [sqrt2half, -sqrt2half]

    const { poly, area } = clusterToPolyAngle(cluster, u)

    const a = cluster.map(p => p.pos[0] * u[0] + p.pos[1] * u[1])
    const b = cluster.map(p => p.pos[0] * v[0] + p.pos[1] * v[1])
    const aMin = Math.min(...a)
    const aMax = Math.max(...a)
    const bMin = Math.min(...b)
    const bMax = Math.max(...b)
    const expected = [
      [u[0] * aMin + v[0] * bMax, u[1] * aMin + v[1] * bMax],
      [u[0] * aMax + v[0] * bMax, u[1] * aMax + v[1] * bMax],
      [u[0] * aMax + v[0] * bMin, u[1] * aMax + v[1] * bMin],
      [u[0] * aMin + v[0] * bMin, u[1] * aMin + v[1] * bMin]
    ]

    expectPolyMatch(poly, expected as [number, number][])
    expect(area).toBeCloseTo((aMax - aMin) * (bMax - bMin))
  })

  it('30° 方向的四角点与面积计算应正确', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] }
    ]
    const u: [number, number] = [Math.sqrt(3) / 2, 0.5]
    const v: [number, number] = [0.5, -Math.sqrt(3) / 2]

    const { poly, area } = clusterToPolyAngle(cluster, u)

    const a = cluster.map(p => p.pos[0] * u[0] + p.pos[1] * u[1])
    const b = cluster.map(p => p.pos[0] * v[0] + p.pos[1] * v[1])
    const aMin = Math.min(...a)
    const aMax = Math.max(...a)
    const bMin = Math.min(...b)
    const bMax = Math.max(...b)
    const expectedArea = (aMax - aMin) * (bMax - bMin)

    expect(area).toBeCloseTo(expectedArea)
    expect(poly).toHaveLength(4)
  })

  it('单点 cluster 的面积应为 0', () => {
    const cluster: Pt[] = [{ pos: [3, 4] }]

    const { poly, area } = clusterToPolyAngle(cluster, [1, 0])

    expect(area).toBe(0)
    expect(poly).toHaveLength(4)
    for (const p of poly) {
      expect(p[0]).toBeCloseTo(3)
      expect(p[1]).toBeCloseTo(4)
    }
  })

  it('两点共线时面积应为 0', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [5, 0] }
    ]

    const { area } = clusterToPolyAngle(cluster, [1, 0])

    expect(area).toBe(0)
  })

  it('空 cluster 应安全回退', () => {
    const { poly, area } = clusterToPolyAngle([], [1, 0])

    expect(poly).toEqual([])
    expect(area).toBe(0)
  })

  it('零方向应回退为轴对齐包围盒', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 5] }
    ]

    const zero = clusterToPolyAngle(cluster, [0, 0])
    const vert = clusterToPolyVert(cluster)

    expectPolySetEqual(zero.poly, vert.poly)
    expect(zero.area).toBeCloseTo(vert.area)
  })

  it('反向方向 u 与 -u 应产生相同顶点集合', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] },
      { pos: [5, 5] }
    ]
    const u: [number, number] = [0.6, 0.8]

    const pos = clusterToPolyAngle(cluster, u)
    const neg = clusterToPolyAngle(cluster, [-u[0], -u[1]])

    expectPolySetEqual(pos.poly, neg.poly)
    expect(pos.area).toBeCloseTo(neg.area)
  })

  it('顶点顺序应为顺时针', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] },
      { pos: [10, 5] },
      { pos: [0, 5] }
    ]

    const { poly } = clusterToPolyAngle(cluster, [1, 0])

    expect(poly).toEqual([
      [0, 0],
      [10, 0],
      [10, 5],
      [0, 5]
    ])
  })

  it('便捷函数 clusterToPolyVert 和 clusterToPolyInc 返回标准方向的包围盒', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 0] },
      { pos: [10, 5] }
    ]
    const { l, r, t, b } = bbox(cluster)

    const vert = clusterToPolyVert(cluster)
    const inc = clusterToPolyInc(cluster)

    expectPolyMatch(vert.poly, [
      [l, t],
      [r, t],
      [r, b],
      [l, b]
    ])
    expect(vert.area).toBeCloseTo((r - l) * (b - t))
    expect(inc.poly).toHaveLength(4)
    expect(inc.area).toBeGreaterThan(0)
  })
})

describe('clusterToPolyMinimumArea', () => {
  it('应选择面积最小的方向', () => {
    // 点沿 45° 直线排列，45° 方向包围盒面积应明显小于 0° 方向
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 10] },
      { pos: [5, 5] }
    ]
    const directions: [number, number][] = [
      [1, 0],
      [sqrt2half, sqrt2half]
    ]

    const best = clusterToPolyMinimumArea(cluster, directions)
    const vert = clusterToPolyVert(cluster)

    expect(best.area).toBeLessThan(vert.area)
  })

  it('无方向时应回退为轴对齐包围盒', () => {
    const cluster: Pt[] = [
      { pos: [0, 0] },
      { pos: [10, 5] }
    ]

    const best = clusterToPolyMinimumArea(cluster, [])
    const vert = clusterToPolyVert(cluster)

    expectPolySetEqual(best.poly, vert.poly)
    expect(best.area).toBeCloseTo(vert.area)
  })
})
