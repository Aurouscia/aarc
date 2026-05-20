import { describe, it, expect } from 'vitest'
import {
    getCellInfo,
    needTopBar,
    needBottomBar,
    checkOverlap,
    computeSliceEndpoints,
    computeResizeEndpoints,
} from '@/components/sidebars/options/slices/sliceEditor'
import { Line, LineSliceBase } from '@/models/save'
import { SliceEndpointIndices } from '@/models/stores/saveDerived/slice/sliceResolverStore'

function createLine(pts: number[]): Line {
    return { id: 1, pts, name: '', nameSub: '', color: '', type: 0 } as Line
}

function createSlice(id: number, fromPt: number, toPt: number): LineSliceBase {
    return { id, line: 1, fromPt, toPt }
}

function createIndicesMap(entries: [number, SliceEndpointIndices | undefined][]): Map<number, SliceEndpointIndices | undefined> {
    return new Map(entries)
}

// ========== getCellInfo ==========

describe('getCellInfo', () => {
    it('空 slice 列表时所有行都是 empty', () => {
        const map = createIndicesMap([])
        expect(getCellInfo([], map, 0)).toEqual({ role: 'empty' })
        expect(getCellInfo([], map, 5)).toEqual({ role: 'empty' })
    })

    it('单行 slice（start=end）时该行同时是 start 和 end', () => {
        const slices = [createSlice(1, 10, 10)]
        const map = createIndicesMap([[1, { fromIdx: 2, toIdx: 2 }]])
        expect(getCellInfo(slices, map, 2)).toEqual({ role: 'start', sliceId: 1 })
        expect(getCellInfo(slices, map, 1)).toEqual({ role: 'empty' })
    })

    it('多行 slice 中正确识别 start/middle/end', () => {
        const slices = [createSlice(1, 10, 40)]
        const map = createIndicesMap([[1, { fromIdx: 1, toIdx: 3 }]])
        expect(getCellInfo(slices, map, 1)).toEqual({ role: 'start', sliceId: 1 })
        expect(getCellInfo(slices, map, 2)).toEqual({ role: 'middle', sliceId: 1 })
        expect(getCellInfo(slices, map, 3)).toEqual({ role: 'end', sliceId: 1 })
        expect(getCellInfo(slices, map, 0)).toEqual({ role: 'empty' })
        expect(getCellInfo(slices, map, 4)).toEqual({ role: 'empty' })
    })

    it('多个不重叠的 slice 各自范围正确', () => {
        const slices = [createSlice(1, 10, 20), createSlice(2, 50, 60)]
        const map = createIndicesMap([
            [1, { fromIdx: 1, toIdx: 2 }],
            [2, { fromIdx: 5, toIdx: 6 }],
        ])
        expect(getCellInfo(slices, map, 1)).toEqual({ role: 'start', sliceId: 1 })
        expect(getCellInfo(slices, map, 2)).toEqual({ role: 'end', sliceId: 1 })
        expect(getCellInfo(slices, map, 3)).toEqual({ role: 'empty' })
        expect(getCellInfo(slices, map, 4)).toEqual({ role: 'empty' })
        expect(getCellInfo(slices, map, 5)).toEqual({ role: 'start', sliceId: 2 })
        expect(getCellInfo(slices, map, 6)).toEqual({ role: 'end', sliceId: 2 })
    })

    it('多个相邻 slice 边界正确', () => {
        const slices = [createSlice(1, 10, 20), createSlice(2, 30, 40)]
        const map = createIndicesMap([
            [1, { fromIdx: 1, toIdx: 2 }],
            [2, { fromIdx: 3, toIdx: 4 }],
        ])
        expect(getCellInfo(slices, map, 2)).toEqual({ role: 'end', sliceId: 1 })
        expect(getCellInfo(slices, map, 3)).toEqual({ role: 'start', sliceId: 2 })
    })

    it('解析结果为 undefined 的 slice 被跳过', () => {
        const slices = [createSlice(1, 10, 20), createSlice(2, 99, 99)]
        const map = createIndicesMap([
            [1, { fromIdx: 1, toIdx: 2 }],
            [2, undefined],
        ])
        expect(getCellInfo(slices, map, 1)).toEqual({ role: 'start', sliceId: 1 })
        expect(getCellInfo(slices, map, 5)).toEqual({ role: 'empty' })
    })
})

// ========== needTopBar / needBottomBar ==========

