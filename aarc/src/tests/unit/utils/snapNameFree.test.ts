import { describe, it, expect } from 'vitest'
import {
  computeFreeNameSnapCandidates,
  projectToNearestNormalLine
} from '@/utils/snapUtils/snapNameFree'
import { sqrt2half } from '@/utils/consts'

describe('computeFreeNameSnapCandidates', () => {
  it('单方向生成 ±法向 2 个候选', () => {
    const cands = computeFreeNameSnapCandidates([[1, 0]], 2)
    expect(cands).toHaveLength(2)
    expect(cands[0][0]).toBeCloseTo(0)
    expect(cands[0][1]).toBeCloseTo(2)
    expect(cands[1][0]).toBeCloseTo(0)
    expect(cands[1][1]).toBeCloseTo(-2)
  })

  it('两方向生成 4 个候选（水平 + 45°）', () => {
    const cands = computeFreeNameSnapCandidates([[1, 0], [sqrt2half, sqrt2half]], 1)
    expect(cands).toHaveLength(4)
    // u = [1, 0] → n = [0, 1]
    expect(cands[0][0]).toBeCloseTo(0)
    expect(cands[0][1]).toBeCloseTo(1)
    expect(cands[1][0]).toBeCloseTo(0)
    expect(cands[1][1]).toBeCloseTo(-1)
    // u = [√2/2, √2/2] → n = [-√2/2, √2/2]
    expect(cands[2][0]).toBeCloseTo(-sqrt2half)
    expect(cands[2][1]).toBeCloseTo(sqrt2half)
    expect(cands[3][0]).toBeCloseTo(sqrt2half)
    expect(cands[3][1]).toBeCloseTo(-sqrt2half)
  })

  it('所有候选距离都等于 snd', () => {
    const angle = 30 * Math.PI / 180
    const cands = computeFreeNameSnapCandidates(
      [[Math.cos(angle), Math.sin(angle)]], 3)
    for (const c of cands) {
      expect(Math.hypot(c[0], c[1])).toBeCloseTo(3)
    }
  })

  it('dirs 为空时返回空数组', () => {
    expect(computeFreeNameSnapCandidates([], 1)).toEqual([])
  })
})

describe('projectToNearestNormalLine', () => {
  it('投影到唯一方向的法向直线', () => {
    // u = [1, 0]，法向直线为 y 轴；[3, 0.1] 的投影为 [0, 0.1]
    const res = projectToNearestNormalLine([3, 0.1], [[1, 0]])
    expect(res).toBeDefined()
    expect(res!.distAbs).toBeCloseTo(3)
    expect(res!.proj[0]).toBeCloseTo(0)
    expect(res!.proj[1]).toBeCloseTo(0.1)
  })

  it('多方向时取距离最小的法向直线', () => {
    // u=[1,0] 的距离为 1，u=[0,1] 的距离为 0.1；应取后者，投影到 x 轴
    const res = projectToNearestNormalLine([1, 0.1], [[1, 0], [0, 1]])
    expect(res).toBeDefined()
    expect(res!.distAbs).toBeCloseTo(0.1)
    expect(res!.proj[0]).toBeCloseTo(1)
    expect(res!.proj[1]).toBeCloseTo(0)
  })

  it('法向直线上的点投影为自身', () => {
    // [0, 5] 恰在 u=[1,0] 的法向直线（y 轴）上
    const res = projectToNearestNormalLine([0, 5], [[1, 0]])
    expect(res!.distAbs).toBeCloseTo(0)
    expect(res!.proj[0]).toBeCloseTo(0)
    expect(res!.proj[1]).toBeCloseTo(5)
  })

  it('dirs 为空时返回 undefined', () => {
    expect(projectToNearestNormalLine([1, 2], [])).toBeUndefined()
  })
})
