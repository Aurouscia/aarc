import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSaveStore } from '@/models/stores/saveStore'
import { Save, Line, TimeSlice } from '@/models/save'
import { nextTick } from 'vue'

function createSave(lines: Line[], timeSlices: TimeSlice[] = []): Save {
    return {
        idIncre: 1,
        points: [],
        lines,
        textTags: [],
        cvsSize: [1000, 1000],
        config: {},
        meta: {},
        timeSlices,
    } as Save
}

describe('saveStore linePtsChanged watch', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('修改线路 pts 应触发 linePtsChanged 回调', async () => {
        const saveStore = useSaveStore()
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save = createSave([line])

        // 等待 watch 初次触发，记录快照
        await nextTick()

        const changedLineIds: number[][] = []
        saveStore.linePtsChanged = (ids: number[]) => {
            changedLineIds.push(ids)
        }

        // 修改 pts（需要触发 save 的响应式更新）
        saveStore.save.lines[0].pts.push(40)
        await nextTick()

        expect(changedLineIds).toHaveLength(1)
        expect(changedLineIds[0]).toEqual([1])
    })

    it('未修改 pts 不应触发回调', async () => {
        const saveStore = useSaveStore()
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save = createSave([line])

        await nextTick()

        const changedLineIds: number[][] = []
        saveStore.linePtsChanged = (ids: number[]) => {
            changedLineIds.push(ids)
        }

        // 不修改任何东西
        await nextTick()

        expect(changedLineIds).toHaveLength(0)
    })

    it('修改线路其他属性（如 name）不应触发回调', async () => {
        const saveStore = useSaveStore()
        const line: Line = { id: 1, pts: [10, 20, 30], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save = createSave([line])

        await nextTick()

        const changedLineIds: number[][] = []
        saveStore.linePtsChanged = (ids: number[]) => {
            changedLineIds.push(ids)
        }

        line.name = '新名称'
        await nextTick()

        expect(changedLineIds).toHaveLength(0)
    })

    it('新增线路不应触发回调', async () => {
        const saveStore = useSaveStore()
        const line1: Line = { id: 1, pts: [10, 20], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save = createSave([line1])

        await nextTick()

        const changedLineIds: number[][] = []
        saveStore.linePtsChanged = (ids: number[]) => {
            changedLineIds.push(ids)
        }

        const line2: Line = { id: 2, pts: [30, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save.lines.push(line2)
        await nextTick()

        expect(changedLineIds).toHaveLength(0)
    })

    it('删除线路不应触发回调', async () => {
        const saveStore = useSaveStore()
        const line1: Line = { id: 1, pts: [10, 20], name: '', nameSub: '', color: '', type: 0 } as Line
        const line2: Line = { id: 2, pts: [30, 40], name: '', nameSub: '', color: '', type: 0 } as Line
        saveStore.save = createSave([line1, line2])

        await nextTick()

        const changedLineIds: number[][] = []
        saveStore.linePtsChanged = (ids: number[]) => {
            changedLineIds.push(ids)
        }

        saveStore.save.lines.splice(1, 1)
        await nextTick()

        expect(changedLineIds).toHaveLength(0)
    })
})
