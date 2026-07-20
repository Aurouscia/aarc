import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore'
import { ControlPointLinkType, ControlPointSta } from '@/models/save'
// 注意：虽然代码不再限制 link 类型，但测试中仍使用 ControlPointLinkType 来创建不同类型的 link
import {
  resetIdCounter,
  createPoint,
  createLine,
  createEmptySave
} from '../../helpers/saveFactory'

describe('staClusterStore - getStaName', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('点本身有名称时应返回该名称', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '天安门东', nameS: 'Tiananmen East' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('天安门东')
    expect(result.nameSub).toBe('Tiananmen East')
    expect(result.ptId).toBe(1)
  })

  it('点本身无名称时应返回 #ptId 作为回退', () => {
    const save = createEmptySave({
      points: [createPoint(1)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('#1')
    expect(result.nameSub).toBe('')
    expect(result.ptId).toBe(1)
  })

  it('点本身无名称但同 cluster 中其他点有名称时应返回 cluster 中的名称', () => {
    // 两个点位置非常接近，会被聚类到同一个 cluster
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直门', nameS: 'Xizhimen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    // ptId=1 本身无名称，但和 ptId=2 在同一个 cluster
    const result = store.getStaName(1)

    expect(result.name).toBe('西直门')
    expect(result.nameSub).toBe('Xizhimen')
    expect(result.ptId).toBe(2)
  })

  it('名称中的换行符应被移除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '天安门\n东', nameS: 'Tiananmen\nEast' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('天安门东')
    expect(result.nameSub).toBe('TiananmenEast')
  })

  it('同 cluster 中其他点的名称换行符也应被移除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直\n门', nameS: 'Xizhi\nmen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('西直门')
    expect(result.nameSub).toBe('Xizhimen')
  })

  it('不存在的点应返回 #ptId', () => {
    const save = createEmptySave({
      points: []
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(999)

    expect(result.name).toBe('#999')
    expect(result.nameSub).toBe('')
    expect(result.ptId).toBe(999)
  })

  it('点本身有名称时优先使用自身名称，不查找 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门', nameS: 'Dongzhimen' },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直门', nameS: 'Xizhimen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('东直门')
    expect(result.nameSub).toBe('Dongzhimen')
    expect(result.ptId).toBe(1)
  })

  it('nameS 为 undefined 时应返回空字符串', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '朝阳门', nameS: undefined }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('朝阳门')
    expect(result.nameSub).toBe('')
  })

  describe('通过 ptLink 跨 cluster 查找名称', () => {
    it('通过 cluster 类型的 ptLink 直接相连的 cluster 应能获取名称', () => {
      // cluster A: pt1(无名) + pt2(无名) —— 位置接近形成 cluster
      // cluster B: pt3(有名) —— 单独一个点
      // ptLink: pt2(cluster A) --cluster-- pt3(cluster B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京南站', nameS: 'Beijing South' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('Beijing South')
      expect(result.ptId).toBe(3)
    })

    it('间接相连（A-B-C）应能获取到 C 的名称', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(无名) + pt4(无名)
      // cluster C: pt5(有名)
      // ptLink: pt2(A) --cluster-- pt3(B), pt4(B) --cluster-- pt5(C)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100] },
          { ...createPoint(4), pos: [100.5, 100.5] },
          { ...createPoint(5), pos: [200, 200], name: '西单', nameS: 'Xidan' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster },
          { pts: [4, 5], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      // 从 cluster A 的 pt1 查找，应通过 B 找到 C 的名称
      const result = store.getStaName(1)

      expect(result.name).toBe('西单')
      expect(result.nameSub).toBe('Xidan')
      expect(result.ptId).toBe(5)
    })

    it('优先返回本 cluster 中的名称，而非跨 cluster 查找', () => {
      // cluster A: pt1(无名) + pt2(有名)
      // cluster B: pt3(有名)
      // ptLink: pt2(A) --cluster-- pt3(B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5], name: '东直门', nameS: 'Dongzhimen' },
          { ...createPoint(3), pos: [100, 100], name: '西直门', nameS: 'Xizhimen' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // 应优先返回同 cluster 的东直门，而不是跨 cluster 的西直门
      expect(result.name).toBe('东直门')
      expect(result.nameSub).toBe('Dongzhimen')
      expect(result.ptId).toBe(2)
    })

    it('任何类型的 ptLink 都应支持名称传导', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(有名)
      // ptLink: pt2(A) --fat-- pt3(B) （非 cluster 类型，但现在任何类型都支持）
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '天安门东', nameS: 'Tiananmen East' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.fat }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // fat 类型的 link 现在也应支持跨 cluster 名称传导
      expect(result.name).toBe('天安门东')
      expect(result.nameSub).toBe('Tiananmen East')
      expect(result.ptId).toBe(3)
    })

    it('多个 cluster 通过 ptLink 形成网状结构时应正确找到最近的有名 cluster', () => {
      // cluster A: pt1(无名)
      // cluster B: pt2(有名) —— 距离 A 1 跳
      // cluster C: pt3(有名) —— 距离 A 2 跳
      // ptLink: pt1(A) --cluster-- pt2(B), pt1(A) --cluster-- pt3(C)
      // BFS 应先访问 B，返回 B 的名称
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [100, 0], name: '建国门', nameS: 'Jianguomen' },
          { ...createPoint(3), pos: [200, 0], name: '永安里', nameS: 'Yonganli' }
        ],
        pointLinks: [
          { pts: [1, 2], type: ControlPointLinkType.cluster },
          { pts: [1, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // BFS 先访问直接相连的 cluster B
      expect(result.name).toBe('建国门')
      expect(result.ptId).toBe(2)
    })

    it('所有可达 cluster 都无名称时应返回 #ptId', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(无名) + pt4(无名)
      // ptLink: pt2(A) --cluster-- pt3(B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100] },
          { ...createPoint(4), pos: [100.5, 100.5] }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('#1')
      expect(result.nameSub).toBe('')
      expect(result.ptId).toBe(1)
    })

    it('跨 cluster 获取的名称换行符也应被移除', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('BeijingSouth')
    })
  })

  describe('raw 参数', () => {
    it('raw=true 时应保留换行符', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, true)

      expect(result.name).toBe('北京\n南站')
      expect(result.nameSub).toBe('Beijing\nSouth')
    })

    it('raw=true 时跨 cluster 名称也应保留换行符', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, true)

      expect(result.name).toBe('北京\n南站')
      expect(result.nameSub).toBe('Beijing\nSouth')
    })

    it('raw=false 时应移除换行符（与默认行为一致）', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, false)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('BeijingSouth')
    })
  })
})