describe('needTopBar', () => {
    it('end 行需要上半截 bar', () => {
        const slices = [createSlice(1, 10, 40)]
        const map = createIndicesMap([[1, { fromIdx: 1, toIdx: 3 }]])
        expect(needTopBar(slices, map, 3)).toBe(true)
        expect(needTopBar(slices, map, 1)).toBe(false)
        expect(needTopBar(slices, map, 2)).toBe(false)
    })

    it('start=end 的单行 slice 也是 end 行', () => {
        const slices = [createSlice(1, 10, 10)]
        const map = createIndicesMap([[1, { fromIdx: 2, toIdx: 2 }]])
        expect(needTopBar(slices, map, 2)).toBe(true)
    })
})

describe('needBottomBar', () => {
    it('start 行需要下半截 bar', () => {
        const slices = [createSlice(1, 10, 40)]
        const map = createIndicesMap([[1, { fromIdx: 1, toIdx: 3 }]])
        expect(needBottomBar(slices, map, 1)).toBe(true)
        expect(needBottomBar(slices, map, 3)).toBe(false)
        expect(needBottomBar(slices, map, 2)).toBe(false)
    })

    it('start=end 的单行 slice 也是 start 行', () => {
        const slices = [createSlice(1, 10, 10)]
        const map = createIndicesMap([[1, { fromIdx: 2, toIdx: 2 }]])
        expect(needBottomBar(slices, map, 2)).toBe(true)
    })
})

// ========== checkOverlap ==========

describe('checkOverlap', () => {
    const slices = [createSlice(1, 10, 20), createSlice(2, 50, 60)]
    const map = createIndicesMap([
        [1, { fromIdx: 1, toIdx: 3 }],
        [2, { fromIdx: 5, toIdx: 7 }],
    ])

    it('无重叠时应返回 false', () => {
        expect(checkOverlap(slices, map, -1, 8, 9)).toBe(false)
    })

    it('部分重叠时应返回 true', () => {
        expect(checkOverlap(slices, map, -1, 2, 6)).toBe(true)
    })

    it('边界相邻时应返回 false（允许相邻）', () => {
        expect(checkOverlap(slices, map, -1, 4, 4)).toBe(false)  // [4,4] 与 [1,3] 相邻
        expect(checkOverlap(slices, map, -1, 4, 5)).toBe(true)   // [4,5] 与 [5,7] 重叠
    })

    it('排除自身时应返回 false', () => {
        expect(checkOverlap(slices, map, 1, 1, 3)).toBe(false)
    })
})

// ========== computeSliceEndpoints（创建） ==========

describe('computeSliceEndpoints', () => {
    it('非奇异点，正常顺序 → 原顺序存储', () => {
        const line = createLine([10, 20, 30, 40])
        // 点击索引1(20)到索引3(40)
        const result = computeSliceEndpoints(line, 1, 3)
        expect(result).toEqual({ fromPt: 20, toPt: 40 })
    })

    it('非奇异点，反向顺序 → 原顺序存储（resolver 会交换）', () => {
        const line = createLine([10, 20, 30, 40])
        // 点击索引3(40)到索引1(20)
        const result = computeSliceEndpoints(line, 3, 1)
        expect(result).toEqual({ fromPt: 40, toPt: 20 })
    })

    it('奇异点在前（先点击远的位置）→ 交换存储', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // 用户先点击索引3(A)再点击索引1(B)，意图 [1,3]
        // 直接存 A→B 会解析为 from奇异向左找=0, to=1 → [0,1]
        // 交换存 B→A 会解析为 from=1, to奇异向右找=3 → [1,3] ✅
        const line = createLine([10, 20, 30, 10, 40])
        const result = computeSliceEndpoints(line, 3, 1)
        expect(result).toEqual({ fromPt: 20, toPt: 10 })
    })

    it('奇异点在后 → 原顺序存储', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // 用户先点击索引1(B)再点击索引3(A)，意图 [1,3]
        // 直接存 B→A 会解析为 from=1, to奇异向右找=3 → [1,3] ✅
        const line = createLine([10, 20, 30, 10, 40])
        const result = computeSliceEndpoints(line, 1, 3)
        expect(result).toEqual({ fromPt: 20, toPt: 10 })
    })

    it('双奇异点 → undefined', () => {
        const line = createLine([10, 20, 10, 20])
        const result = computeSliceEndpoints(line, 0, 3)
        expect(result).toBeUndefined()
    })

    it('同点 → undefined', () => {
        const line = createLine([10, 20, 30])
        const result = computeSliceEndpoints(line, 1, 1)
        expect(result).toBeUndefined()
    })

    it('环线：先点击最后一行(最后一个A)再点击中间点 → 交换存储', () => {
        // pts: A(10) - B(20) - C(30) - A(10)
        // 用户先点击索引3(A)再点击索引1(B)，意图 [1,3]
        const line = createLine([10, 20, 30, 10])
        const result = computeSliceEndpoints(line, 3, 1)
        expect(result).toEqual({ fromPt: 20, toPt: 10 })
    })
})

