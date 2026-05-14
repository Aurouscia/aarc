import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useLineSpanStore } from '@/models/stores/saveDerived/lineSpanStore'
import {
  resetIdCounter,
  createPoint,
  createLine,
  createStyleSlice,
  createTimeSlice,
  createLineStyle,
  createEmptySave
} from '../../helpers/saveFactory'

describe('lineSpanStore', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  // ============ 基础场景：无 slice ============
  describe('flattenLine - 无 slice', () => {
    it('线路有3个点且无slice时应生成单个span覆盖整条线路', () => {
      const pts = [10, 20, 30]
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [createLine(pts)]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(save.lines[0])

      expect(result.spans).toHaveLength(1)
      expect(result.spans[0]).toEqual({ fromIdx: 0, toIdx: 2, fromPt: 10, toPt: 30 })
    })

    it('线路只有1个点时应返回空spans', () => {
      const pts = [10]
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [createLine(pts)]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(save.lines[0])

      expect(result.spans).toHaveLength(0)
    })

    it('线路有5个点且无slice时应生成单个span覆盖整条线路', () => {
      const pts = [1, 2, 3, 4, 5]
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [createLine(pts)]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(save.lines[0])

      expect(result.spans).toHaveLength(1)
      expect(result.spans[0]).toEqual({ fromIdx: 0, toIdx: 4, fromPt: 1, toPt: 5 })
    })
  })

  // ============ StyleSlice 场景 ============
  describe('flattenLine - 单个 StyleSlice', () => {
    it('StyleSlice 覆盖整条线路时，所有 span 都应有 styleSliceId', () => {
      const pts = [10, 20, 30, 40]
      const line = createLine(pts)
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 10, toPt: 40, style: 100 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      expect(result.spans).toHaveLength(1)
      expect(result.spans[0].styleSliceId).toBe(styleSlice.id)
      expect(result.spans[0].fromPt).toBe(10)
      expect(result.spans[0].toPt).toBe(40)
    })

    it('StyleSlice 只覆盖中间部分时，只有中间 span 有 styleSliceId', () => {
      const pts = [10, 20, 30, 40, 50]
      const line = createLine(pts)
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 20, toPt: 40, style: 100 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      // 切割点: 10, 20, 40, 50 → spans: [10-20], [20-40], [40-50]
      expect(result.spans).toHaveLength(3)
      expect(result.spans[0].styleSliceId).toBeUndefined() // 10-20
      expect(result.spans[1].styleSliceId).toBe(styleSlice.id) // 20-40 (含30)
      expect(result.spans[2].styleSliceId).toBeUndefined() // 40-50
    })

    it('StyleSlice 只覆盖一个区间（相邻两点）时', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 10, toPt: 20, style: 100 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      expect(result.spans).toHaveLength(2)
      expect(result.spans[0].styleSliceId).toBe(styleSlice.id)
      expect(result.spans[1].styleSliceId).toBeUndefined()
    })
  })

  // ============ TimeSlice 场景 ============
  describe('flattenLine - 单个 TimeSlice', () => {
    it('TimeSlice 覆盖中间部分时，只有中间 span 有 timeSliceId', () => {
      const pts = [10, 20, 30, 40, 50]
      const line = createLine(pts)
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 20,
        toPt: 40,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      expect(result.spans).toHaveLength(3)
      expect(result.spans[0].timeSliceId).toBeUndefined()  // 10-20
      expect(result.spans[1].timeSliceId).toBe(timeSlice.id)  // 20-40 (含30)
      expect(result.spans[2].timeSliceId).toBeUndefined()  // 40-50
    })
  })

  // ============ StyleSlice + TimeSlice 交叉场景 ============
  describe('flattenLine - StyleSlice 与 TimeSlice 交叉', () => {
    it('不同 slice 类型交叉时，span 应同时携带两种 sliceId', () => {
      const pts = [10, 20, 30, 40, 50, 60]
      const line = createLine(pts)
      // StyleSlice: 20 → 40
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 20, toPt: 40, style: 100 })
      // TimeSlice: 30 → 50
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 30,
        toPt: 50,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      // 切割点: 10, 20, 30, 40, 50, 60
      // spans: [10-20], [20-30], [30-40], [40-50], [50-60]
      expect(result.spans).toHaveLength(5)

      // 10-20: 无
      expect(result.spans[0].styleSliceId).toBeUndefined()
      expect(result.spans[0].timeSliceId).toBeUndefined()

      // 20-30: 只有 style
      expect(result.spans[1].styleSliceId).toBe(styleSlice.id)
      expect(result.spans[1].timeSliceId).toBeUndefined()

      // 30-40: style + time 交叉
      expect(result.spans[2].styleSliceId).toBe(styleSlice.id)
      expect(result.spans[2].timeSliceId).toBe(timeSlice.id)

      // 40-50: 只有 time
      expect(result.spans[3].styleSliceId).toBeUndefined()
      expect(result.spans[3].timeSliceId).toBe(timeSlice.id)

      // 50-60: 无
      expect(result.spans[4].styleSliceId).toBeUndefined()
      expect(result.spans[4].timeSliceId).toBeUndefined()
    })
  })

  // ============ 多个同类型 slice（不重叠） ============
  describe('flattenLine - 多个不重叠的 StyleSlice', () => {
    it('两个不连续的 StyleSlice 应各自覆盖对应区间', () => {
      const pts = [10, 20, 30, 40, 50, 60, 70]
      const line = createLine(pts)
      const styleSlice1 = createStyleSlice({ line: line.id, fromPt: 10, toPt: 20, style: 100 })
      const styleSlice2 = createStyleSlice({ line: line.id, fromPt: 40, toPt: 60, style: 200 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice1, styleSlice2]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      // 切割点: 10, 20, 40, 60, 70
      expect(result.spans).toHaveLength(4)
      expect(result.spans[0].styleSliceId).toBe(styleSlice1.id) // 10-20
      expect(result.spans[1].styleSliceId).toBeUndefined()       // 20-40
      expect(result.spans[2].styleSliceId).toBe(styleSlice2.id)  // 40-60
      expect(result.spans[3].styleSliceId).toBeUndefined()       // 60-70
    })
  })

  // ============ 反向 slice（fromPt > toPt） ============
  describe('flattenLine - 反向 slice', () => {
    it('fromPt 在 toPt 之后的 StyleSlice 应正确识别覆盖范围', () => {
      const pts = [10, 20, 30, 40]
      const line = createLine(pts)
      // 反向：fromPt=40, toPt=20（实际覆盖 20→40）
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 40, toPt: 20, style: 100 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.flattenLine(line)

      // 切割点: 10, 20, 40
      expect(result.spans).toHaveLength(2)
      expect(result.spans[0].styleSliceId).toBeUndefined()      // 10-20
      expect(result.spans[1].styleSliceId).toBe(styleSlice.id)  // 20-40
    })
  })

  // ============ 多条线路 ============
  describe('allFlattened - 多条线路', () => {
    it('应正确扁平化所有线路', () => {
      const pts1 = [10, 20, 30]
      const pts2 = [100, 200, 300, 400]
      const line1 = createLine(pts1)
      const line2 = createLine(pts2)
      const styleSlice = createStyleSlice({ line: line2.id, fromPt: 100, toPt: 300, style: 100 })
      const save = createEmptySave({
        points: [...pts1, ...pts2].map(id => createPoint(id)),
        lines: [line1, line2],
        styleSlices: [styleSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const all = store.allFlattened

      expect(all).toHaveLength(2)
      expect(all[0].lineId).toBe(line1.id)
      expect(all[0].spans).toHaveLength(1)
      expect(all[0].spans[0].styleSliceId).toBeUndefined()

      expect(all[1].lineId).toBe(line2.id)
      expect(all[1].spans).toHaveLength(2)
      expect(all[1].spans[0].styleSliceId).toBe(styleSlice.id)
      expect(all[1].spans[1].styleSliceId).toBeUndefined()
    })
  })

  // ============ getSpanStyle / getSpanTime ============
  describe('getSpanStyle', () => {
    it('应返回正确的 styleSlice 和 lineStyle', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const styleSlice = createStyleSlice({ line: line.id, fromPt: 10, toPt: 20, style: 100 })
      const lineStyle = createLineStyle(100, '测试样式')
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        styleSlices: [styleSlice],
        lineStyles: [lineStyle]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanStyle(line.id, 0)

      expect(result).toBeDefined()
      expect(result!.styleSlice).toEqual(styleSlice)
      expect(result!.style).toEqual(lineStyle)
    })

    it('无 styleSlice 但 Line 有 style 时应回退到 Line.style', () => {
      const pts = [10, 20, 30]
      const lineStyle = createLineStyle(100, '线路默认样式')
      const line = createLine(pts, { style: 100 })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        lineStyles: [lineStyle]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanStyle(line.id, 0)

      expect(result).toBeDefined()
      expect(result!.styleSlice).toBeUndefined()
      expect(result!.style).toEqual(lineStyle)
      expect(result!.fromLine).toBe(true)
    })

    it('无 styleSlice 且 Line 无 style 时应返回 undefined', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanStyle(line.id, 0)

      expect(result).toBeUndefined()
    })
  })

  describe('getSpanTime', () => {
    it('应返回正确的 timeSlice', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 20,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanTime(line.id, 0)

      expect(result).toBeDefined()
      expect(result!.timeSlice).toEqual(timeSlice)
      expect(result!.time).toEqual(timeSlice.time)
    })

    it('无 timeSlice 但 Line 有 time 时应回退到 Line.time', () => {
      const pts = [10, 20, 30]
      const lineTime = { open: new Date('2025-01-01').getTime() }
      const line = createLine(pts, { time: lineTime })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanTime(line.id, 0)

      expect(result).toBeDefined()
      expect(result!.timeSlice).toBeUndefined()
      expect(result!.time).toEqual(lineTime)
      expect(result!.fromLine).toBe(true)
    })

    it('无 timeSlice 且 Line 无 time 时应返回 undefined', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line]
      })
      setupSaveStore(save)
      const store = useLineSpanStore()

      const result = store.getSpanTime(line.id, 0)

      expect(result).toBeUndefined()
    })
  })
})