describe('staClusterStore - getStaClusters', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('默认位置相邻点应聚成同一个 cluster', () => {
    const save = createEmptySave({
      points: [createPoint(1), createPoint(2), createPoint(3)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2, 3])
  })

  it('距离超过吸附阈值的点不应聚类', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(0)
  })

  it('非 sta 状态的点不应参与聚类', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0], sta: ControlPointSta.plain },
        { ...createPoint(3), pos: [1, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 3])
  })

  it('链状点集应聚成同一个 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [20, 0] },
        { ...createPoint(3), pos: [40, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2, 3])
  })

  it('动态尺寸应影响 cluster 吸附距离', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [40, 0] }
      ],
      lines: [
        createLine([1], { ptSnapSize: 3 })
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    // 默认吸附距离 25，点 1 尺寸放大到 3 后吸附距离变为 25 * ((3+1)/2) = 50，40 < 50 应聚类
    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2])
  })
})

describe('staClusterStore - updateClustersBecauseOf', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('将点移动靠近另一孤立点时应形成新 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const pt2 = save.points.find(p => p.id === 2)!
    pt2.pos = [0.5, 0]
    store.updateClustersBecauseOf(pt2)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it('将点移远离 cluster 时应与原点断开连接', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0] },
        { ...createPoint(3), pos: [100, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const pt2 = save.points.find(p => p.id === 2)!
    pt2.pos = [100, 0]
    store.updateClustersBecauseOf(pt2)

    // 点 1 孤立，不再与点 2/3 同 cluster；点 2 与点 3 聚类
    expect(store.getStaClusterById(1).map(p => p.id)).toEqual([1])
    expect(store.getStaClusterById(2).map(p => p.id).sort((a, b) => a - b)).toEqual([2, 3])
  })

  it('将点的 sta 改为 plain 时应从 cluster 中移除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const pt2 = save.points.find(p => p.id === 2)!
    pt2.sta = ControlPointSta.plain
    store.updateClustersBecauseOf(pt2)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(0)
  })

  it('将点的 sta 改为 sta 时应重新参与聚类', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0], sta: ControlPointSta.plain }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const pt2 = save.points.find(p => p.id === 2)!
    pt2.sta = ControlPointSta.sta
    store.updateClustersBecauseOf(pt2)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2])
  })
})

describe('staClusterStore - cleanClustersFromDeletedPt', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('删除 cluster 中一个点后其余点若仍相邻则应保留 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [10, 0] },
        { ...createPoint(3), pos: [5, 10] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const saveStore = useSaveStore()
    saveStore.deletedPoint(2)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 3])
  })

  it('删除 cluster 中所有点后 cluster 应为空', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [10, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const saveStore = useSaveStore()
    saveStore.deletedPoint(1)
    saveStore.deletedPoint(2)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(0)
  })
})

