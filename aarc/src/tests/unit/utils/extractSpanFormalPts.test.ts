import { describe, it, expect } from 'vitest'
import { extractSpanFormalPts } from '@/utils/lineUtils/extractSpanFormalPts'
import { FormalPt } from '@/models/coord'
import { FlatSpan } from '@/models/stores/saveDerived/lineSpanStore'

describe('extractSpanFormalPts', () => {
  function makeFp(afterIdxEqv: number): FormalPt {
    return { pos: [afterIdxEqv * 10, afterIdxEqv * 10], afterIdxEqv }
  }

  it('单 span 覆盖整条线路时应返回所有点', () => {
    // pts=[A,B,C], formalPts=[A, itp1, itp2, B, itp3, C]
    // afterIdxEqv: [0, 0, 0, 1, 1, 2]
    const allFormalPts: FormalPt[] = [
      makeFp(0), makeFp(0), makeFp(0),  // A + 2 itp
      makeFp(1), makeFp(1),             // B + 1 itp
      makeFp(2)                          // C
    ]
    const span: FlatSpan = { fromIdx: 0, toIdx: 2, fromPt: 10, toPt: 30 }

    const result = extractSpanFormalPts(allFormalPts, span)

    expect(result.length).toBe(6)
    expect(result[0].afterIdxEqv).toBe(0)
    expect(result[result.length - 1].afterIdxEqv).toBe(2)
  })

  it('截取前半段 span', () => {
    // pts=[A,B,C], formalPts=[A, itp1, itp2, B, itp3, C]
    const allFormalPts: FormalPt[] = [
      makeFp(0), makeFp(0), makeFp(0),
      makeFp(1), makeFp(1),
      makeFp(2)
    ]
    // span A→B: fromIdx=0, toIdx=1
    const span: FlatSpan = { fromIdx: 0, toIdx: 1, fromPt: 10, toPt: 20 }

    const result = extractSpanFormalPts(allFormalPts, span)

    expect(result.length).toBe(4)
    expect(result[0].afterIdxEqv).toBe(0)
    expect(result[result.length - 1].afterIdxEqv).toBe(1)
  })

  it('截取后半段 span', () => {
    // pts=[A,B,C], formalPts=[A, itp1, itp2, B, itp3, C]
    const allFormalPts: FormalPt[] = [
      makeFp(0), makeFp(0), makeFp(0),
      makeFp(1), makeFp(1),
      makeFp(2)
    ]
    // span B→C: fromIdx=1, toIdx=2
    const span: FlatSpan = { fromIdx: 1, toIdx: 2, fromPt: 20, toPt: 30 }

    const result = extractSpanFormalPts(allFormalPts, span)

    expect(result.length).toBe(3)
    expect(result[0].afterIdxEqv).toBe(1)
    expect(result[result.length - 1].afterIdxEqv).toBe(2)
  })

  it('多个 span 时中间段截取', () => {
    // pts=[A,B,C,D], 对应 formalSegs[0](A→B), [1](B→C), [2](C→D)
    // formalPts 生成顺序：
    // A(0), seg[0].itp(0), B(1), seg[1].itp(1), seg[1].itp(1), C(2), seg[2].itp(2), D(3)
    // afterIdxEqv: [0, 0, 1, 1, 1, 2, 2, 3]
    const allFormalPts: FormalPt[] = [
      makeFp(0), makeFp(0),
      makeFp(1),
      makeFp(1), makeFp(1),
      makeFp(2),
      makeFp(2),
      makeFp(3)
    ]
    // span B→C: fromIdx=1, toIdx=2
    // 应包含 [B(1), itp(1), itp(1), C(2)]
    const span: FlatSpan = { fromIdx: 1, toIdx: 2, fromPt: 20, toPt: 30 }

    const result = extractSpanFormalPts(allFormalPts, span)

    expect(result.length).toBe(4)
    expect(result[0].afterIdxEqv).toBe(1)
    expect(result[result.length - 1].afterIdxEqv).toBe(2)
  })

  it('空 formalPts 应返回空数组', () => {
    const span: FlatSpan = { fromIdx: 0, toIdx: 1, fromPt: 10, toPt: 20 }
    const result = extractSpanFormalPts([], span)
    expect(result).toEqual([])
  })

  it('fromIdx > toIdx 应返回空数组', () => {
    const allFormalPts: FormalPt[] = [makeFp(0), makeFp(1)]
    const span: FlatSpan = { fromIdx: 1, toIdx: 0, fromPt: 20, toPt: 10 }
    const result = extractSpanFormalPts(allFormalPts, span)
    expect(result).toEqual([])
  })
})
