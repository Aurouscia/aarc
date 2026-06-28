import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore'
import { getStaColorFromSpan } from '@/models/cvs/workers/pointCvsWorker'
import {
  resetIdCounter,
  createPoint,
  createLine,
  createTimeSlice,
  createEmptySave
} from '../../helpers/saveFactory'

function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
  const saveStore = useSaveStore()
  saveStore.save = save
  return saveStore
}

function enableTimePreview(moment: number) {
  const renderOptions = useRenderOptionsStore()
  renderOptions.exporting = true
  renderOptions.timeMoment = moment
  renderOptions.timeConfig = { enabledPreview: true }
}

describe('pointCvsWorker - getStaColorFromSpan', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  it('无 slice 时应返回线路基础色', () => {
    const pts = [10, 20, 30]
    const line = createLine(pts, { color: '#ff0000' })
    const save = createEmptySave({
      points: pts.map(id => createPoint(id)),
      lines: [line]
    })
    setupSaveStore(save)

    expect(getStaColorFromSpan(line, 20)).toBe('#ff0000')
  })

  it('站点在单个未开通 span 内部时应返回淡化色', () => {
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
    setupSaveStore(save)
    enableTimePreview(new Date('2025-01-01').getTime())

    expect(getStaColorFromSpan(line, 20)).toBe('#CCCCCC')
  })

  it('站点在已开通 span 内部时应返回原色', () => {
    const pts = [10, 20, 30]
    const line = createLine(pts, { color: '#ff0000' })
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
    enableTimePreview(new Date('2025-01-01').getTime())

    expect(getStaColorFromSpan(line, 20)).toBe('#ff0000')
  })

  it('站点在未开通与已开通 span 交界处时，应返回原色（任一相邻 span 未淡化则不淡化）', () => {
    // pts: 10, 20, 30, 40
    // TimeSlice 10-30 未开通，30-40 无 slice（默认已开通）
    // 切割点：10, 30, 40 → spans: 0(10-30), 1(30-40)
    // 站点 30 是 span0 的 toIdx，也是 span1 的 fromIdx
    const pts = [10, 20, 30, 40]
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
    setupSaveStore(save)
    enableTimePreview(new Date('2025-01-01').getTime())

    expect(getStaColorFromSpan(line, 30)).toBe('#ff0000')
  })

  it('站点在两条未开通 span 交界处时，应返回淡化色', () => {
    // pts: 10, 20, 30, 40
    // TimeSlice1 10-30 未开通，TimeSlice2 30-40 未开通
    // 站点 30 位于两个未开通 span 的交界处
    const pts = [10, 20, 30, 40]
    const line = createLine(pts, { color: '#ff0000' })
    const timeSlice1 = createTimeSlice({
      line: line.id,
      fromPt: 10,
      toPt: 30,
      time: { open: new Date('2030-01-01').getTime() }
    })
    const timeSlice2 = createTimeSlice({
      line: line.id,
      fromPt: 30,
      toPt: 40,
      time: { open: new Date('2035-01-01').getTime() }
    })
    const save = createEmptySave({
      points: pts.map(id => createPoint(id)),
      lines: [line],
      timeSlices: [timeSlice1, timeSlice2]
    })
    setupSaveStore(save)
    enableTimePreview(new Date('2025-01-01').getTime())

    expect(getStaColorFromSpan(line, 30)).toBe('#CCCCCC')
  })

  it('线路端点只参考唯一相邻 span', () => {
    const pts = [10, 20, 30]
    const line = createLine(pts, { color: '#ff0000' })
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
    enableTimePreview(new Date('2025-01-01').getTime())

    // 切割点：10, 20, 30 → spans: 0(10-20) 未开通, 1(20-30) 已开通
    expect(getStaColorFromSpan(line, 10)).toBe('#CCCCCC')
    expect(getStaColorFromSpan(line, 30)).toBe('#ff0000')
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

    const renderOptions = useRenderOptionsStore()
    renderOptions.exporting = false
    renderOptions.timeMoment = undefined
    renderOptions.timeConfig = { enabledPreview: false }

    setupSaveStore(save)

    expect(getStaColorFromSpan(line, 20)).toBe('#ff0000')
  })

  it('站点不在线路上时应返回 undefined', () => {
    const pts = [10, 20, 30]
    const line = createLine(pts, { color: '#ff0000' })
    const save = createEmptySave({
      points: pts.map(id => createPoint(id)),
      lines: [line]
    })
    setupSaveStore(save)

    expect(getStaColorFromSpan(line, 999)).toBeUndefined()
  })
})
