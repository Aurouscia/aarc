import { describe, it, expect } from 'vitest'
import {
  isRing,
  isRingByFormalPts,
  getByIndexInRing,
  isSameIdxInLine,
  getMayRingLinePtIds
} from '@/utils/lineUtils/isRing'
import { Line } from '@/models/save'
import { FormalPt } from '@/models/coord'

function makeLine(pts: number[], overrides?: Partial<Line>): Line {
  return {
    id: 1,
    pts,
    name: '测试线路',
    nameSub: '',
    color: '#ff0000',
    type: 0,
    ...overrides
  }
}

function makeFp(pos: [number, number]): FormalPt {
  return { pos, afterIdxEqv: 0 }
}

describe('isRing', () => {
  it('非环线：首尾点不同', () => {
    expect(isRing(makeLine([10, 20, 30]))).toBe(false)
  })

  it('环线：首尾点相同且长度大于 2', () => {
    expect(isRing(makeLine([10, 20, 30, 10]))).toBe(true)
  })

  it('长度小于等于 2 时不视为环线', () => {
    expect(isRing(makeLine([10]))).toBeUndefined()
    expect(isRing(makeLine([10, 20]))).toBeUndefined()
  })

  it('支持 number[] 输入', () => {
    expect(isRing([10, 20, 30])).toBe(false)
    expect(isRing([10, 20, 30, 10])).toBe(true)
  })

  it('支持 ControlPoint[] 输入', () => {
    const pts = [
      { id: 10, pos: [0, 0], dir: 0, sta: 0 },
      { id: 20, pos: [10, 0], dir: 0, sta: 0 },
      { id: 30, pos: [10, 10], dir: 0, sta: 0 },
      { id: 10, pos: [0, 0], dir: 0, sta: 0 }
    ]
    expect(isRing(pts as any)).toBe(true)
  })

  it('仅首尾相同、中间重复不应误判为环线之外的场景', () => {
    // 中间自交不是环线判断范围，只关心首尾
    expect(isRing(makeLine([10, 20, 10, 30]))).toBe(false)
  })
})

describe('isRingByFormalPts', () => {
  it('首尾坐标相同视为环线', () => {
    const pts: FormalPt[] = [makeFp([0, 0]), makeFp([10, 0]), makeFp([0, 0])]
    expect(isRingByFormalPts(pts)).toBe(true)
  })

  it('首尾坐标不同视为非环线', () => {
    const pts: FormalPt[] = [makeFp([0, 0]), makeFp([10, 0]), makeFp([10, 10])]
    expect(isRingByFormalPts(pts)).toBe(false)
  })

  it('长度小于等于 2 时不视为环线', () => {
    expect(isRingByFormalPts([makeFp([0, 0])])).toBeUndefined()
    expect(isRingByFormalPts([makeFp([0, 0]), makeFp([10, 0])])).toBeUndefined()
  })

  it('坐标在 epsilon 范围内相同视为相同', () => {
    const pts: FormalPt[] = [
      makeFp([0, 0]),
      makeFp([10, 0]),
      makeFp([1e-10, -1e-10])
    ]
    expect(isRingByFormalPts(pts)).toBe(true)
  })
})

describe('getByIndexInRing', () => {
  it('普通索引直接返回', () => {
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), 1)).toBe(20)
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), 2)).toBe(30)
  })

  it('负数索引向环尾回绕', () => {
    // idx=-1 对应倒数第二个点（最后一个点是重复的环首）
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), -1)).toBe(30)
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), -2)).toBe(20)
  })

  it('超出末尾索引向环头回绕', () => {
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), 3)).toBe(10)
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), 4)).toBe(20)
  })

  it('回绕范围外返回 undefined', () => {
    // 长度为 4 的环线数组允许回绕访问最多 3 个唯一点（length-1）
    // idx=-3 和 idx=6 都已经超出半个环回绕范围
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), -3)).toBeUndefined()
    expect(getByIndexInRing(makeLine([10, 20, 30, 10]), 6)).toBeUndefined()
  })
})

describe('isSameIdxInLine', () => {
  it('非环线：仅索引相等时返回 true', () => {
    expect(isSameIdxInLine(makeLine([10, 20, 30]), 0, 0)).toBe(true)
    expect(isSameIdxInLine(makeLine([10, 20, 30]), 0, 1)).toBe(false)
  })

  it('环线：首尾索引视为相同', () => {
    expect(isSameIdxInLine(makeLine([10, 20, 30, 10]), 0, 3)).toBe(true)
    expect(isSameIdxInLine(makeLine([10, 20, 30, 10]), 3, 0)).toBe(true)
  })

  it('环线：中间不同索引仍视为不同', () => {
    expect(isSameIdxInLine(makeLine([10, 20, 30, 10]), 1, 2)).toBe(false)
  })
})

describe('getMayRingLinePtIds', () => {
  it('非环线返回完整点 id 副本', () => {
    const line = makeLine([10, 20, 30])
    const res = getMayRingLinePtIds(line)
    expect(res).toEqual([10, 20, 30])
    // 应返回副本，修改不影响原数组
    res.push(40)
    expect(line.pts).toEqual([10, 20, 30])
  })

  it('环线去掉重复的首尾点', () => {
    const line = makeLine([10, 20, 30, 10])
    expect(getMayRingLinePtIds(line)).toEqual([10, 20, 30])
  })
})