describe('staClusterStore - tryTransferStaNameWithinCluster', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('名称位置离 cluster 内其他点近得多时应转移名称', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门', nameP: [20, 0] },
        { ...createPoint(2), pos: [10, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const pt1 = save.points.find(p => p.id === 1)!
    const transferred = store.tryTransferStaNameWithinCluster(pt1)

    expect(transferred).toBeDefined()
    expect(transferred!.id).toBe(2)
    expect(transferred!.name).toBe('东直门')
    expect(transferred!.nameP).toEqual([10, 0])
  })

  it('名称位置没有明显更近时不应转移名称', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门', nameP: [15, 0] },
        { ...createPoint(2), pos: [0.5, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const pt1 = save.points.find(p => p.id === 1)!
    const transferred = store.tryTransferStaNameWithinCluster(pt1)

    expect(transferred).toBeUndefined()
  })

  it('点没有 nameP 时不应转移', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门' },
        { ...createPoint(2), pos: [10, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const pt1 = save.points.find(p => p.id === 1)!
    const transferred = store.tryTransferStaNameWithinCluster(pt1)

    expect(transferred).toBeUndefined()
  })

  it('cluster 中只有一个点时不应转移', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门', nameP: [20, 0] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const pt1 = save.points.find(p => p.id === 1)!
    const transferred = store.tryTransferStaNameWithinCluster(pt1)

    expect(transferred).toBeUndefined()
  })
})

describe('staClusterStore - getMaxSizePtWithinCluster', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('单点且无线路时返回默认尺寸 1', () => {
    const save = createEmptySave({
      points: [createPoint(1)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.getMaxSizePtWithinCluster(1, 'ptSize')).toBe(1)
    expect(store.getMaxSizePtWithinCluster(1, 'ptNameSize')).toBe(1)
    expect(store.getMaxSizePtWithinCluster(1, 'ptNameSnapSize')).toBe(1)
  })

  it('cluster 内应返回指定类型的最大尺寸', () => {
    const save = createEmptySave({
      points: [
        createPoint(1),
        createPoint(2)
      ],
      lines: [
        createLine([1], { ptSize: 2, ptNameSize: 3, ptNameSnapSize: 4 }),
        createLine([2], { ptSize: 5, ptNameSize: 6, ptNameSnapSize: 7 })
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    store.getStaClusters() // 确保聚类已初始化

    expect(store.getMaxSizePtWithinCluster(1, 'ptSize')).toBe(5)
    expect(store.getMaxSizePtWithinCluster(1, 'ptNameSize')).toBe(6)
    expect(store.getMaxSizePtWithinCluster(1, 'ptNameSnapSize')).toBe(7)
  })
})

describe('staClusterStore - getRectOfCluster', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('应返回 cluster 的四角点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [10, 10] },
        { ...createPoint(3), pos: [10, 0] },
        { ...createPoint(4), pos: [0, 10] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const cluster = store.getStaClusters()![0]
    const rect = store.getRectOfCluster(cluster)

    expect(rect).toEqual([
      [10, 10],
      [10, 0],
      [0, 10],
      [0, 0]
    ])
  })

  it('cluster 为 undefined 时应返回空数组', () => {
    const save = createEmptySave({ points: [] })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.getRectOfCluster(undefined)).toEqual([])
  })
})

describe('staClusterStore - getStaClusterById and isPtSingle', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('getStaClusterById 应返回点所在的 cluster', () => {
    const save = createEmptySave({
      points: [createPoint(1), createPoint(2), createPoint(3)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const cluster = store.getStaClusterById(2)
    expect(cluster.map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2, 3])
  })

  it('getStaClusterById 对孤立点应返回单点数组', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const cluster = store.getStaClusterById(2)
    expect(cluster.map(p => p.id)).toEqual([2])
  })

  it('getStaClusterById 对不存在的点应返回空数组', () => {
    const save = createEmptySave({ points: [] })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.getStaClusterById(999)).toEqual([])
  })

  it('isPtSingle 对孤立点应返回 true', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.isPtSingle(2)).toBe(true)
  })

  it('isPtSingle 对 cluster 中的点应返回 false', () => {
    const save = createEmptySave({
      points: [createPoint(1), createPoint(2)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.isPtSingle(1)).toBe(false)
  })

  it('isPtSingle 对不存在的点应返回 false', () => {
    const save = createEmptySave({ points: [] })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.isPtSingle(999)).toBe(false)
  })
})

describe('staClusterStore - clearItems', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('clearItems 后再次访问应重新初始化聚类', () => {
    const save = createEmptySave({
      points: [createPoint(1), createPoint(2)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    store.getStaClusters()
    store.clearItems()

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(1)
    expect(clusters![0].map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2])
  })
})
