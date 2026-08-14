import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useNameSearchStore } from '@/models/stores/nameSearchStore'
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig'
import {
  resetIdCounter,
  createPoint,
  createLine,
  createEmptySave
} from '../../helpers/saveFactory'

// 默认重名距离阈值（editorLocalConfig.duplicateNameDistThrs 的默认值）
const DEFAULT_THRS = 200

describe('nameSearchStore - ptFarEnough', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  it('距离大于阈值时应返回 true', () => {
    const store = useNameSearchStore()
    const p0 = { ...createPoint(1), pos: [0, 0] as [number, number] }
    const p1 = { ...createPoint(2), pos: [0, DEFAULT_THRS + 100] as [number, number] }

    expect(store.ptFarEnough(p0, p1)).toBe(true)
  })

  it('距离小于阈值时应返回 false', () => {
    const store = useNameSearchStore()
    const p0 = { ...createPoint(1), pos: [0, 0] as [number, number] }
    const p1 = { ...createPoint(2), pos: [0, DEFAULT_THRS - 100] as [number, number] }

    expect(store.ptFarEnough(p0, p1)).toBe(false)
  })

  it('距离恰好等于阈值时应返回 false（要求严格大于）', () => {
    const store = useNameSearchStore()
    const p0 = { ...createPoint(1), pos: [0, 0] as [number, number] }
    const p1 = { ...createPoint(2), pos: [0, DEFAULT_THRS] as [number, number] }

    expect(store.ptFarEnough(p0, p1)).toBe(false)
  })

  it('修改阈值配置后应按新阈值判断', () => {
    const editorLocalConfig = useEditorLocalConfigStore()
    editorLocalConfig.duplicateNameDistThrs = 50
    const store = useNameSearchStore()
    const p0 = { ...createPoint(1), pos: [0, 0] as [number, number] }
    const p1 = { ...createPoint(2), pos: [0, 100] as [number, number] }

    expect(store.ptFarEnough(p0, p1)).toBe(true)
  })
})

describe('nameSearchStore - findDuplicateAndFarEnough', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('没有存档时应返回 undefined', () => {
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })

  it('没有重名站点时应返回 undefined', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '积水潭'), pos: [0, 500] }
      ],
      lines: [createLine([1, 2])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })

  it('重名且距离足够远时应返回该站名', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [createLine([1, 2])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBe('西直门')
  })

  it('重名但距离不足时应返回 undefined（可能是换乘站簇）', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 100] }
      ],
      lines: [createLine([1, 2])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })

  it('站名两端有空白时应视为同名', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '  西直门  '), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [createLine([1, 2])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBe('西直门')
  })

  it('重名双方都在伪线上时应返回 undefined（伪线站点不参与判断）', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [createLine([1, 2], { isFake: true })]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })

  it('重名一方只在伪线上时应返回 undefined', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [
        createLine([1]),
        createLine([2], { isFake: true })
      ]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })

  it('点同时属于伪线和普通线路时不应被排除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [
        createLine([1, 2]),
        createLine([1, 2], { isFake: true })
      ]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBe('西直门')
  })

  it('无线路的孤立点仍应参与重名判断', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: []
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBe('西直门')
  })

  it('有多组重名时应跳过距离不足的，返回距离足够的那组', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 100] },
        { ...createPoint(3, '积水潭'), pos: [500, 0] },
        { ...createPoint(4, '积水潭'), pos: [500, 500] }
      ],
      lines: [createLine([1, 2, 3, 4])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBe('积水潭')
  })

  it('修改阈值配置后应按新阈值判断', () => {
    const editorLocalConfig = useEditorLocalConfigStore()
    editorLocalConfig.duplicateNameDistThrs = 600
    const save = createEmptySave({
      points: [
        { ...createPoint(1, '西直门'), pos: [0, 0] },
        { ...createPoint(2, '西直门'), pos: [0, 500] }
      ],
      lines: [createLine([1, 2])]
    })
    setupSaveStore(save)
    const store = useNameSearchStore()

    expect(store.findDuplicateAndFarEnough()).toBeUndefined()
  })
})
