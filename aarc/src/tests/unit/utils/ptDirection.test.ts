import { describe, it, expect } from 'vitest'
import {
  AdjacentSeg,
  computePtDirectionInfo,
  computePtDirections
} from '@/utils/ptUtils/ptDirection'
import { Coord } from '@/models/coord'

function seg(prev?: Coord, next?: Coord): AdjacentSeg {
  const res: AdjacentSeg = {}
  if (prev) res.prev = { pos: prev }
  if (next) res.next = { pos: next }
  return res
}

describe('computePtDirectionInfo', () => {
  it('两侧存在且共线时产生 1 个方向，prev 和 next 都设置', () => {
    const pos: Coord = [1, 0]
    const info = computePtDirectionInfo(pos, seg([0, 0], [2, 0]))
    expect(info.all).toHaveLength(1)
    expect(info.all[0][0]).toBeCloseTo(1, 6)
    expect(info.all[0][1]).toBeCloseTo(0, 6)
    expect(info.prev).toBeDefined()
    expect(info.next).toBeDefined()
    expect(info.prev!.dir[0]).toBeCloseTo(-1, 6)
    expect(info.next!.dir[0]).toBeCloseTo(1, 6)
  })

  it('两侧存在且成角时产生 2 个方向', () => {
    const pos: Coord = [0, 0]
    const info = computePtDirectionInfo(pos, seg([-1, 0], [1, 1]))
    expect(info.all).toHaveLength(2)
    // prev 方向 (-1,0) 归一化到 (1,0)
    expect(info.all.some(d => isZero(d[0] - 1) && isZero(d[1]))).toBe(true)
    // next 方向 (1,1) 归一化到 (sqrt2/2, sqrt2/2)
    expect(info.all.some(d => isZero(d[0] - d[1]) && d[0] > 0)).toBe(true)
    expect(info.prev).toBeDefined()
    expect(info.next).toBeDefined()
  })

  it('只有 prev 时产生 1 个方向', () => {
    const pos: Coord = [1, 0]
    const info = computePtDirectionInfo(pos, seg([0, 0], undefined))
    expect(info.all).toHaveLength(1)
    expect(info.prev).toBeDefined()
    expect(info.next).toBeUndefined()
    expect(info.prev!.pos).toEqual([0, 0])
  })

  it('只有 next 时产生 1 个方向', () => {
    const pos: Coord = [0, 0]
    const info = computePtDirectionInfo(pos, seg(undefined, [1, 0]))
    expect(info.all).toHaveLength(1)
    expect(info.prev).toBeUndefined()
    expect(info.next).toBeDefined()
    expect(info.next!.pos).toEqual([1, 0])
  })

  it('孤立点时无方向', () => {
    const info = computePtDirectionInfo([0, 0], undefined)
    expect(info.all).toHaveLength(0)
    expect(info.prev).toBeUndefined()
    expect(info.next).toBeUndefined()
  })

  it('相邻点与当前点重合时跳过该侧', () => {
    const pos: Coord = [1, 0]
    const info = computePtDirectionInfo(pos, seg([1, 0], [2, 0]))
    expect(info.all).toHaveLength(1)
    expect(info.prev).toBeUndefined()
    expect(info.next).toBeDefined()
  })

  it('prev 和 next 方向相反时归一化到同一方向', () => {
    const pos: Coord = [1, 0]
    const info = computePtDirectionInfo(pos, seg([0, 0], [2, 0]))
    expect(info.all).toHaveLength(1)
    expect(info.prev!.dir[0]).toBeCloseTo(-1, 6)
    expect(info.next!.dir[0]).toBeCloseTo(1, 6)
  })

  it('垂直反向也归一化到同一方向', () => {
    const pos: Coord = [0, 0]
    const info = computePtDirectionInfo(pos, seg([0, -1], [0, 1]))
    expect(info.all).toHaveLength(1)
    expect(info.all[0][0]).toBeCloseTo(0, 6)
    expect(info.all[0][1]).toBeCloseTo(1, 6)
  })
})

describe('computePtDirections', () => {
  it('只返回 all 数组', () => {
    const dirs = computePtDirections([0, 0], seg([-1, 0], [1, 1]))
    expect(dirs).toHaveLength(2)
  })
})

function isZero(n: number): boolean {
  return Math.abs(n) < 1e-6
}
