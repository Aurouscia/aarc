import { describe, it, expect } from 'vitest'
import { ensureValidSliceEndpoints } from '@/models/save/valid/slices'
import { Save, TimeSlice, StyleSlice, Line } from '@/models/save'

function createSave(lines: Line[], timeSlices: TimeSlice[] = [], styleSlices: StyleSlice[] = []): Save {
    return {
        idIncre: 1,
        points: [],
        lines,
        textTags: [],
        cvsSize: [1000, 1000],
        config: {},
        meta: {},
        timeSlices,
        styleSlices
    } as Save
}

describe('ensureValidSliceEndpoints', () => {
    it('都非奇异且顺序正确时不应修改', () => {
        const line: Line = { id: 1, pts: [10, 20, 30, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 20, toPt: 40, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(20)
        expect(slice.toPt).toBe(40)
    })

    it('都非奇异且反了时应交换', () => {
        const line: Line = { id: 1, pts: [10, 20, 30, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 40, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(20)
        expect(slice.toPt).toBe(40)
    })

    it('from 非奇异、to 奇异且顺序正确时不应修改', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // slice from=B(20) to=A(10), A 是奇异点
        // A 出现在 0 和 3，B 在 1。to(A) 有出现在 from(B) 右侧的(3)，顺序正确
        const line: Line = { id: 1, pts: [10, 20, 30, 10, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 20, toPt: 10, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(20)
        expect(slice.toPt).toBe(10)
    })

    it('from 非奇异、to 奇异且反了时应交换', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // slice from=D(40) to=A(10), A 是奇异点
        // A 的所有出现(0,3)都在 D(4) 左侧，说明反了（正常应该是 from=A, to=D）
        const line: Line = { id: 1, pts: [10, 20, 30, 10, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 40, toPt: 10, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(10)
        expect(slice.toPt).toBe(40)
    })

    it('from 奇异、to 非奇异且顺序正确时不应修改', () => {
        // pts: A(10) - B(20) - C(30) - A(10) - D(40)
        // slice from=A(10) to=D(40), A 是奇异点
        // A 有出现在 to(D) 左侧的(0,3)，顺序正确
        const line: Line = { id: 1, pts: [10, 20, 30, 10, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 10, toPt: 40, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(10)
        expect(slice.toPt).toBe(40)
    })

    it('from 奇异、to 非奇异且反了时应交换', () => {
        // pts: B(20) - C(30) - A(10) - D(40) - A(10)
        // slice from=A(10) to=B(20), A 是奇异点出现在 2 和 4
        // A 的所有出现(2,4)都在 B(0) 右侧 → 反了
        const line: Line = { id: 1, pts: [20, 30, 10, 40, 10], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 10, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        expect(slice.fromPt).toBe(20)
        expect(slice.toPt).toBe(10)
    })

    it('双方奇异时不应处理', () => {
        // pts: A(10) - B(20) - A(10) - B(20)
        // slice from=A to=B，双方都是奇异点
        const line: Line = { id: 1, pts: [10, 20, 10, 20], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 10, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        ensureValidSliceEndpoints(save)

        // 不应修改
        expect(slice.fromPt).toBe(10)
        expect(slice.toPt).toBe(20)
    })

    it('应同时处理 timeSlices 和 styleSlices', () => {
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const timeSlice: TimeSlice = { id: 1, line: 1, fromPt: 30, toPt: 10, time: {} }
        const styleSlice: StyleSlice = { id: 2, line: 1, fromPt: 30, toPt: 10, style: 0 }
        const save = createSave([line], [timeSlice], [styleSlice])

        ensureValidSliceEndpoints(save)

        expect(timeSlice.fromPt).toBe(10)
        expect(timeSlice.toPt).toBe(30)
        expect(styleSlice.fromPt).toBe(10)
        expect(styleSlice.toPt).toBe(30)
    })

    it('线路不存在时不应崩溃', () => {
        const slice: TimeSlice = { id: 1, line: 999, fromPt: 10, toPt: 20, time: {} }
        const save = createSave([], [slice])

        // 不应抛出异常
        expect(() => ensureValidSliceEndpoints(save)).not.toThrow()
        expect(slice.fromPt).toBe(10)
        expect(slice.toPt).toBe(20)
    })
})
