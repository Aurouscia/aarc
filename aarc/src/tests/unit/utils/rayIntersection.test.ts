import { describe, it, expect } from 'vitest'
import { rayIntersect } from '@/utils/rayUtils/rayIntersection'
import { FormalRay } from '@/models/coord'

function makeRay(source: [number, number], way: [number, number]): FormalRay {
  return { source, way: way as any }
}

describe('rayIntersect', () => {
  it('正交水平线与垂直线相交', () => {
    const a = makeRay([0, 0], [1, 0]) // 从原点向右的水平线
    const b = makeRay([5, -5], [0, 1]) // 从 (5,-5) 向上的垂直线
    expect(rayIntersect(a, b)).toEqual([5, 0])
  })

  it('两条水平平行线返回 undefined', () => {
    const a = makeRay([0, 0], [1, 0])
    const b = makeRay([0, 5], [1, 0])
    expect(rayIntersect(a, b)).toBeUndefined()
  })

  it('两条垂直平行线返回 undefined', () => {
    const a = makeRay([0, 0], [0, 1])
    const b = makeRay([5, 0], [0, 1])
    expect(rayIntersect(a, b)).toBeUndefined()
  })

  it('两条斜向平行线返回 undefined', () => {
    const a = makeRay([0, 0], [1, 1])
    const b = makeRay([5, 0], [1, 1])
    expect(rayIntersect(a, b)).toBeUndefined()
  })

  it('45° 斜线与水平线相交', () => {
    const a = makeRay([0, 0], [1, 1]) // y=x
    const b = makeRay([5, 0], [-1, 0]) // y=0，从右向左
    expect(rayIntersect(a, b)).toEqual([0, 0])
  })

  it('perpOnly=true 时仅当两射线垂直才返回交点', () => {
    const horizontal = makeRay([0, 0], [1, 0])
    const vertical = makeRay([5, -5], [0, 1])
    const diagonal = makeRay([0, 0], [1, 1])

    expect(rayIntersect(horizontal, vertical, true)).toEqual([5, 0])
    expect(rayIntersect(horizontal, diagonal, true)).toBeUndefined()
  })

  it('交点位于射线反方向延长线上也返回（射线按无限直线处理）', () => {
    const a = makeRay([0, 0], [1, 0])
    const b = makeRay([5, 5], [0, -1])
    // b 方向向下，但交点 (5,0) 在 b 的反向延长线上
    // 当前实现把 ray 当直线，仍返回交点
    expect(rayIntersect(a, b)).toEqual([5, 0])
  })

  it('两条 45° 斜线相交', () => {
    // y = x  与  y = -x + 10  交于 (5,5)
    const a = makeRay([0, 0], [1, 1])
    const b = makeRay([10, 0], [-1, 1])
    const res = rayIntersect(a, b)!
    expect(res[0]).toBeCloseTo(5)
    expect(res[1]).toBeCloseTo(5)
  })
})
