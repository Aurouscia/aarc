import { describe, it, expect } from 'vitest'
import { resolveSliceEndpoints } from '@/models/stores/saveDerived/slice/sliceResolver'
import { Line } from '@/models/save'

function createLine(pts: number[]): Line {
    return { id: 1, pts, name: '', nameSub: '', color: '', type: 0 } as Line
}

describe('resolveSliceEndpoints', () => {
    describe('基本规则', () => {
        it('同点应返回 undefined', () => {
            const line = createLine([10, 20, 30])
            expect(resolveSliceEndpoints(line, 20, 20)).toBeUndefined()
        })

        it('点不存在于线路中应返回 undefined', () => {
            const line = createLine([10, 20, 30])
            expect(resolveSliceEndpoints(line, 99, 20)).toBeUndefined()
            expect(resolveSliceEndpoints(line, 20, 99)).toBeUndefined()
        })

        it('双方奇异点应返回 undefined', () => {
            const line = createLine([10, 20, 10, 20])
            expect(resolveSliceEndpoints(line, 10, 20)).toBeUndefined()
        })
    })

    describe('都非奇异', () => {
        it('顺序正确时应直接返回索引', () => {
            const line = createLine([10, 20, 30, 40])
            expect(resolveSliceEndpoints(line, 20, 40)).toEqual({ fromIdx: 1, toIdx: 3 })
        })

        it('顺序反了时应自动交换', () => {
            const line = createLine([10, 20, 30, 40])
            expect(resolveSliceEndpoints(line, 40, 20)).toEqual({ fromIdx: 1, toIdx: 3 })
        })
    })

    describe('from 非奇异、to 奇异', () => {
        it('to 有多个出现时应向右找最近的 from', () => {
            // pts: A(10) - B(20) - C(30) - A(10) - D(40)
            // from=B(20) 非奇异, to=A(10) 奇异
            // A 出现在 0 和 3，B 在 1。to 向右找最近的 from：A(3) 距离 B 为 2，A(0) 在左边不考虑
            // 结果应为 fromIdx=1(B), toIdx=3(A)
            const line = createLine([10, 20, 30, 10, 40])
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 1, toIdx: 3 })
        })

        it('to 在 from 右侧有出现时应找最近的', () => {
            // pts: A(10) - B(20) - C(30) - A(10) - D(40)
            // from=B(20) 非奇异, to=A(10) 奇异
            // A 出现在 0 和 3，B 在 1。to 向右找最近的 from：A(3) 距离 B 为 2
            // 结果应为 fromIdx=1(B), toIdx=3(A)
            const line = createLine([10, 20, 30, 10, 40])
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 1, toIdx: 3 })
        })

        it('to 在 from 右侧无出现时应返回 undefined（无法形成 from<to 的片段）', () => {
            // pts: A(10) - B(20) - C(30) - A(10) - D(40)
            // from=D(40) 非奇异(索引4), to=A(10) 奇异(索引0,3)
            // to 向右找最近的 from：从索引4开始向右找 A，右边没有 → -1
            const line = createLine([10, 20, 30, 10, 40])
            expect(resolveSliceEndpoints(line, 40, 10)).toBeUndefined()
        })

        it('to 只有一个出现在 from 右侧时应正常返回', () => {
            // pts: A(10) - B(20) - C(30) - A(10) - D(40)
            // from=B(20), to=A(10)
            // A 出现在 0 和 3，B 在 1。向右找：A(3) 是最近的
            const line = createLine([10, 20, 30, 10, 40])
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 1, toIdx: 3 })
        })
    })

    describe('from 奇异、to 非奇异', () => {
        it('from 有多个出现时应向左找最近的 to', () => {
            // pts: B(20) - C(30) - A(10) - D(40) - A(10)
            // from=A(10) 奇异, to=D(40) 非奇异
            // A 出现在 2 和 4，D 在 3。from 向左找最近的 to：A(2) 距离 D 为 1
            // 结果应为 fromIdx=2(A), toIdx=3(D)
            const line = createLine([20, 30, 10, 40, 10])
            expect(resolveSliceEndpoints(line, 10, 40)).toEqual({ fromIdx: 2, toIdx: 3 })
        })

        it('from 在 to 左侧有出现时应找最近的', () => {
            // pts: B(20) - C(30) - A(10) - D(40) - A(10)
            // from=A(10) 奇异, to=D(40) 非奇异
            // A 出现在 2 和 4，D 在 3。from 向左找最近的 to：A(2) 距离 D 为 1
            // 结果应为 fromIdx=2(A), toIdx=3(D)
            const line = createLine([20, 30, 10, 40, 10])
            expect(resolveSliceEndpoints(line, 10, 40)).toEqual({ fromIdx: 2, toIdx: 3 })
        })

        it('from 在 to 左侧无出现时应返回 undefined（无法形成 from<to 的片段）', () => {
            // pts: B(20) - C(30) - A(10) - D(40) - A(10)
            // from=A(10) 奇异(索引2,4), to=B(20) 非奇异(索引0)
            // from 向左找最近的 to：从索引0开始向左找 A，左边没有 → -1
            const line = createLine([20, 30, 10, 40, 10])
            expect(resolveSliceEndpoints(line, 10, 20)).toBeUndefined()
        })
    })

    describe('边界情况', () => {
        it('线路只有两个点时应正常工作', () => {
            const line = createLine([10, 20])
            expect(resolveSliceEndpoints(line, 10, 20)).toEqual({ fromIdx: 0, toIdx: 1 })
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 0, toIdx: 1 })
        })

        it('环线头尾相同（奇异点）与非奇异点组合', () => {
            // pts: A(10) - B(20) - C(30) - A(10)  环线，A 是奇异点
            // from=B(20) 非奇异, to=A(10) 奇异
            // A 出现在 0 和 3，B 在 1。to 向右找最近的 from：A(3) 距离 B 为 2
            const line = createLine([10, 20, 30, 10])
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 1, toIdx: 3 })
        })

        it('奇异点连续出现多次时应找最近的', () => {
            // pts: A(10) - A(10) - B(20) - A(10) - C(30)
            // from=B(20) 非奇异, to=A(10) 奇异
            // A 出现在 0,1,3，B 在 2。to 向右找最近的 from：A(3) 距离 B 为 1
            const line = createLine([10, 10, 20, 10, 30])
            expect(resolveSliceEndpoints(line, 20, 10)).toEqual({ fromIdx: 2, toIdx: 3 })
        })

        it('from 奇异连续出现多次向左找最近的 to', () => {
            // pts: B(20) - A(10) - A(10) - C(30) - A(10)
            // from=A(10) 奇异, to=C(30) 非奇异
            // A 出现在 1,2,4，C 在 3。from 向左找最近的 to：A(2) 距离 C 为 1
            const line = createLine([20, 10, 10, 30, 10])
            expect(resolveSliceEndpoints(line, 10, 30)).toEqual({ fromIdx: 2, toIdx: 3 })
        })
    })
})
