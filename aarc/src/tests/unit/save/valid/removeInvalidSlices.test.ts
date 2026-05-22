import { describe, it, expect } from 'vitest'
import { removeInvalidSlices } from '@/models/save/valid/slices'
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

describe('removeInvalidSlices', () => {
    it('正常 slice 不应被删除', () => {
        const line: Line = { id: 1, pts: [10, 20, 30, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 20, toPt: 40, time: {} }
        const save = createSave([line], [slice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(0)
        expect(save.timeSlices).toHaveLength(1)
    })

    it('端点不存在于线路中的 slice 应被删除', () => {
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 99, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(1)
        expect(removed[0]).toEqual({ id: 1, type: 'time' })
        expect(save.timeSlices).toHaveLength(0)
    })

    it('双奇异点的 slice 应被删除', () => {
        // pts: A(10) - B(20) - A(10) - B(20)
        const line: Line = { id: 1, pts: [10, 20, 10, 20], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 10, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(1)
        expect(removed[0]).toEqual({ id: 1, type: 'time' })
        expect(save.timeSlices).toHaveLength(0)
    })

    it('无法解析的 slice（同点）应被删除', () => {
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const slice: TimeSlice = { id: 1, line: 1, fromPt: 20, toPt: 20, time: {} }
        const save = createSave([line], [slice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(1)
        expect(save.timeSlices).toHaveLength(0)
    })

    it('应同时处理 timeSlices 和 styleSlices', () => {
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const timeSlice: TimeSlice = { id: 1, line: 1, fromPt: 99, toPt: 20, time: {} }
        const styleSlice: StyleSlice = { id: 2, line: 1, fromPt: 10, toPt: 99, style: 0 }
        const save = createSave([line], [timeSlice], [styleSlice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(2)
        expect(save.timeSlices).toHaveLength(0)
        expect(save.styleSlices).toHaveLength(0)
    })

    it('只检查指定线路时，其他线路的 slice 不受影响', () => {
        const line1: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const line2: Line = { id: 2, pts: [100, 200], name: '', nameSub: '', color: '', type: 0 } as Line
        const badSlice: TimeSlice = { id: 1, line: 1, fromPt: 99, toPt: 20, time: {} }
        const goodSlice: TimeSlice = { id: 2, line: 2, fromPt: 100, toPt: 200, time: {} }
        const save = createSave([line1, line2], [badSlice, goodSlice])

        const removed = removeInvalidSlices(save, [1])

        expect(removed).toHaveLength(1)
        expect(removed[0]).toEqual({ id: 1, type: 'time' })
        expect(save.timeSlices).toHaveLength(1)
        expect(save.timeSlices![0].id).toBe(2)
    })

    it('不指定线路时检查所有线路', () => {
        const line1: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        const line2: Line = { id: 2, pts: [100, 200], name: '', nameSub: '', color: '', type: 0 } as Line
        const badSlice1: TimeSlice = { id: 1, line: 1, fromPt: 99, toPt: 20, time: {} }
        const badSlice2: StyleSlice = { id: 2, line: 2, fromPt: 100, toPt: 100, style: 0 }
        const save = createSave([line1, line2], [badSlice1], [badSlice2])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(2)
        expect(save.timeSlices).toHaveLength(0)
        expect(save.styleSlices).toHaveLength(0)
    })

    it('线路不存在时 slice 应被删除', () => {
        const slice: TimeSlice = { id: 1, line: 999, fromPt: 10, toPt: 20, time: {} }
        const save = createSave([], [slice])

        const removed = removeInvalidSlices(save)

        expect(removed).toHaveLength(1)
        expect(save.timeSlices).toHaveLength(0)
    })
})