// ========== computeResizeEndpoints（重设） ==========

describe('computeResizeEndpoints', () => {
    it('非奇异点重设 → 正确计算新端点', () => {
        // pts: A(10) - B(20) - C(30) - D(40)
        // 当前 slice [B,D] = [1,3]，存储 fromPt=20, toPt=40
        // 重设上点（startIdx=1）为 A（索引0）
        const line = createLine([10, 20, 30, 40])
        const current = { startIdx: 1, endIdx: 3 }
        const result = computeResizeEndpoints(line, current, 1, 0)
        // 固定端是 endIdx=3(D=40)，新端点是 0(A=10)
        // 意图 [0,3]，resolve(40,10) 和 resolve(10,40) 都返回 [0,3]
        // opt1 先匹配，返回 {fromPt: 40, toPt: 10}
        expect(result).toEqual({ fromPt: 40, toPt: 10 })
    })

    it('奇异点固定端，重设另一端 → 正确保持固定端位置', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // 当前 slice [B,最后一个A] = [1,3]，存储 fromPt=20, toPt=10
        // 重设上点（startIdx=1=B）为 C（索引2）
        const line = createLine([10, 20, 30, 10, 40])
        const current = { startIdx: 1, endIdx: 3 }
        const result = computeResizeEndpoints(line, current, 1, 2)
        // 固定端是 endIdx=3(A)，新端点是 2(C)
        // 意图 [2,3]，resolve(C,A) = from=2, to奇异向右找=3 → [2,3]
        // 但 resolve(A,C) = from奇异向左找=3, to=2 → [2,3] 也成立？
        // 实际上 resolve(30, 10): from非奇异=2, to奇异向右找A → i=3(A) → [2,3] ✅
        // resolve(10, 30): from奇异向左找 → i=3? 不对，从3向左找30 → 没有
        // 等等，findNearestLeft(line, 2, 10) 从2向左找10：i=2(C), i=1(B), i=0(A) dist=2 → fromIdx=0
        // 所以 resolve(10, 30) = [0, 2] ❌
        // resolve(30, 10) = [2, 3] ✅
        expect(result).toEqual({ fromPt: 30, toPt: 10 })
    })

    it('奇异点被重设，固定端非奇异 → 正确解析新位置', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // 当前 slice [B,最后一个A] = [1,3]，存储 fromPt=20, toPt=10
        // 重设下点（endIdx=3=A）为 D（索引4）
        const line = createLine([10, 20, 30, 10, 40])
        const current = { startIdx: 1, endIdx: 3 }
        const result = computeResizeEndpoints(line, current, 3, 4)
        // 固定端是 startIdx=1(B)，新端点是 4(D)
        // 意图 [1,4]，resolve(B,D) = from=1, to=4 → [1,4] ✅
        expect(result).toEqual({ fromPt: 20, toPt: 40 })
    })

    it('重设后导致双奇异 → undefined', () => {
        // pts: A(10) - B(20) - A(30) - C(40)
        // 当前 slice [B,C] = [1,3]，存储 fromPt=20, toPt=40
        // 重设上点为 A（索引0）
        const line = createLine([10, 20, 10, 40])
        const current = { startIdx: 1, endIdx: 3 }
        const result = computeResizeEndpoints(line, current, 1, 0)
        // 固定端是 3(C)，新端点是 0(A)
        // A 是奇异点，C 非奇异 → 不是双奇异
        // resolve(A,C): from奇异向左找 → findNearestLeft(3,10)=2? 不对
        // findNearestLeft(line, 3, 10): i=3(C), i=2(A) dist=1, i=0(A) dist=3 → fromIdx=2
        // resolve(A,C) = [2, 3] ❌ 不匹配 [0, 3]
        // resolve(C,A): from=3, to奇异向右找 → 无 → undefined
        expect(result).toBeUndefined()
    })

    it('重设后同点 → undefined', () => {
        const line = createLine([10, 20, 30])
        const current = { startIdx: 1, endIdx: 2 }
        const result = computeResizeEndpoints(line, current, 2, 1)
        // 固定端是 1(B)，新端点是 1(B) → 同点
        expect(result).toBeUndefined()
    })
})
