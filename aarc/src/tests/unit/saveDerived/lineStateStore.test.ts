import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useLineStateStore } from '@/models/stores/saveDerived/state/lineStateStore'
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore'
import {
  resetIdCounter,
  createPoint,
  createLine,
  createTimeSlice,
  createStyleSlice,
  createEmptySave
} from '../../helpers/saveFactory'

describe('lineStateStore - span level', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  describe('getSpanActualColor', () => {
    it('无 slice 时应返回线路基础色', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts, { color: '#ff0000' })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      expect(store.getSpanActualColor(line.id, 0)).toBe('#ff0000')
    })

    it('TimeSlice 已开通时应返回原色', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2020-01-01').getTime() } // 已开通
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      // 设置 effectiveTimeMoment 为 2025年（在开通之后）
      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      expect(store.getSpanActualColor(line.id, 0)).toBe('#ff0000')
    })

    it('TimeSlice 未开通时应返回淡化色', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() } // 未开通
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      const color = store.getSpanActualColor(line.id, 0)
      expect(color).toBe('#CCCCCC')
    })

    it('无 time 预览时应返回原色（即使 time.open 在未来）', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })

      // 先设置 renderOptions（在 setupSaveStore 之前，避免 lineActualColors computed 缓存旧值）
      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = false
      renderOptions.timeMoment = undefined
      renderOptions.timeConfig = { enabledPreview: false }

      setupSaveStore(save)
      const store = useLineStateStore()

      expect(store.getSpanActualColor(line.id, 0)).toBe('#ff0000')
    })

    it('多个 span 时各 span 独立判断颜色', () => {
      // 4 个点: 10, 20, 30, 40
      // TimeSlice 覆盖 10-30，切割点为 10, 30, 40
      // 生成 2 个 spans: span0(10-30), span1(30-40)
      const pts = [10, 20, 30, 40]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() } // 未开通
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      // span 0 (10-30) 在 TimeSlice 覆盖范围内，未开通 → 淡化
      expect(store.getSpanActualColor(line.id, 0)).toBe('#CCCCCC')
      // span 1 (30-40) 不在 TimeSlice 覆盖范围内，无时间限制 → 原色
      expect(store.getSpanActualColor(line.id, 1)).toBe('#ff0000')
    })

    it('两种 span 交叉（TimeSlice 端点在线路中间）', () => {
      // 5 个点: 10, 20, 30, 40, 50
      // 两个 TimeSlice 交叉：
      // - slice1: 10-30, open=2020（已开通）
      // - slice2: 30-50, open=2030（未开通）
      // 切割点：10, 30, 50 → 2 个 spans: 0(10-30), 1(30-50)
      const pts = [10, 20, 30, 40, 50]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice1 = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2020-01-01').getTime() } // 已开通
      })
      const timeSlice2 = createTimeSlice({
        line: line.id,
        fromPt: 30,
        toPt: 50,
        time: { open: new Date('2030-01-01').getTime() } // 未开通
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice1, timeSlice2]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      // span 0 (10-30): slice1 已开通 → 原色
      expect(store.getSpanActualColor(line.id, 0)).toBe('#ff0000')
      // span 1 (30-50): slice2 未开通 → 淡化
      expect(store.getSpanActualColor(line.id, 1)).toBe('#CCCCCC')
    })

    it('无 TimeSlice 区域回退到 Line.time 兜底', () => {
      // 4 个点: 10, 20, 30, 40
      // TimeSlice 只覆盖 10-20（已开通），20-40 无 TimeSlice 覆盖
      // 线路自身 time: { open: 2030 }（未开通）
      // 切割点：10, 20, 40 → 2 个 spans: 0(10-20), 1(20-40)
      const pts = [10, 20, 30, 40]
      const line = createLine(pts, {
        color: '#ff0000',
        time: { open: new Date('2030-01-01').getTime() } // 线路自身 time（未开通）
      })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 20,
        time: { open: new Date('2020-01-01').getTime() } // 已开通
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      // span 0 (10-20): TimeSlice 已开通 → 原色
      expect(store.getSpanActualColor(line.id, 0)).toBe('#ff0000')
      // span 1 (20-40): 无 TimeSlice，回退到 Line.time（未开通）→ 淡化
      expect(store.getSpanActualColor(line.id, 1)).toBe('#CCCCCC')
    })

    it('TimeSlice 与 StyleSlice 交叉（不同类 slice 可重叠）', () => {
      // 5 个点: 10, 20, 30, 40, 50
      // TimeSlice 覆盖 10-30（未开通），StyleSlice 覆盖 20-50
      // 切割点：10, 20, 30, 50 → 3 个 spans: 0(10-20), 1(20-30), 2(30-50)
      // 每个 span 同时有 timeSliceId 和 styleSliceId（不同类 slice 独立）
      const pts = [10, 20, 30, 40, 50]
      const line = createLine(pts, { color: '#ff0000' })
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() } // 未开通
      })
      const styleSlice = createStyleSlice({
        line: line.id,
        fromPt: 20,
        toPt: 50,
        style: 99
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice],
        styleSlices: [styleSlice],
        lineStyles: [{ id: 99, name: '测试样式', layers: [{ color: '#00ff00' }] }]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      // span 0 (10-20): 有 timeSlice（未开通）→ 淡化（基础色 #ff0000 淡化）
      expect(store.getSpanActualColor(line.id, 0)).toBe('#CCCCCC')
      // span 1 (20-30): 既有 timeSlice（未开通）又有 styleSlice
      // 时间淡化优先于样式 → 淡化（基础色 #ff0000 淡化，不是样式色）
      expect(store.getSpanActualColor(line.id, 1)).toBe('#CCCCCC')
      // span 2 (30-50): 无 timeSlice，有 styleSlice → 原色（但此处是样式色 #00ff00）
      // getSpanActualColor 目前只处理颜色淡化，不处理样式颜色替换
      // 所以返回线路基础色 #ff0000
      expect(store.getSpanActualColor(line.id, 2)).toBe('#ff0000')
    })
  })

  describe('isSpanDownplayed', () => {
    it('TimeSlice 未开通时应返回 true', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      expect(store.isSpanDownplayed(line.id, 0)).toBe(true)
    })

    it('TimeSlice 已开通时应返回 false', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2020-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })
      setupSaveStore(save)
      const store = useLineStateStore()

      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = true
      renderOptions.timeMoment = new Date('2025-01-01').getTime()
      renderOptions.timeConfig = { enabledPreview: true }

      expect(store.isSpanDownplayed(line.id, 0)).toBe(false)
    })

    it('无 time 预览时应返回 false', () => {
      const pts = [10, 20, 30]
      const line = createLine(pts)
      const timeSlice = createTimeSlice({
        line: line.id,
        fromPt: 10,
        toPt: 30,
        time: { open: new Date('2030-01-01').getTime() }
      })
      const save = createEmptySave({
        points: pts.map(id => createPoint(id)),
        lines: [line],
        timeSlices: [timeSlice]
      })

      // 先设置 renderOptions（在 setupSaveStore 之前）
      const renderOptions = useRenderOptionsStore()
      renderOptions.exporting = false
      renderOptions.timeMoment = undefined
      renderOptions.timeConfig = { enabledPreview: false }

      setupSaveStore(save)
      const store = useLineStateStore()

      expect(store.isSpanDownplayed(line.id, 0)).toBe(false)
    })
  })
})
